var _myconfirm={
  'onconfirm': null,
  'oncancel': null,
  'data': null
};

myconfirm=function(question,onconfirm,oncancel,data) {
  $('#confirm_modal #question').html(question);
  _myconfirm={
    'onconfirm': onconfirm,
    'oncancel': oncancel,
    'data': data
  };
  $('#confirm_modal').modal('show');
}

_myconfirm_on_valid_click=function(e) {
  $('#confirm_modal').modal('hide');
  console.log(jQuery.type(_myconfirm.onconfirm));
  if (jQuery.type(_myconfirm.onconfirm) == 'function') {
    _myconfirm.onconfirm(_myconfirm.data);
  }
}

_myconfirm_on_cancel_click=function(e) {
  $('#confirm_modal').modal('hide');
  if (jQuery.type(_myconfirm.oncancel) == 'function') {
    _myconfirm.oncancel(_myconfirm.data);
  }
}

$( document ).ready( function() {
  $('#confirm_modal_submit').bind('click',_myconfirm_on_valid_click);
  $('#confirm_modal .cancel').bind('click',_myconfirm_on_cancel_click);
});
