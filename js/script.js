"use strict";

var geocoder;
var map;
var markers = [];

//var data_domain;
//var data_ip;
//var all_html = '';
var log = [];
var maxtries = 0;
const maxtries_val = 2; //Maximum number of retries for getting the IPV4 address

var api_0 = {
  domain: '',
  ip: '',
  country: ''
};

var api_1 = {
  entries: []
};


//Run this when the DOM is ready
$(document).ready(function() {
  set_country('Sweden', true);
});

/* ----------------------- */
/* <Google maps functions> */
/* ----------------------- */

//Set country on the google map
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

/* ----------------------- */


//Parse the JSON response
function parse_json(data) { return (data ? jQuery.parseJSON(data) : data); }

function add_to_log(str) { log.push(str); }

function show_log() {
  var str;
  for (var i in log) str += log[i]+'<br>';
  $('.ajax_log').html('<div class="row">' + str + '</div>');
}

function hide_loader() {
  $('.ajax_loading').css('display', 'none');
}

function update_html(error, data) {  
  var all_html = '';
  if (error) {
    all_html = '<div class="col-md-12 col-sm-12 col-xs-12">Error: '+data+'</div>';
    add_to_log('Error: ' + data);
    hide_loader();
  } else {
    all_html += data;
    add_to_log('Fetching results..');
  }
  $('.ajax_content').html('<div class="row">' + all_html + '</div>');
  show_log();
    //container.find('.ajax_content').first().html('<div class="row">' + data + '</div>');
    //container.find('.ajax_loading').first().css('display', 'none');
}

function send_req(mode, req_url, req_type) {

  var data, html = '';

  $('.ajax_loading').css('display', 'block');

  $.ajax({

    url: req_url,
    dataType: req_type,
    type: "GET",
    cache: true,
    timeout: 5000,

    complete: function (jqXHR, textStatus) {
      
      //console.log(jqXHR.responseText);
      //console.log('1');

      if (textStatus == 'success') {
        
        //console.log('2');
        
        if (req_type == 'json') data = parse_json(jqXHR.responseText);

        switch (mode) {
            
          //API = domain > ip + country
          case 0:
            if (data.status == 'success') {
              //github.es, sunet.se              
              api_0.ip = data.query;
              api_0.country = data.country;
              set_country(api_0.country);
              update_html(false);
              //Initiate the next API if all went well
              api_ip_info();                
              
            } else {
              //request failed, throw error
              update_html(true, 'Ingen data ('+mode+').');
            }            
            break;

          //API = ipv4 > blacklist info
          case 1:
            
            if (data.hasOwnProperty("results")) {
              
              //var temp = data.results.length + ' blacklist entries found<br>';
              
              var temp;
              
              for (var i in data.results) {
                temp += data.results[i].description + '<br>';
                for (var e in data.results[i]) {
                  if (data.results[i].hasOwnProperty(e) && data.results[i][e]) {
                    temp += e + ':' + data.results[i][e];
                  }
                }
                api_1.entries.push(temp);
                temp = '';   
              }
              
              if (api_1.entries.length == 0) temp = 'No blacklist entries found.';
              update_html(false, temp);
              
              hide_loader();

            } else {
              //request failed, throw error
              update_html(true, 'Ingen data ('+mode+').');
            }            
            break;

        }





      } else {
        //request failed, timed out, etc..
        //console.log('3 mode:' + mode);
        if (mode == 0) update_html(true, textStatus + ' ('+mode+')');
        if (mode == 1) {
          
          if (api_0.ip.indexOf(':') < 0) {
            update_html(true, textStatus);
          } else {
            if (maxtries < maxtries_val) {
              maxtries++;
              //all_html = ''; nollställ all hämtad html
              add_to_log('Retrying for IPV4..');
              api_domain_to_ip_country();
            } else {
              update_html(true, 'Maximum retries reached.');
              //hide_loader();
            }
            
          }

          
        }
      }

    }

  });

}

function api_ip_info() {
  send_req(1, encodeURI("https://cymon.io/api/nexus/v1/ip/" + api_0.ip + "/events/"), "json");
}

function api_domain_to_ip_country() {
  send_req(0, encodeURI("http://ip-api.com/json/" + api_0.domain), "json");
}


$('#domain').click(function() {

  log = [];
  maxtries = 0;
  //all_html = '';
  api_0.domain = $(this).siblings('input').val();
  api_0.ip = '';
  api_0.country = '';
  api_domain_to_ip_country();
  return false;

});

//api 1 = google maps
//api 2 = ip-api.com
//api 3 = cymon.io/api/nexus/v1/ip/










