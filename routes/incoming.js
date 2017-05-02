const twilio = require('twilio');
const Pusher = require('pusher');
const bodyParser = require('body-parser');

const { Order, Source } = require('../models');
const { AVAILABLE_OPTIONS, determineCoffeeFromMessage } = require('../data/coffee-options');

const twilioClient = twilio();
const pusherClient = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: 'eu',
  encrypted: true
});
const parsePostBody = bodyParser.urlencoded({ extended: false });

function sendMessage(source, msg) {
  return twilioClient.messages.create({
    from: source.contactAddress,
    to: source.customerAddress,
    body: msg
  });
}

function handleIncomingMessage(req, res, next) {
  res.type('text/xml').send('<Response></Response>');

  const source = {
    name: req.body.From.indexOf('Messenger') !== -1 ? 'facebook' : 'sms',
    customerAddress: req.body.From,
    contactAddress: req.body.To
  };
  const coffeeOrder = determineCoffeeFromMessage(req.body.Body);

  if (!coffeeOrder) {
    let responseMessage = `Seems like your order of "${req.body.Body}" is not something we can serve. Possible orders are ${AVAILABLE_OPTIONS.join(', ')}.`;
    sendMessage(source, responseMessage);
    return;
  }

  let sourceId;

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
    }).then(sourceInstance => {
      if (!sourceInstance) {
        return [];
      }

      sourceId = sourceInstance.get('id');
      return sourceInstance.getOrders().filter(o => !o.get('fulfilled'));
    })
    .then(orders => {
      if (orders && orders.length > 0) {
        let responseMessage = `We're still making you a ${orders[0].get('name')}. Check order #${orders[0].get('id')} with the barista if you think there's something wrong.`;
        return responseMessage;
      }

      console.log(sourceId);
      return Order.create({
        name: coffeeOrder,
        fulfilled: false,
        SourceId: sourceId
      }).then(order => {
        pusherClient.trigger('orders', 'order', {
          id: order.get('id'),
          product: coffeeOrder,
          message: req.body.Body
        });

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
      return sendMessage(source, responseMessage);
    })
    .catch(err => {
      console.error(err);
    });
}

const router = require('express').Router();

router.post('/', parsePostBody, handleIncomingMessage);

module.exports = router;
