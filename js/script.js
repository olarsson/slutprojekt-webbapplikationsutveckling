
"use strict";

function parse_json(data) {
  return jQuery.parseJSON(data);
}

function send_req(container, mode, req_url, req_type) {
  
  var data, html = '';

  container.find('.ajax_loading').first().css('display', 'block');

  $.ajax({
    
    url: req_url,
    dataType: req_type,
    type: "GET",
    cache: false,
    timeout: 10000,

    complete: function (jqXHR, textStatus) {
      
      //"success", "notmodified", "nocontent", "error", "timeout", "abort", or "parsererror"
      if (textStatus == 'success') {
        
        //query: coolt
        if (mode == 0 && (data = parse_json(jqXHR.responseText))){
          
          container.find('.ajax_loading').first().css('display', (jqXHR.responseText ? 'none' : 'block'));
          html += `<div class="row">`;
          
          var pdate;
                        
          for (var i in data.items) {
            
            pdate = ((pdate = data.items[i].volumeInfo.publishedDate) ? pdate : 'Okänt');
            
            html += `<div class="col-md-2 col-sm-4 col-xs-12"><div class="img_hover">`;
            html += (data.items[i].volumeInfo.hasOwnProperty("imageLinks") ? `<img src="${data.items[i].volumeInfo.imageLinks.thumbnail}">` : `<img src="img/thumbnail.png">`);
            html += `<div class="titledata">${data.items[i].volumeInfo.title}</div>`;            
            html += `</div><span class="date text-muted">${pdate}</span></div>`;
          }                        
          
          html += `</div>`;
          container.find('.ajax_content').first().html(html);          
          
          //console.log(html);
          //console.info(data.items);

        }

        
      } else {
        console.info(jqXHR);
      }
      
    }

  });

}



$('#google_books').click(function() {
  
  var query = $(this).siblings('input').val();
  send_req( $(this).siblings('.ajax_container'), 0, encodeURI("https://www.googleapis.com/books/v1/volumes?q=" + query + "&maxResults=5"), "json");
  return false;
  
});










