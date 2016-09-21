function SelectedPoint(ctx,size,x,y) {
  this.ctx=ctx;
  this.x=x;
  this.y=y;

  if (jQuery.type(size)=="number" && size>2) {
    this.size=size;
  }
  else {
    this.size=8;
  }

  this.fillStyle='rgba(255,255,255,0.9)';
  this.strokeStyle='rgba(103,222,124,1)';
  this.lineWidth=2;

  this.draw=function() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.fill();
    this.ctx.lineWidth = this.lineWidth
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.stroke();
  }

  this.setPosition=function(x,y) {
    this.x=Math.round(x);
    this.y=Math.round(y);
  }

  this.isOnMe=function(x,y) {
    var d = Math.sqrt( (this.x-x)*(this.x-x) + (this.y-y)*(this.y-y) );
    if (d<(this.size*2)) {
      return true;
    }
    return false;
  }
}

function SelectedZone(canvas,selector) {
  this.canvas=canvas;
  this.ctx=canvas[0].getContext('2d');
  this.selector=selector;
  this.point_size=8;

  this.top_left=new SelectedPoint(this.ctx, this.point_size);
  this.top_right=new SelectedPoint(this.ctx, this.point_size);
  this.bot_left=new SelectedPoint(this.ctx, this.point_size);
  this.bot_right=new SelectedPoint(this.ctx, this.point_size);
  this.points=[this.top_left, this.top_right, this.bot_left, this.bot_right];

  this.setInitialPosition=function() {
    this.top_left.setPosition(this.selector.picture_viewer.image_position.left, this.selector.picture_viewer.image_position.top);
    this.top_right.setPosition(this.selector.picture_viewer.image_position.left+this.selector.picture_viewer.image_position.width, this.selector.picture_viewer.image_position.top);
    this.bot_left.setPosition(this.selector.picture_viewer.image_position.left, this.selector.picture_viewer.image_position.top+this.selector.picture_viewer.image_position.height);
    this.bot_right.setPosition(this.selector.picture_viewer.image_position.left+this.selector.picture_viewer.image_position.width, this.selector.picture_viewer.image_position.top+this.selector.picture_viewer.image_position.height);
    this.redraw();
  }.bind(this);

  this.onResize=function(old_image_position) {
    $(this.points).each(function(idx,point) {
      var old_rel_x=point.x-old_image_position.left;
      var old_rel_y=point.y-old_image_position.top;
      var x=(old_rel_x*this.selector.picture_viewer.image_position.width/old_image_position.width)+this.selector.picture_viewer.image_position.left;
      var y=(old_rel_y*this.selector.picture_viewer.image_position.height/old_image_position.height)+this.selector.picture_viewer.image_position.top;
      point.setPosition(x, y);
    }.bind(this));
    this.redraw();
  }.bind(this);
  
  this.fillStyle='rgba(103,222,124,0.2)';
  this.strokeStyle='rgba(103,222,124,1)';
  this.lineWidth=2;

  this.draging_point_circle_strokeStyle="#fff";
  this.draging_point_circle_lineWidth=2;

  this.draging_point_cross_strokeStyle="#fff";
  this.draging_point_cross_lineWidth=1;

  this.need_redraw=true;
  this.draw=function() {
    this.ctx.clearRect(0,0,this.canvas.width(),this.canvas.height());

    $(this.points).each(function(idx,point) {
      point.draw();
    });

    this.ctx.beginPath();
    this.ctx.moveTo(this.top_left.x, this.top_left.y);
    this.ctx.lineTo(this.top_right.x,this.top_right.y);
    this.ctx.lineTo(this.bot_right.x,this.bot_right.y);
    this.ctx.lineTo(this.bot_left.x,this.bot_left.y);
    this.ctx.closePath();
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.fill();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.stroke();

    if (this.draging_point) {
      var zoom_margin=10;
      var zoom_width=100;
      var zoom_height=100;
      var zoom_x=zoom_margin;
      var zoom_y=zoom_margin;

      if (this.draging_point.x<((this.selector.picture_viewer.image_position.width/2)+this.selector.picture_viewer.image_position.left)) {
        zoom_x=this.selector.picture_canvas.attr('width')-zoom_width-zoom_margin;
      }
      if (this.draging_point.y<((this.selector.picture_viewer.image_position.height/2)+this.selector.picture_viewer.image_position.top)) {
        zoom_y=this.selector.picture_canvas.attr('height')-zoom_height-zoom_margin;
      }

      var zoom_circle_x=zoom_x+(zoom_width/2);
      var zoom_circle_y=zoom_y+(zoom_height/2);

      // Draw zoomed image

      // Save all canvas region
      this.ctx.save();

      // Draw circle limit
      this.ctx.beginPath();
      this.ctx.arc(zoom_circle_x, zoom_circle_y, (zoom_width/2), 0, Math.PI * 2, true);
      this.ctx.closePath();

      // Clip to limit next draw inside the circle
      this.ctx.clip();

      // Draw image in the circle
      this.ctx.drawImage(this.selector.picture_canvas[0],
                  Math.abs(this.draging_point.x - 10),
                  Math.abs(this.draging_point.y - 10),
                  20, 20,
                  zoom_x, zoom_y,
                  zoom_width, zoom_height);

      // Restore all canvas region
      this.ctx.restore();

      // Draw circle arround zoom
      this.ctx.beginPath();
      this.ctx.arc(zoom_circle_x, zoom_circle_y, (zoom_width/2)-(this.draging_point_circle_lineWidth/2), 0, Math.PI * 2, true);
      this.ctx.closePath();
      this.ctx.strokeStyle = this.draging_point_circle_strokeStyle;
      this.ctx.lineWidth = this.draging_point_circle_lineWidth;
      this.ctx.stroke();


      // Draw cross inside zoom
      this.ctx.strokeStyle = this.draging_point_cross_strokeStyle;
      this.ctx.lineWidth = this.draging_point_cross_lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(zoom_x+(zoom_width/2),zoom_y+(zoom_height/4));
      this.ctx.lineTo(zoom_x+(zoom_width/2),zoom_y+(zoom_height*0.75));
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(zoom_x+(zoom_width/4),zoom_y+(zoom_height/2));
      this.ctx.lineTo(zoom_x+(zoom_width*0.75),zoom_y+(zoom_height/2));
      this.ctx.closePath();
      this.ctx.stroke();

    }
    this.need_redraw=false;
  }

  this.redraw=function() {
    this.need_redraw=true;
  }

  this.draging_point=false;

  this.getMousePosition=function(e) {
    var element = this.canvas[0], offsetX = 0, offsetY = 0;

    if (element.offsetParent) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    // Add padding and border style widths to offset

    var pageX=0;
    var pageY=0;
    if (jQuery.type(e.pageY)!='undefined') {
      pageX=e.pageX;
      pageY=e.pageY;
    }
    else if (jQuery.type(e.originalEvent.touches[0])!='undefined') {
      pageX=e.originalEvent.touches[0].pageX;
      pageY=e.originalEvent.touches[0].pageY;
    }
    else if (jQuery.type(e.originalEvent.changedTouches[0])!='undefined') {
      pageX=e.originalEvent.changedTouches[0].pageX;
      pageY=e.originalEvent.changedTouches[0].pageY;
    }

    return {
     x: pageX - offsetX,
     y: pageY - offsetY
    };
  }

  this.onDown=function(e) {
    var mouse=this.getMousePosition(e);
    $(this.points).each(function(idx,point) {
      if (!this.draging_point && point.isOnMe(mouse.x,mouse.y)) {
        this.draging_point=point;
        this.draging_point.setPosition(mouse.x,mouse.y);
        this.redraw();
      }
    }.bind(this));
  }

  this.onMove=function(e) {
    if (this.draging_point) {
      var mouse=this.getMousePosition(e);
      this.draging_point.setPosition(mouse.x,mouse.y);
      this.redraw();
    }
  }

  this.onUp=function(e) {
    if (this.draging_point) {
      var mouse=this.getMousePosition(e);
      this.draging_point.setPosition(mouse.x,mouse.y);
      this.draging_point=false;
      this.redraw();
    }
  }

  canvas.bind('mousedown',this.onDown.bind(this));
  canvas.bind('touchstart',this.onDown.bind(this));
  canvas.bind('mousemove',this.onMove.bind(this));
  canvas.bind('touchmove',this.onMove.bind(this));
  canvas.bind('mouseup',this.onUp.bind(this));
  canvas.bind('touchend',this.onUp.bind(this));

  this.getZone=function() {
    return {
      'top_left':  {x: this.top_left.x,  y: this.top_left.y  },
      'top_right': {x: this.top_right.x, y: this.top_right.y },
      'bot_left':  {x: this.bot_left.x,  y: this.bot_left.y  },
      'bot_right': {x: this.bot_right.x, y: this.bot_right.y }
    };
  }

  this.getOriginalPictureZone=function() {
    var original_points=[];
    $(this.points).each(function(idx,point) {
      var rel_x=point.x-this.selector.picture_viewer.image_position.left;
      var rel_y=point.y-this.selector.picture_viewer.image_position.top;
      var x=rel_x*picture.naturalWidth/this.selector.picture_viewer.image_position.width;
      var y=rel_y*picture.naturalHeight/this.selector.picture_viewer.image_position.height;
      original_points[idx]={'x': x,'y': y};
    }.bind(this));

    return {
      'top_left':  original_points[0],
      'top_right': original_points[1],
      'bot_left':  original_points[2],
      'bot_right': original_points[3]
    };
  }

  this.selectZoneFromOriginal=function(zone) {
    for (point in zone) {
      var x=(zone[point].x*this.selector.picture_viewer.image_position.width/picture.naturalWidth)+this.selector.picture_viewer.image_position.left;
      var y=(zone[point].y*this.selector.picture_viewer.image_position.height/picture.naturalHeight)+this.selector.picture_viewer.image_position.top;
      this[point].setPosition(x, y);
    }
    this.redraw();
  }.bind(this);


  /********************
   * Start
   *******************/

  // Set initial position
  this.setInitialPosition();

  // Start draw loop
  setInterval(function() {
    if (this.need_redraw) {
      this.draw();
    }
  }.bind(this),20);
}

function applyEffects(imageData, contrast, brightness, black_white) {
  debug('Effect : contrast='+contrast+' / brightness='+brightness+' / BW : '+black_white);
  var data = imageData.data;
  var contrastFactor = (259 * (Math.ceil(contrast) + 255)) / (255 * (259 - Math.ceil(contrast)));
  var brightnessFactor = (Math.ceil(brightness)/128)+1;

  var bw;
  for(var i=0;i<data.length;i+=4) {
    data[i] = contrastFactor * ((data[i]*brightnessFactor) - 128) + 128;
    data[i+1] = contrastFactor * ((data[i+1]*brightnessFactor) - 128) + 128;
    data[i+2] = contrastFactor * ((data[i+2]*brightnessFactor) - 128) + 128;
    if (black_white) {
      bw=data[i]*0.3 + data[i+1]*0.59 + data[i+2]*0.11;
      data[i]=bw;
      data[i+1]=bw;
      data[i+2]=bw;
    }
  }
  return imageData;
}

function PictureViewer(canvas,otherPicture) {
  this.canvas=canvas;
  this.ctx=canvas[0].getContext('2d');

  this.picture=otherPicture || picture;

  this.image_margin=20;

  this.adjust_constrast=false;
  this.adjust_brightness=false;
  this.adjust_black_white=false;
 
  this.get_image_position=function() { 
    this.image_width=this.picture.naturalWidth;
    this.image_height=this.picture.naturalHeight;
    this.image_ratio=this.image_width/this.image_height;
    debug('Image size : '+this.image_width+'/'+this.image_height);

    var draw_width=0;
    var draw_height=0;
    var draw_top=this.image_margin;
    var draw_left=this.image_margin;

    this.canvas_width=this.canvas.attr('width');
    this.canvas_height=this.canvas.attr('height');
    this.canvas_ratio=this.canvas_width/this.canvas_height;
    debug('Canvas size : '+this.canvas_width+'/'+this.canvas_height);

    if (this.image_ratio > this.canvas_ratio) {
      // Fit by width
      debug('Fit by width');
      draw_width=this.canvas_width-(this.image_margin*2);
      draw_height=(this.canvas_width*this.image_height/this.image_width)-(this.image_margin*2);
      draw_top=(this.canvas_height-draw_height)/2;
    }
    else {
      // Fit by height
      debug('Fit by height');
      draw_height=this.canvas_height-(this.image_margin*2);
      draw_width=draw_height*this.image_width/this.image_height;
      draw_left=(this.canvas_width-draw_width)/2;
    }

    return {
      'left': draw_left,
      'top': draw_top,
      'width': draw_width,
      'height': draw_height,
    };
  }

  this.need_redraw=true;
  this.draw=function() {
    this.ctx.clearRect(0,0,this.canvas.width(),this.canvas.height());
    this.image_position=this.get_image_position();
    debug(this.image_position);

    this.ctx.drawImage(this.picture, this.image_position.left, this.image_position.top, this.image_position.width, this.image_position.height);

    if (this.adjust_contrast && this.adjust_brightness) {
      var data=this.ctx.getImageData(this.image_position.left, this.image_position.top, this.image_position.width, this.image_position.height);
      data=applyEffects(data, this.adjust_contrast, this.adjust_brightness, this.adjust_black_white);
      this.ctx.putImageData(data, this.image_position.left, this.image_position.top);
    }
    this.need_redraw=false;
  }

  this.redraw=function() {
    this.need_redraw=true;
  }

  this.auto_draw=function() {
    // Start draw loop
    setInterval(function() {
      if (this.need_redraw) {
        this.draw();
      }
    }.bind(this),20);
  }.bind(this);

}

function SelectorCommandsBar(selector) {
  this.selector=selector;

  this.bar=new CommandsBar();

  // Go back btn
  this.onBackBtnClick=function(e) {
    if (jQuery.type(this.selector.back)=='function') {
      this.selector.back();
    }
  }.bind(this);

  // Change quality
  this.changeQuality=function(q) {
    this.quality=q;
  }.bind(this);

  // Rotate left
  this.onRotateLeftBtnClick=function(e) {
    this.selector.rotate_left();
  }.bind(this);

  // Rotate right
  this.onRotateRightBtnClick=function(e) {
    this.selector.rotate_right();
  }.bind(this);

  // Go done btn
  this.onDoneBtnClick=function(e) {
    if (jQuery.type(this.selector.done)=='function') {
      this.selector.done();
    }
  }.bind(this);

  this.bar.addItem('back','btn','fa-arrow-circle-left',this.onBackBtnClick);
  this.bar.addItem('quality','select_quality','fa-star-half-o',this.changeQuality);
  this.quality=this.bar.items['quality'].getQuality();
  this.bar.addItem('rotate_left','btn','fa-undo',this.onRotateLeftBtnClick);
  this.bar.addItem('rotate_right','btn','fa-repeat',this.onRotateRightBtnClick);
  this.bar.addItem('done','btn','fa-check-circle-o',this.onDoneBtnClick);

  this.appendTo=function(to) {
    this.bar.appendTo(to);
  }.bind(this);

  this.selectQuality=function(quality) {
    this.bar.items['quality'].setQuality(quality.id);
  }

}

function PolygonImageSelector(back,done) {
  this.back=false;
  if (jQuery.type(back)=='function') {
    this.back=back.bind(this);
  }

  this.done=false;
  if (jQuery.type(done)=='function') {
    this.done=done.bind(this);
  }

  this.content_size=get_content_size();

  // Create items
  this.picture_canvas=$('<canvas></canvas>');
  this.selection_canvas=$('<canvas></canvas>');

  this.placeItems=function() {
    this.picture_canvas.attr('width',this.content_size.width);
    this.picture_canvas.attr('height',this.content_size.height-60);
    this.picture_canvas.css({
      'position': 'absolute',
      'top': this.content_size.offset.top,
      'left': this.content_size.offset.left,
      'z-index': 1000
    });

    this.selection_canvas.attr('width',this.content_size.width);
    this.selection_canvas.attr('height',this.content_size.height-60);
    this.selection_canvas.css({
      'position': 'absolute',
      'top': this.content_size.offset.top,
      'left': this.content_size.offset.left,
      'z-index': 1001
    });
  }

  // Initial items placement
  this.placeItems();

  this.picture_viewer=new PictureViewer(this.picture_canvas);
  this.picture_viewer.draw();

  this.selected_zone=new SelectedZone(this.selection_canvas, this);
  this.selected_zone.draw();

  this.cmd_bar=new SelectorCommandsBar(this);

  this.selectQuality=function(quality) {
    this.cmd_bar.selectQuality(quality);
  }

  this.selectZoneFromOriginal=function(zone) {
    this.selected_zone.selectZoneFromOriginal(zone);
  }

  this.rotate=function(degree) {
    pleaseWaitShow();
    var canvas=$('<canvas></canvas>');
    var ctx=canvas[0].getContext('2d');

    var cw = picture.naturalWidth, ch = picture.naturalHeight, cx = 0, cy = 0;

    //   Calculate new canvas size and x/y coorditates for image
    switch(degree){
      case 90:
        cw = picture.naturalHeight;
        ch = picture.naturalWidth;
        cy = picture.naturalHeight * (-1);
        break;
      case 180:
        cx = picture.naturalWidth * (-1);
        cy = picture.naturalHeight * (-1);
        break;
      case 270:
        cw = picture.naturalHeight;
        ch = picture.naturalWidth;
        cx = picture.naturalWidth * (-1);
        break;
    }

    //  Rotate image
    canvas.attr('width', cw);
    canvas.attr('height', ch);
    ctx.rotate(degree * Math.PI / 180);
    ctx.drawImage(picture, cx, cy);

    picture.src=canvas[0].toDataURL("image/jpeg", 1.0);

    this.picture_viewer.draw();
    this.selected_zone.setInitialPosition();
    pleaseWaitHide();
  }.bind(this);

  this.rotate_left=function() {
    this.rotate(270);
  }.bind(this);

  this.rotate_right=function() {
    this.rotate(90);
  }.bind(this);

  this.resize=function() {
    this.placeItems();
    var old_image_position=this.picture_viewer.image_position;
    this.picture_viewer.draw();
    this.selected_zone.onResize(old_image_position);
  }.bind(this);

  $('#content').append(this.picture_canvas);
  $('#content').append(this.selection_canvas);
  this.cmd_bar.appendTo($('#content'));

  $(window).resize(function() {
    var size=get_content_size();
    if (size!=this.content_size) {
      this.content_size=size;
    }
    this.resize();
  }.bind(this));
}

function CommandsBarBtnItem(bar,icon,onclick) {
  this.bar=bar;
  this.icon=icon;
  this.onclick=onclick;
  
  this.span=$('<span></span>');
  this.createBtn=function() {
    if (this.icon.startsWith('fa-')) {
      this.btn=$('<button class="btn btn-default"><i class="fa '+this.icon+'" aria-hidden="true"></i></button>');
    }
    else {
      this.btn=$('<button class="btn btn-default"><img src="'+this.icon+'"/></button>');
    }
    this.btn.bind('click',function(e) {
      if (jQuery.type(this.onclick)=='function') {
        this.onclick(e);
      }
    }.bind(this));
    this.span.append(this.btn);
  }
  this.createBtn();

  this.changeIcon=function(newIcon) {
    this.icon=newIcon;
    this.span.html('');
    this.createBtn();
  }
}

function CommandsBarSelectQualityItem(bar,icon,onvalid) {
  this.bar=bar;
  this.icon=icon;
  this.onvalid=onvalid;

  this.current_quality='std';
  this.qualities={
    'std': { 'id': 'std', 'label': 'Standard', 'max-dim': 1600},
    'higth': { 'id': 'higth', 'label': 'Hight', 'max-dim': 3200},
    'original': { 'id': 'original', 'label': 'As original', 'max-dim': false}
  };

  this.getQuality=function() {
    return this.qualities[this.current_quality];
  }

  this.setQuality=function(quality) {
    this.current_quality=quality;
    if (jQuery.type(this.onvalid)=='function') {
      this.onvalid(this.qualities[this.current_quality]);
    }
  }

  this.onQualityBtnClick=function(e) {
    this.setQuality(e.data.quality);
    this.hide();
  }.bind(this);

  this.show=function() {
    this.bar.hideContent();

    this.div=$('<div></div>');
    this.div.css({
      'width': '100%',
      'margin': '0',
      'padding': '0',
    });

    this.spans={};
    this.btns={};
    for (q in this.qualities) {
      this.spans[q]=$('<span></span>');
      this.spans[q].css({
        'width': Math.floor(100/Object.keys(this.qualities).length)+'%',
        'display': 'inline-block',
        'text-align': 'center',
      });
      this.btns[q]=$('<button class="btn btn-default" data-quality="'+q+'">'+this.qualities[q].label+'</button>');
      if (q==this.current_quality) {
        this.btns[q].removeClass('btn-default');
        this.btns[q].addClass('btn-primary');
      }
      this.btns[q].bind('click',{'quality': q},this.onQualityBtnClick);
      this.spans[q].append(this.btns[q]);
      this.div.append(this.spans[q]);
    }
   
    this.bar.container.append(this.div);
  }.bind(this);

  this.hide=function() {
    this.div.remove();
    this.bar.showContent();
  }.bind(this);

  this.btn=new CommandsBarBtnItem(this.bar,this.icon,this.show);
  this.span=this.btn.span;
  
  this.changeIcon=function(newIcon) {
    this.btn.changeIcon(newIcon);
  }.bind(this);
}

function CommandsBarSlider(bar,min,max,current,change,back,done) {
  this.bar=bar;

  this.min=min;
  this.max=max;
  this.current=current;
  this.initalValue=current;

  this.back=back;
  this.change=change;
  this.done=done;

  this.onBackBtnClick=function(e) {
    if (jQuery.type(this.back)=='function') {
      this.back(this.initalValue);
    }
    this.hide();
  }.bind(this);

  this.onChange=function(value) {
    this.current=value;
    if (jQuery.type(this.change)=='function') {
      this.change(this.current);
    }
  }.bind(this);

  this.onDoneBtnClick=function(e) {
    if (jQuery.type(this.done)=='function') {
      this.current=this.span[0].noUiSlider.get();
      this.done(this.current);
    }
    this.initialValue=this.current;;
    this.hide();
  }.bind(this);


  this.show=function() {
    this.bar.hideContent();

    this.div=$('<div></div>');
    this.div.css({
      'width': '100%',
      'margin': '0',
      'padding': '0',
    });
   
    this.back_btn=new CommandsBarBtnItem(this.bar,'fa-arrow-circle-left',this.onBackBtnClick);
    this.back_btn.span.css({
      'min-width': '40px',
      'width': '10%',
      'display': 'inline-block',
      'text-align': 'center',
    });
    this.div.append(this.back_btn.span);
   
    this.span=$('<span></span>');
    this.span.css({
      'width': '80%',
      'height': '1em',
      'display': 'inline-block',
    });

    this.div.append(this.span);
   
    this.done_btn=new CommandsBarBtnItem(this.bar,'fa-check-circle-o',this.onDoneBtnClick);
    this.done_btn.span.css({
      'min-width': '40px',
      'width': '10%',
      'display': 'inline-block',
      'text-align': 'center',
    });
    this.div.append(this.done_btn.span);

    this.slider=noUiSlider.create(this.span[0], {
      start: this.current,
      range: {
        'min': this.min,
        'max': this.max
      }
    });

    this.span[0].noUiSlider.on('update', function( values, handle ) {
      this.onChange(values[handle]);
    }.bind(this));

    this.bar.container.append(this.div);
  }

  this.hide=function() {
    this.div.remove();
    this.bar.showContent();
  }
}

function CommandsBar() {
  this.nav=$('<nav class="navbar navbar-inverse navbar-fixed-bottom" role="navigation"></nav>');
  this.container=$('<div class="container"></div>');
  this.container.css({
    'margin-top': '8px',
    'margin-bottom': '8px',
  });
  this.nav.append(this.container);

  this.items={};

  this.addItem=function(name,type,icon,onclick) {
    switch(type) {
      case 'select_quality':
        this.items[name]=new CommandsBarSelectQualityItem(this,icon,onclick);
        break;
      default:
        this.items[name]=new CommandsBarBtnItem(this,icon,onclick);
        break;
    }
  }.bind(this);

  this.placeItems=function() {
    for (item in this.items) {
      this.items[item].span.css({
        'width': Math.floor(100/Object.keys(this.items).length)+'%',
        'display': 'inline-block',
        'text-align': 'center',
      });
      this.container.append(this.items[item].span);
    }
  }.bind(this);

  this.hideContent=function() {
    for (item in this.items) {
      this.items[item].span.css('display', 'none');
    }
  }.bind(this);

  this.showContent=function() {
    for (item in this.items) {
      this.items[item].span.css('display', 'inline-block');
    }
  }.bind(this);

  this.appendTo=function(to) {
    this.placeItems();
    to.append(this.nav);
  }.bind(this);
}


function EffectCommandsBar(adjuster) {
  this.adjuster=adjuster;

  this.bar=new CommandsBar();

  this.onBackBtnClick=function(e) {
    if (jQuery.type(this.adjuster.back)=='function') {
      this.adjuster.back();
    }
  }.bind(this);

  this.onColorBtnClick=function(e) {
    this.adjuster.picture_viewer.adjust_black_white=!this.adjuster.picture_viewer.adjust_black_white;
    if (this.adjuster.picture_viewer.adjust_black_white) {
      this.bar.items['color'].changeIcon('color.png');
    }
    else {
      this.bar.items['color'].changeIcon('black_white.png');
    }
    this.adjuster.picture_viewer.redraw();
  }.bind(this);

  this.onConstratValueChange=function(value) {
    this.adjuster.picture_viewer.adjust_contrast=value;
    this.adjuster.picture_viewer.redraw();
  }.bind(this);
  this.contrastSlider=new CommandsBarSlider(this.bar,-128,128,this.adjuster.picture_viewer.adjust_contrast,this.onConstratValueChange,this.onConstratValueChange);

  this.onContrastBtnClick=function(e) {
    this.contrastSlider.show();
  }.bind(this);

  this.onBrightnessValueChange=function(value) {
    this.adjuster.picture_viewer.adjust_brightness=value;
    this.adjuster.picture_viewer.redraw();
  }.bind(this);
  this.brightnessSlider=new CommandsBarSlider(this.bar,-128,128,this.adjuster.picture_viewer.adjust_brightness,this.onBrightnessValueChange,this.onBrightnessValueChange);

  this.onBrightnessBtnClick=function(e) {
    this.brightnessSlider.show();
  }.bind(this);

  this.onDoneBtnClick=function(e) {
    if (jQuery.type(this.adjuster.done)=='function') {
      this.adjuster.done();
    }
  }.bind(this);

  this.bar.addItem('back','btn','fa-arrow-circle-left',this.onBackBtnClick);
  this.bar.addItem('color','btn','black_white.png',this.onColorBtnClick);
  this.bar.addItem('contrast','btn','fa-adjust',this.onContrastBtnClick);
  this.bar.addItem('brightness','btn','fa-sun-o',this.onBrightnessBtnClick);
  this.bar.addItem('done','btn','fa-check-circle-o',this.onDoneBtnClick);

  this.appendTo=function(to) {
    this.bar.appendTo(to);
  }.bind(this);
}

function EffectAdjuster(picture,back,done) {
  this.picture=picture;

  this.back=false;
  if (jQuery.type(back)=='function') {
    this.back=back.bind(this);
  }

  this.done=false;
  if (jQuery.type(done)=='function') {
    this.done=done.bind(this);
  }

  // Create items
  this.picture_canvas=$('<canvas></canvas>');

  this.placeCanvas=function() {
    this.content_size=get_content_size();

    this.picture_canvas.attr('width',this.content_size.width);
    this.picture_canvas.attr('height',this.content_size.height-60);
    this.picture_canvas.css({
      'position': 'absolute',
      'top': this.content_size.offset.top,
      'left': this.content_size.offset.left,
      'z-index': 1000
    });
  }

  // Initial items placement
  this.placeCanvas();

  this.picture_viewer=new PictureViewer(this.picture_canvas,this.picture);

  // Default effects values
  this.picture_viewer.adjust_contrast=90;
  this.picture_viewer.adjust_brightness=90;

  this.picture_viewer.auto_draw();

  this.cmd_bar=new EffectCommandsBar(this);

  this.resize=function() {
    this.placeCanvas();
    this.picture_viewer.draw();
  }.bind(this);

  $('#content').append(this.picture_canvas);
  this.cmd_bar.appendTo($('#content'));

  $(window).resize(function() {
    var size=get_content_size();
    if (size!=this.content_size) {
      this.content_size=size;
    }
    this.resize();
  }.bind(this));

  this.exportEffects=function() {
    return {
      'contrast': this.picture_viewer.adjust_contrast,
      'brightness': this.picture_viewer.adjust_brightness,
      'black_white': this.picture_viewer.adjust_black_white
    };
  }.bind(this);

}
