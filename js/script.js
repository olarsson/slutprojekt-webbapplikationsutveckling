"use strict";

var geocoder;
var map;
var markers = [];

function set_country(country) {
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
  });
}

function delete_markers() {
  for (var i = 0; i < markers.length; i++) markers[i].setMap(null);
  markers = [];
};

//$(document).ready(function() {
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {zoom: 2});
  //geocoder = new google.maps.Geocoder();
}
//});

$(document).ready(function() {
  set_country('Sweden');
});

function parse_json(data) {
  return (data ? jQuery.parseJSON(data) : data);
}

function print_html(container, data, error) {  
  if (error) data = '<div class="col-md-12 col-sm-12 col-xs-12">Ett fel uppstod: '+data+'</div>';
  container.find('.ajax_content').first().html('<div class="row">' + data + '</div>');
  container.find('.ajax_loading').first().css('display', 'none');
}

function send_req(container, mode, req_url, req_type) {

  var data, html = '';

  container.find('.ajax_loading').first().css('display', 'block');

  $.ajax({

    url: req_url,
    dataType: req_type,
    type: "GET",
    cache: false,
    timeout: 5000,

    complete: function (jqXHR, textStatus) {

      //console.info(textStatus, parse_json(jqXHR.responseText));

      if (req_type == 'json') data = parse_json(jqXHR.responseText);

      if (textStatus == 'success') {

        if (mode == 0 && data.hasOwnProperty("country")) {

          //github.es

          /*var pdate;

          for (var i in data.items) {
            pdate = ((pdate = data.items[i].volumeInfo.publishedDate) ? pdate : 'Okänt datum');
            html += `<div class="col-md-2 col-sm-4 col-xs-12"><div class="img_hover">`;
            html += (data.items[i].volumeInfo.hasOwnProperty("imageLinks") ? `<img src="${data.items[i].volumeInfo.imageLinks.thumbnail}">` : `<img src="img/thumbnail.png">`);
            html += `<div class="titledata">${data.items[i].volumeInfo.title}<div class="date">${pdate}</div></div>`;            
            html += `</div></div>`;
          }*/

          //print_html(container,  (data.totalItems == 0 ? 'Inga resultat hittades' : html)  , (data.totalItems == 0 ? true : false));

          set_country(data.country);

          print_html(container, 'IP: ' + data.query + ', Country: ' + data.country, false);


        } else {
          //no more modes, throw error
          print_html(container, 'Ingen data.', true);
        }

      } else {

        //request failed, timed out, etc..
        print_html(container, textStatus, true);

      }

    }

  });

}



$('#domain').click(function() {

  var query = $(this).siblings('input').val();
  send_req( $(this).siblings('.ajax_container'), 0, encodeURI("http://ip-api.com/json/" + query), "json");
  return false;

});










