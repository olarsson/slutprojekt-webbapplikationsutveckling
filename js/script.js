"use strict";

/*
  comment code
  rensa css och linta js-kod
  lägg till exempeldomäner
*/

var geocoder;
var map;
var markers = []; //Remembers the marker info for Google Maps API

var log = []; //Entries for the log are stored here
var maxtries = 0; //Number of retries performed
const maxtries_val = 2; //Maximum number of retries for getting the IPV4 address
const timeout_s = 10; //Timeout in seconds for the AJAX requests
var ajax_running = false; //Boolean that keeps track of if any AJAX requests are active


/********************************************************/

//API for ip-api.com (domain to ip + country)
var api_0 = {
  domain: '',
  ip: '',
  country: '',

  parse: function(data) {
    if (data.status == 'success') {
      this.ip = data.query;
      this.country = data.country;
      set_country(this.country);
      update_html(false);
      //Initiate the next API if all went well
      api_ip_info();

    } else {
      //request failed, throw error
      update_html(true, 'No data.');
    }    
  },

  error_func: function(textStatus, mode) {
    update_html(true, textStatus + ' ('+(parseInt(mode) + 1)+')');
  }

};

/********************************************************/

//API for cymon.io/api/nexus/v1/ip/ (ip blacklist info)
var api_1 = {
  count: 0,
  entries: [],

  parse: function(data) {
    if (data.hasOwnProperty("results")) {
      this.count = data.count;
      for (var i in data.results) {
        var temp_arr = [];
        for (var e in data.results[i]) {
          if (data.results[i].hasOwnProperty(e) && data.results[i][e]) temp_arr.push( {'title':e, 'desc':data.results[i][e]} );
        }
        this.entries.push(temp_arr);
      }
      update_html(false, '');
      api_other_domains();
    } else {
      //request failed, throw error
      update_html(true, 'No data.');
    }    
  },

  error_func: function(textStatus, mode) {
    if (api_0.ip.indexOf(':') < 0) {
      update_html(true, textStatus);
    } else {
      if (maxtries < maxtries_val) {
        maxtries++;
        add_to_log('Error, have IPV6, retrying for IPV4..');
        api_domain_to_ip_country();
      } else {
        update_html(true, 'Maximum retries reached.');
      }
    }
  }

};

/********************************************************/

//API for reverseip.logontube.com (domains hosted on ip)
var api_2 = {
  domains: [],

  parse: function(data) {
    if (data.hasOwnProperty("response")) {
      for (var i in data.response.domains) {
        if (parseInt(i) + 1 == 25) {
          break;
        } else { this.domains.push(data.response.domains[i]); }
      }
      update_html(false, '');
    } else {
      //request failed, throw error
      update_html(true, 'No data.');
    }
    //all done, show results and restore visuals
    //progress(false);    
    api_whois();
  },

  error_func: function(textStatus, mode) {
    update_html(true, textStatus + ' ('+(parseInt(mode) + 1)+')');
  }
};

/********************************************************/

//API for http://dotnul.com/whois-lookup/ (whois info for the domain)
var api_3 = {
  whois: '',

  parse: function(data) {

    if (data.hasOwnProperty("whois")) {
      this.whois = data.whois;
      update_html(false, '');
    } else {
      //request failed, throw error
      update_html(true, 'No data.');
    }
    //all done, show results and restore visuals
    progress(false);
  },

  error_func: function(textStatus, mode) {
    update_html(true, textStatus + ' ('+(parseInt(mode) + 1)+')');
  }

};

/********************************************************/

//API for google maps, sets the country
function set_country(country, delete_marker = false) {
  if (!geocoder) geocoder = new google.maps.Geocoder();
  geocoder.geocode( { 'address': country }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      delete_markers();
      var marker = new google.maps.Marker({
        map: map,
        position: results[0].geometry.location
      });
      markers.push(marker);
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
    if (delete_marker) delete_markers();
  });
}

//Delete all markers on the map
function delete_markers() {
  for (var i = 0; i < markers.length; i++) markers[i].setMap(null);
  markers = [];
};

//Initialize the google map
function initMap() { map = new google.maps.Map(document.getElementById('map'), {zoom: 3}); }

//Parse the JSON response
function parse_json(data) { return (data ? jQuery.parseJSON(data) : data); }

//Add an entry to the log
function add_to_log(str) { log.push(str); }

//Displays the contents of the log
function show_log() {
  var str = '';
  for (var i in log) str += log[i]+'<br>';
  $('#ajax_log .divlarge').html('<div class="row"><div class="col-xs-12">' + str + '</div></div>');
}

//Determines what happens when you start a new search or finish one (boolean)
function progress(start) {
  ajax_running = start;
  $('.ajax_loading').css('display', (start ? 'block' : 'none'));
  (start ? $('#domain_button').attr('disabled', 'true') : $('#domain_button').removeAttr('disabled'));
  if (start) {
    $('.divlarge').removeClass('expand_me');
    $('#ajax_log .divsmall').nextAll('.divlarge').first().addClass('expand_me');        
  } else {
    $('.divlarge').addClass('expand_me');
  }
  $('.divsmall').css({'color':(!start ? '#6f6f6f' : 'rgba(111, 111, 111, 0.3)'),'cursor':(start ? 'default' : 'pointer')});
}

//Write the results of the search out to the page
function update_html(error, data) {  
  var all_html = '';
  if (error) {
    all_html = '<div class="col-xs-12">An error occured. See the log entries for more information.</div>';
    add_to_log('Error: ' + data);
    progress(false);
  } else {

    all_html = '<div class="col-xs-12">';
    all_html += (api_1.count == 0 ? `<p>No blacklist entries found.</p>` : `<p>${api_1.count} blacklist entries found for IP ${api_0.ip}</p>`);
    add_to_log('Fetching results..');

    for (var i in api_1.entries) {
      all_html += `<div class="row entry_row">`;
      for (var ii in api_1.entries[i]) all_html += `<div class="col-xs-2 entry_title">${api_1.entries[i][ii].title}</div><div class="col-xs-10">${api_1.entries[i][ii].desc}</div>`;
      all_html += `</div>`;
    }
    all_html += `</div>`;
    $('#ajax_blacklist .divlarge').html('<div class="row">' + all_html + '</div>');

    all_html = '<div class="col-xs-12">';
    for (var i in api_2.domains) all_html += `${api_2.domains[i]}<br>`;
    all_html += `</div>`;
    $('#ajax_domains .divlarge').html('<div class="row">' + all_html + '</div>');
    
    all_html = `<div class="row"><div class="col-xs-12">${api_3.whois}</div></div>`;
    $('#ajax_whois .divlarge').html(all_html);    

    all_html = `<div class="row"><p>Country: ${api_0.country}, IP: ${api_0.ip}</p></div>`;
    $('#ajax_map_content').html(all_html);

  }

  show_log();
}


//AJAX function for sending and interpreting the request
//'mode' is an integer value between 0-3 that determines which API is used
//'req_url' is the URL requested
//'req_type' is the type of the request, json/jsonp/script/text/html (JSON & JSONP implemented in the code)
function send_req(mode, req_url, req_type) {

  var data, html = '';

  add_to_log('Sending request with API ' + (parseInt(mode) + 1) + '..');

  $.ajax({

    url: req_url,
    dataType: req_type,
    type: "GET",
    cache: true,
    timeout: (timeout_s * 1000),

    complete: function (jqXHR, textStatus) {

      if (textStatus == 'success') {
        if (req_type == 'json') data = parse_json(jqXHR.responseText);
        if (req_type == 'jsonp' && mode == 3) data = jqXHR.responseJSON;
        window['api_' + mode]["parse"](data);
      } else {
        //request failed, timed out, etc..
        window['api_' + mode]["error_func"](textStatus, mode);
      }

    }

  });

}

function cbb(e) {
  console.log('callback:');
  console.info(e);
}

function api_domain_to_ip_country() {
  send_req(0, encodeURI("http://ip-api.com/json/" + api_0.domain), "json");
}

function api_ip_info() {
  send_req(1, encodeURI("https://cymon.io/api/nexus/v1/ip/" + api_0.ip + "/events/"), "json");
}

function api_other_domains() {
  send_req(2, encodeURI("http://reverseip.logontube.com/?url=" + api_0.domain + "&output=json"), "json");
}

function api_whois() {

  send_req(3, encodeURI("http://dotnul.com/api/whois/" + api_0.domain), "jsonp");
  //send_req(3, encodeURI("http://dotnul.com/api/whois/" + api_0.domain + "?callback=cbb"), "jsonp");
  //send_req(3, encodeURI("http://api.hackertarget.com/whois/?q=" + api_0.domain), "text");
  //send_req(3, encodeURI("http://api.bulkwhoisapi.com/whoisAPI.php?domain=" + api_0.domain + "&token=usemeforfree"), "json");
  //send_req(3, encodeURI("https://www.enclout.com/api/v1/whois/show.json?&auth_token=AGasdFCVrvsK43s8soBP&url=" + api_0.domain), "json");
  //send_req(3, encodeURI("https://www.enclout.com/api/v1/whois/show.json?&auth_token=AGasdFCVrvsK43s8soBP&url=" + api_0.domain), "json");
  //http://api.screenshotlayer.com/api/capture?access_key=061253fd57ed0de7400ec8951c92f1bb&url=http://google.com&viewport=1440x900&width=250
}

function change_page(cont) {
  $(cont).fadeIn();
}



//Starts a new search and resets settings to default state
$('#domain').submit(function() {
  progress(true);
  $('#ajax_blacklist .divlarge').html('<div class="row"><div class="col-xs-12">The results will be displayed here.</div></div>');
  $('#ajax_domains .divlarge').html('<div class="row"><div class="col-xs-12">The results will be displayed here.</div></div>');
  $('#ajax_map_content').html('');
  $('#ajax_whois .divlarge').html('<div class="row"><div class="col-xs-12">The results will be displayed here.</div></div>');  
  delete_markers();
  log = [];
  maxtries = 0;
  api_0.domain = $('#domain_text').val();
  api_0.ip = '';
  api_0.country = '';
  api_1.entries = [];
  api_2.domains = [];
  api_3.whois = '';
  add_to_log('Investigating '+api_0.domain);
  show_log();
  api_domain_to_ip_country();
  return false;
});

//Expand/hide the boxes on click
$('.divsmall').click(function(){
  if (!ajax_running) $(this).nextAll('.divlarge').first().toggleClass('expand_me');
});

//Run this when the DOM is ready
$(document).ready(function() {
  set_country('Sweden', true);
});

//api 1 = google maps
//api 2 = ip-api.com (domain to ip + country)
//api 3 = cymon.io/api/nexus/v1/ip/ (ip blacklist info)
//api 4 = reverseip.logontube.com (domains hosted on ip)
//api 5 = http://dotnul.com/whois-lookup/ (domain whois info)











