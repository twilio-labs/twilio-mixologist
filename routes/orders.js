const bodyParser = require('body-parser');
const twilio = require('twilio');
const Pusher = require('pusher');

const { Order } = require('../models');

// Initialize Twilio Helper Library
// The credentials are automatically passed via
// TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables
const twilioClient = twilio();
const pusherClient = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: 'eu',
  encrypted: true
});

/**
 * Request handler to load the list of open orders
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function listOrders(req, res, next) {
  Order.findAll({
    where: {
      fulfilled: false
    },
    order: [['createdAt', 'ASC']]
  })
    .then(orders => {
      return orders.map(order => {
        return {
          name: order.get('name'),
          orderId: order.get('id')
        };
      });
    })
    .then(orders => {
      res.render('orders-index', { orders });
    })
    .catch(err => {
      res.render('error', err);
    });
}

/**
 * Load page to create orders
 * [Currently not functional]
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function getCreatePage(req, res, next) {
  res.render('orders-create');
}

/**
 * Handle POST Request to create an order
 * [Currently not functional]
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function createOrder(req, res, next) {
  res.render('orders-index');
}

/**
 * Loads the details page for an order
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
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
  });
}

/**
 * Loads Edit page for Order
 * [Currently not functional]
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function getEditOrderPage(req, res, next) {
  res.render('orders-edit');
}

/**
 * Handles POST request to edit an order
 * [Currently not functional]
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function editOrder(req, res, next) {
  res.render('orders-index');
}

/**
 * Loads delete page for order
 * [Currently not functional]
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function getDeleteOrderPage(req, res, next) {
  res.render('orders-delete');
}

/**
 * Handles DELETE request to delete an order
 * [Currently not functional]
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function deleteOrder(req, res, next) {
  res.render('orders-index');
}

/**
 * Handles completion requests for orders from the Dashboard
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function completeOrder(req, res, next) {
  const id = req.params.orderId;
  const status = req.params.status;

  // Find the respective order
  Order.findOne({
    where: { id }
  })
    .then(order => {
      if (!order) {
        res.status(404).send('Could not find drink order');
        return;
      }

      // set the order to fulfilled
      order.set('fulfilled', true);

      return order.save();
    })
    .then(order => {
      // Remove the order from the Barista page by triggering event
      pusherClient.trigger('orders', 'remove', { id });

      // Find the source associated with the order
      return order.getSource().then(source => {
        let responseMessage;
        if (status === 'accept') {
          responseMessage = `Your ${order.get('name')} is ready. You can collect it from the coffee shop right away, ask for order number ${order.get('id')}`;
        } else {
          responseMessage = `Your ${order.get('name')} order has been cancelled. Please check with the barista if you think something is wrong.`;
        }

        // Inform the customer about their accepted/cancelled order
        twilioClient.messages.create({
          from: source.contactAddress,
          to: source.customerAddress,
          body: responseMessage
        });
        res.send(`Order ${status}ed`);
      });
    })
    .catch(err => {
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
