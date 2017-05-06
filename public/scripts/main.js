var pusher = new Pusher(window.PUSHER_APP_KEY, {
  cluster: 'eu',
  encrypted: true
});
var channel = pusher.subscribe('orders');
channel.bind('order', function(data) {
  title = document.createElement('div');
  $(title).addClass('title');
  $(title).text(+data.id + ': ' + data.product);
  message = document.createElement('div');
  $(message).addClass('message');
  $(message).text(data.message);
  ready_button = $('<button/>', {
    name: 'ready',
    value: 'Ready'
  });
  $(ready_button).text('Ready');
  $(ready_button).click(function() {
    order_ready(data.id);
  });
  $(ready_button).attr('id', 'rb_' + data.id);
  $(ready_button).addClass('ready');
  cancel_button = $('<button/>', {
    name: 'cancel',
    value: 'Cancel'
  });
  $(cancel_button).text('Cancel');
  $(cancel_button).click(function() {
    order_cancel(data.id);
  });
  $(cancel_button).attr('id', 'cb_' + data.id);
  $(cancel_button).addClass('cancel');
  loading_icon = $('<img/>', {
    src: '/styles/images/ajax-loader.gif'
  });
  loading_icon.addClass('invis');
  $(loading_icon).attr('id', 'al_' + data.id);
  buttons = document.createElement('div');
  $(buttons).addClass('buttons');
  $(buttons).append(loading_icon);
  $(buttons).append(ready_button);
  $(buttons).append(cancel_button);
  article = document.createElement('article');
  $(article).append(title);
  $(article).append(message);
  $(article).append(buttons);
  $(article).attr('id', 'ar_' + data.id);
  $('body').append(article);
});
channel.bind('remove', function(data) {
  $('#ar_' + data.id).hide('fast', function() {
    $('#ar_' + data.id).remove();
  });
});
function order_cancel(id) {
  $('#al_' + id).toggle();
  $('#rb_' + id).toggle();
  $('#cb_' + id).toggle();
  $.post('/orders/complete/' + id + '/cancel')
    .success(function () {
      $('#ar_' + id).hide('fast', function() {
        $('#ar_' + id).remove();
      });
    })
    .fail(function() {
      $('#al_' + id).toggle();
      $('#rb_' + id).toggle();
      $('#cb_' + id).toggle();
      console.log('Unable to send Cancellation. Please Retry.');
    });
}
function order_ready(id) {
  $('#al_' + id).toggle();
  $('#rb_' + id).toggle();
  $('#cb_' + id).toggle();
  $.post('/orders/complete/' + id + '/accept')
    .success(function () {
      $('#ar_' + data.id).hide('fast', function() {
        $('#ar_' + data.id).remove();
      });
    })
    .fail(function() {
      $('#al_' + id).toggle();
      $('#rb_' + id).toggle();
      $('#cb_' + id).toggle();
      console.log('Unable to tell customer their drink is ready. Please Retry.');
    });
}

var count = 30;
var reloadTime = count * 1000;
setInterval(function () {
  document.getElementById('secondsLeft').innerText = count;
  count--;
}, 1000);
setTimeout(() => {
  window.location.reload();
}, reloadTime);