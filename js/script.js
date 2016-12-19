"use strict";

function parse_json(data) {
  return jQuery.parseJSON(data);
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
    timeout: 1000,

    complete: function (jqXHR, textStatus) {
      
      //"success", "notmodified", "nocontent", "error", "timeout", "abort", or "parsererror"
      if (textStatus == 'success') {
        
        data = parse_json(jqXHR.responseText);
        
        if (mode == 0 && data) {
          
          var pdate;

          for (var i in data.items) {
            pdate = ((pdate = data.items[i].volumeInfo.publishedDate) ? pdate : 'Okänt datum');
            html += `<div class="col-md-2 col-sm-4 col-xs-12"><div class="img_hover">`;
            html += (data.items[i].volumeInfo.hasOwnProperty("imageLinks") ? `<img src="${data.items[i].volumeInfo.imageLinks.thumbnail}">` : `<img src="img/thumbnail.png">`);
            html += `<div class="titledata">${data.items[i].volumeInfo.title}<div class="date">${pdate}</div></div>`;            
            html += `</div></div>`;
          }
          
          print_html(container,  (data.totalItems == 0 ? 'Inga resultat hittades' : html)  , (data.totalItems == 0 ? true : false));

        } else {
          //no more modes, throw error
        }

      } else {
        
        //request failed, timed out, etc..
        print_html(container, textStatus, true);
        
      }
      
    }

  });

}



$('#google_books').click(function() {
  
  var query = $(this).siblings('input').val();
  send_req( $(this).siblings('.ajax_container'), 0, encodeURI("https://www.googleapis.com/books/v1/volumes?q=" + query + "&maxResults=5"), "json");
  return false;
  
});










