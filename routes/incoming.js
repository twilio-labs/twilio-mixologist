const twilio = require('twilio');
const Pusher = require('pusher');
const bodyParser = require('body-parser');

const { Order, Source } = require('../models');
const {
  AVAILABLE_OPTIONS,
  determineCoffeeFromMessage
} = require('../data/coffee-options');

const twilioClient = twilio();
const pusherClient = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: 'eu',
  encrypted: true
});
const parsePostBody = bodyParser.urlencoded({ extended: false });

/**
 * Sends a message (FB or SMS) using the Twilio Programmable Messaging API
 * 
 * @param {any} source The source object from the database with sender/recipient
 * @param {any} msg The message to send
 * @returns 
 */
function sendMessage(source, msg) {
  return twilioClient.messages.create({
    from: source.contactAddress,
    to: source.customerAddress,
    body: msg
  });
}

/**
 * This is the request handler for incoming SMS and Facebook messages by handling webhook request from Twilio.
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 * @returns 
 */
function handleIncomingMessage(req, res, next) {
  // Respond to HTTP request with empty Response object since we will use the REST API to respond to messages.
  res.type('text/xml').send('<Response></Response>');

  const source = {
    name: req.body.From.indexOf('Messenger') !== -1 ? 'facebook' : 'sms',
    customerAddress: req.body.From,
    contactAddress: req.body.To
  };
  const coffeeOrder = determineCoffeeFromMessage(req.body.Body);

  // check if we could determine if there is a coffee order in the message
  if (!coffeeOrder) {
    let responseMessage = `Seems like your order of "${req.body.Body}" is not something we can serve. Possible orders are ${AVAILABLE_OPTIONS.join(', ')}.`;
    sendMessage(source, responseMessage);
    return;
  }

  let sourceId;

  // Check in the database if the customer already messaged in once
  Source.findOne({
    where: {
      customerAddress: source.customerAddress
    }
  })
    .then(sourceInstance => {
      if (!sourceInstance) {
        return Source.create(source);
      }
      return sourceInstance;
    })
    .then(sourceInstance => {
      // get the open orders for a customer
      if (!sourceInstance) {
        return [];
      }

      sourceId = sourceInstance.get('id');
      return sourceInstance.getOrders().filter(o => !o.get('fulfilled'));
    })
    .then(orders => {
      // if a customer has an open order tell them
      if (orders && orders.length > 0) {
        let responseMessage = `We're still making you a ${orders[0].get('name')}. Check order #${orders[0].get('id')} with the barista if you think there's something wrong.`;
        return responseMessage;
      }

      // if there is no open order. Create a new order
      return Order.create({
        name: coffeeOrder,
        fulfilled: false,
        SourceId: sourceId
      }).then(order => {
        // Inform the barista page that there is a new order
        pusherClient.trigger('orders', 'order', {
          id: order.get('id'),
          product: coffeeOrder,
          message: req.body.Body
        });

        // Tell the Dashboard (separate project) that there is a new order
        pusherClient.trigger('orders', 'dashboard', {
          source: source.name,
          type: coffeeOrder,
          time: Math.round(Date.now() / 1000)
        });

        let responseMessage = `Thanks for ordering a ${coffeeOrder} from the Twilio powered Coffee Shop. We'll text you back when it's ready. In the mean time check out this repo https://github.com/dkundel/twilio-barista-node if you want to see how we built this app.`;
        return responseMessage;
      });
    })
    .then(responseMessage => {
      // Respond to message
      return sendMessage(source, responseMessage);
    })
    .catch(err => {
      console.error(err);
    });
}

const router = require('express').Router();

router.post('/', parsePostBody, handleIncomingMessage);

module.exports = router;
