debug_enable=false;
debug=function(msg) {
  if (debug_enable) {
    console.log(msg);
  }
}

direct_take_photo=(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

get_picture=function() {
  var content_size=get_content_size();
  clear_page();

  var take_row_height;
  if (direct_take_photo) {
    var div_upload=$('<div class="row"></div>');
    div_upload.css({
      'height': '60px',
      'padding': '0px',
      'line-hieght': '60px',
      'text-align': 'center',
      'vertical-align': 'middle',
    });
    btn_upload=$('<button class="btn btn-success">Use external photo app</button>');
    btn_upload.bind('click',upload_picture);
   
    div_upload.append(btn_upload);
    take_row_height=content_size.height-60;
  }
  else {
    take_row_height=content_size.height;
  }

  var div_take=$('<div class="row"></div>');
  div_take.css('height', take_row_height+'px');

  var div_btn_take=$('<div></div>');
  div_btn_take.css({
    'margin': 'auto',
    'background-color': '#999',
    'padding': '30px',
    'font-size': '30px',
    'border-radius': '50%',
    'cursor': 'pointer',
    'border': '5px solid #000',
  });
  var btn_take=$('<img src="icon-128x128.png"/>');
  btn_take.bind('load',function(e) {
    div_btn_take.css({
      'margin-top': ((content_size.height-this.height-70)/2)+'px',
      'width': (this.width+70)+'px',
      'height': (this.height+70)+'px',
    });
    div_btn_take.append(btn_take);
    div_take.append(div_btn_take);
    content.append(div_take);
    if (direct_take_photo) {
      div_btn_take.bind('click',take_picture);
      content.append(div_upload);
    }
    else {
      div_btn_take.bind('click',upload_picture);
    }
  });
  
}


var content=$('#content');

function get_content_size() {
  return {
    width: content.width(),
    height: $(window).height()-61,
    offset: content.offset()
  };
}

var picture=false;
upload_picture=function() {
  picture=false;
  var input=$('<input type="file" accept="image/*;capture=camcorder">');
  input.css('display', 'none');
  input.bind('change',{'input': input},function(e) {
    pleaseWaitShow();
    load_picture(e.data.input);
  });
  content.append(input);
  input[0].click();
}

load_picture=function(input) {
  var file=input.prop('files')[0];
  if (file) {
    var reader = new FileReader();
    $(reader).bind('load',function(e) {
      if (e.total > 60000000) {
        alert('Your picture is larger than 6MB');
        pleaseWaitHide();
        return;
      }

      picture=new Image();
      picture.src=e.target.result;
      $(picture).bind('load',show_picture);
    });
    reader.readAsDataURL(file);
  }
}

take_picture=function() {
  clear_page();
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var content_size=get_content_size();
    var div_btn=$('<div></div>');
    div_btn.css({
      'height': '60px',
      'padding': '0px',
    });

    var div_btn_take=$('<div></div>');
    div_btn_take.css({
      'margin': 'auto',
      'width': '60px',
      'background-color': '#999',
      'padding': '14px',
      'border-radius': '50%',
      'cursor': 'pointer',
      'border': '1px solid #000',
    });
    var btn_take=$('<img src="icon-128x128.png"/>');
    btn_take.bind('load',function(e) {
      btn_take.css({
        'height': '30px'
      });
      div_btn_take.append(btn_take);
      div_btn_take.bind('click',take_picture);
      div_btn.append(div_btn_take);
    });
    var video=$('<video id="video" width="'+content_size.width+'" height="'+(content_size.height-60)+'" autoplay></video>');
    content.append(video);
    content.append(div_btn);
    // Not adding `{ audio: true }` since we only want video now
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        video[0].src = window.URL.createObjectURL(stream);
        video[0].play();
        div_btn_take.on('click',{'video': video, 'stream': stream},function(e) {
          picture = new Image();
          var canvas=$('<canvas></canvas>');
          canvas.attr('width', e.data.video[0].videoWidth);
          canvas.attr('height', e.data.video[0].videoHeight);
          canvas[0].getContext('2d').drawImage(e.data.video[0], 0, 0);
          picture.src = canvas[0].toDataURL("image/jpeg", 1.0);
          $(picture).bind('load',e.data,function(e) {
            // Stop playing camera
            e.data.stream.getTracks()[0].stop();
            e.data.video[0].remove();
            // Delete canvas
            delete(canvas);
            show_picture();
          });
        });
    });
  }
  else {
    alert('No media devices detected !');
    return;
  }
}

show_picture=function(e,zone,quality) {
  clear_page();
  var selector=new PolygonImageSelector(
    get_picture,
    function () {
      crop_redress_picture(this.selected_zone.getOriginalPictureZone(), this.cmd_bar.quality);
    }
  );
  if (jQuery.type(zone)=='object') {
    selector.selectZoneFromOriginal(zone);
  }
  if (jQuery.type(quality)=='object') {
    selector.selectQuality(quality);
  }
  pleaseWaitHide();
}

crop_redress_picture=function(zone,quality) {
  pleaseWaitShow();

  /*
   * First step : crop the orignal image as a rectangular image containing
   * all selected zone
   */

  // Calculate crop image coords and size 
  crop_x=Math.min(zone.top_left.x, zone.bot_left.x);
  crop_y=Math.min(zone.top_left.y, zone.top_right.y);
  crop_width=Math.max(zone.top_right.x, zone.bot_right.x)-crop_x;
  crop_height=Math.max(zone.bot_left.y, zone.bot_right.y)-crop_y;

  // Adapt zone coords to crop image
  var crop_zone={
    'top_left': {'x': zone.top_left.x-crop_x, 'y': zone.top_left.y-crop_y},
    'top_right': {'x': zone.top_right.x-crop_x, 'y': zone.top_right.y-crop_y},
    'bot_left': {'x': zone.bot_left.x-crop_x, 'y': zone.bot_left.y-crop_y},
    'bot_right': {'x': zone.bot_right.x-crop_x, 'y': zone.bot_right.y-crop_y}
  };

  // Resize crop image if it's size is larger than quality limit
  var crop_dst_width = crop_width;
  var crop_dst_height = crop_height;
  if (jQuery.type(quality) == 'object' && jQuery.type(quality['max-dim']) == 'number' && quality['max-dim']!=-1) {
    if (crop_dst_width > quality['max-dim'] || crop_dst_height > quality['max-dim']) {
      if (crop_dst_width > crop_dst_height) {
        crop_dst_height=Math.ceil(crop_dst_height*quality['max-dim']/crop_dst_width);
        crop_dst_width=quality['max-dim'];
      }
      else {
        crop_dst_width=Math.ceil(crop_dst_width*quality['max-dim']/crop_dst_height);
        crop_dst_height=quality['max-dim'];
      }
      for (point in crop_zone) {
        crop_zone[point].x=Math.floor(crop_zone[point].x*crop_dst_width/crop_width);
        crop_zone[point].y=Math.floor(crop_zone[point].y*crop_dst_height/crop_height);
      }
    }
  }

  // Create source canvas and draw crop_image inside
  var canvas=$('<canvas></canvas>');
  canvas.attr('width',crop_dst_width);
  canvas.attr('height',crop_dst_height);
  canvas[0].getContext('2d').drawImage(picture, crop_x, crop_y, crop_width, crop_height, 0, 0, crop_dst_width, crop_dst_height);

  /*
   * Second step : calculate distortion coords and movement and apply it on
   * source canvas image
   */

  // Calculate distortion points coords
  var adj_dst_zone={
    'top_left':  {'x': Math.floor((crop_zone.top_left.x+crop_zone.bot_left.x)/2), 'y': Math.floor((crop_zone.top_left.y+crop_zone.top_right.y)/2)},
    'top_right': {'x': Math.ceil((crop_zone.top_right.x+crop_zone.bot_right.x)/2), 'y': Math.floor((crop_zone.top_left.y+crop_zone.top_right.y)/2)},
    'bot_left':  {'x': Math.floor((crop_zone.top_left.x+crop_zone.bot_left.x)/2), 'y': Math.ceil((crop_zone.bot_left.y+crop_zone.bot_right.y)/2)},
    'bot_right': {'x': Math.ceil((crop_zone.top_right.x+crop_zone.bot_right.x)/2), 'y': Math.ceil((crop_zone.bot_left.y+crop_zone.bot_right.y)/2)},
  }

  // Calculate distortion movement coords
  var adj_zone={
    'top_left':  {'x': adj_dst_zone.top_left.x-crop_zone.top_left.x, 'y': adj_dst_zone.top_left.y-crop_zone.top_left.y},
    'top_right':  {'x': adj_dst_zone.top_right.x-crop_zone.top_right.x, 'y': adj_dst_zone.top_right.y-crop_zone.top_right.y},
    'bot_left':  {'x': adj_dst_zone.bot_left.x-crop_zone.bot_left.x, 'y': adj_dst_zone.bot_left.y-crop_zone.bot_left.y},
    'bot_right':  {'x': adj_dst_zone.bot_right.x-crop_zone.bot_right.x, 'y': adj_dst_zone.bot_right.y-crop_zone.bot_right.y},
  }

  // Apply distortion on source canvas and store resulting image data
  var result=transformCanvas(canvas[0], adj_zone.top_left.x, adj_zone.top_left.y, adj_zone.bot_left.x, adj_zone.bot_left.y, adj_zone.bot_right.x, adj_zone.bot_right.y, adj_zone.top_right.x, adj_zone.top_right.y);

  /*
   * Thrird step : draw distorted image on a canvas
   */
  // Create destination canvas
  var dst_canvas=$('<canvas></canvas>');

  // Set destination canvas size
  dst_canvas.attr('width',adj_dst_zone.top_right.x-adj_dst_zone.top_left.x);
  dst_canvas.attr('height',adj_dst_zone.bot_left.y-adj_dst_zone.top_left.y);

  // Draw distorted image on destination canvas
  dst_canvas[0].getContext('2d').drawImage(result, crop_zone.top_left.x, crop_zone.top_left.y, dst_canvas[0].width, dst_canvas[0].height, 0, 0, dst_canvas[0].width, dst_canvas[0].height);

  /*
   * Fourth step : create image object of the resulting image and run adjust_effect() on it
   */
  var resulting_picture=new Image();
  resulting_picture.src=dst_canvas[0].toDataURL("image/jpeg", 1.0);

  $(resulting_picture).bind('load',function(e) {
    adjust_effect(resulting_picture, zone, quality);
  });
}

adjust_effect=function(picture,zone,quality) {
  clear_page();
  var ajuster=new EffectAdjuster(picture,
  function() {
    debug('back');
    show_picture(false,zone,quality);
  },
  function() {
    debug('done');
    debug(this);
    download_picture(picture,this.exportEffects());
  });
  pleaseWaitHide();
}

download_picture=function(picture,effects) {
  var canvas=$('<canvas></canvas>');
  var w=picture.naturalWidth;
  var h=picture.naturalHeight;
  canvas.attr('width', w);
  canvas.attr('height', h);
  var ctx=canvas[0].getContext('2d');
  ctx.drawImage(picture, 0, 0);
  var data=ctx.getImageData(0, 0, w, h);
  data=applyEffects(data, effects.contrast, effects.brightness, effects.black_white);
  ctx.putImageData(data, 0, 0);
  var link=$('<a download="picture.jpg">Download</a>');
  link.css('display','none');
  link.attr('href',canvas[0].toDataURL("image/jpeg", 1.0));
  content.append(link);
  link[0].click();
}

clear_page=function(new_content) {
  if (new_content) {
    $('#content').html(new_content);
  }
  else {
    $('#content').html('');
  }
}

/************************
 * Show menu
 ***********************/
show_menu=function(menu) {
  $('.menu').css('display','none');
  $('.menu-'+menu).css('display','block');
}

/*******************
 * pleaseWaitDialog
 *******************/

pleaseWaitShow=function() {
  $('#please_wait_modal').modal('show');
}

pleaseWaitHide=function() {
  $('#please_wait_modal').modal('hide');
}

/****************
 * Nav bars
 ****************/
navbar_collapse_hide=function() {
  if ($('#navbar-top-collapse').hasClass('in')) {
    $('#navbar-top-collapse').collapse('hide');
  }
}

/**************************
 * Cache / Update
 *************************/

_checkForUpgrade=false;
onUpdateReady=function() {
  if (_checkForUpgrade) {
    pleaseWaitHide();
  }
  myconfirm(
    "Une nouvelle version de l'application est disponible. Voulez-vous lancer la mise à jour ?",
    onConfirmUpdate,null,{}
  );
}

onConfirmUpdate=function() {
  window.applicationCache.swapCache();
  location.reload();
}

updateApp = function() {
  navbar_collapse_hide();
  pleaseWaitShow();
  _checkForUpgrade=true;
  window.applicationCache.update();
}

onNoUpdate = function() {
  if (_checkForUpgrade) {
    pleaseWaitHide();
    _checkForUpgrade=false;
    alert('Aucune mise à jour disponible');
  }
}

/*********************
 * Activate
 *********************/
$( document ).ready( function() {
  pleaseWaitShow();

  $('#app-name').bind('click', get_picture);

  if (window.applicationCache.status==window.applicationCache.UNCACHED) {
    $('#update_app').parent().remove();
  }
  else {
    $('#update_app').bind('click',updateApp);
    window.applicationCache.addEventListener('updateready', onUpdateReady);
    window.applicationCache.addEventListener('noupdate', onNoUpdate);
    if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
      onUpdateReady();
    }
  }

  get_picture();

  pleaseWaitHide();
});
