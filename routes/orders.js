const bodyParser = require('body-parser');
const twilio = require('twilio');
const Pusher = require('pusher');

const { Order } = require('../models');

const twilioClient = twilio();
const pusherClient = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: 'eu',
  encrypted: true
});

function listOrders(req, res, next) {
  Order.findAll({ where: {
    fulfilled: false
  }, order: [['createdAt', 'ASC']]}).then(orders => {
    return orders.map(order => {
      return {
        name: order.get('name'),
        orderId: order.get('id')
      }
    });
  }).then(orders => {
    res.render('orders-index', { orders });
  }).catch(err => {
    res.render('error', err);
  });
}

function getCreatePage(req, res, next) {
  res.render('orders-create')
}

function createOrder(req, res, next) {
  res.render('orders-index');
}

function getOrder(req, res, next) {
  const id = req.params.orderId;

  Order.findOne({
    where: { id }
  }).then(order => {
    if (!order) {
      res.status(404).send('No such order');
      return;
    }

    res.render('orders-details', {
      order: {
        time: order.get('createdAt'),
        name: order.get('name'),
        fulfilled: order.get('fulfilled')
      }
    });
  })
}

function getEditOrderPage(req, res, next) {
  res.render('orders-index');
}

function editOrder(req, res, next) {
  res.render('orders-edit');
}

function getDeleteOrderPage(req, res, next) {
  res.render('orders-delete');
}

function deleteOrder(req, res, next) {
  res.render('orders-index');
}

function completeOrder(req, res, next) {
  console.log(req);
  const id = req.params.orderId;
  const status = req.params.status;

  Order.findOne({
    where: { id }
  }).then(order => {
    if (!order) {
      res.status(404).send('Could not find drink order');
      return;
    }

    order.set('fulfilled', true);

    return order.save();
  }).then(order => {
    pusherClient.trigger('orders', 'remove', { id });
    console.log(order.source);

    return order.getSource().then(source => {
      let responseMessage;
      if (status === 'accept') {
        responseMessage = `Your ${order.get('name')} is ready. You can collect it from the coffee shop right away, ask for order number ${order.get('id')}`;
      } else {
        responseMessage = `Your ${order.get('name')} order has been cancelled. Please check with the barista if you think something is wrong.`;
      }
      
      twilioClient.messages.create({
        from: source.contactAddress,
        to: source.customerAddress,
        body: responseMessage
      });
      res.send(`Order ${status}ed`);
    });
  }).catch(err => {
    res.status(500).send(err.message);
  });
}

const router = require('express').Router();
router.get('/', listOrders);
router.get('/create', getCreatePage);
router.post('/', createOrder);
router.get('/:orderId', getOrder);
router.get('/:orderId/edit', getEditOrderPage);
router.post('/:orderId/edit', editOrder);
router.get('/:orderId/delete', getDeleteOrderPage);
router.post('/:orderId/delete', deleteOrder);
router.delete('/:orderId', deleteOrder);
router.post('/complete/:orderId/:status', completeOrder);

module.exports = router;