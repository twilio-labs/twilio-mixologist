const twilio = require('twilio');
const { MessagingResponse } = require('twilio').twiml;

const { determineCoffeeFromMessage } = require('../data/coffee-options');
const { config } = require('../data/config');
const {
  getWrongOrderMessage,
  getExistingOrderMessage,
  getOrderCreatedMessage,
  getHelpMessage,
  getNoOpenOrderMessage,
  getQueuePositionMessage,
  getCancelOrderMessagem,
  getSystemOfflineMessage
} = require('../utils/messages');
const {
  restClient,
  customersMap,
  orderQueueList,
  allOrdersList,
  sendMessage,
  registerAddress,
  registerOpenOrder
} = require('./twilio');

const INTENTS = {
  HELP: 'help',
  QUEUE: 'queue',
  ORDER: 'order',
  CANCEL: 'cancel',
  INVALID: 'invalid'
};

/**
 * This is the request handler for incoming SMS and Facebook messages by handling webhook request from Twilio.
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 * @returns 
 */
async function handleIncomingMessages(req, res, next) {
  if (!config().isOn) {
    res.type('text/plain').send(getSystemOfflineMessage());
    return;
  }
  // Respond to HTTP request with empty Response object since we will use the REST API to respond to messages.
  const twiml = new MessagingResponse();
  res.type('text/xml').send(twiml.toString());

  const customer = getCustomerInformation(req.body);
  customer.identity = await registerAddress(req.body.From, customer.source);

  const messageIntent = determineIntent(req.body.Body);
  if (messageIntent.intent !== INTENTS.ORDER) {
    const availableOptionsMap = config().availableCoffees;
    const availableOptions = Object.keys(availableOptionsMap).filter(
      key => availableOptionsMap[key]
    );
    try {
      let responseMessage;
      if (messageIntent.intent === INTENTS.HELP) {
        responseMessage = getHelpMessage(availableOptions);
      } else if (messageIntent.intent === INTENTS.QUEUE) {
        const queuePosition = await getQueuePosition(customer);
        if (isNaN(queuePosition)) {
          responseMessage = getNoOpenOrderMessage();
        } else {
          responseMessage = getQueuePositionMessage(queuePosition);
        }
      } else if (messageIntent.intent === INTENTS.CANCEL) {
        const cancelled = await cancelOrder(customer);
        if (cancelled) {
          responseMessage = getCancelOrderMessage();
        } else {
          responseMessage = getNoOpenOrderMessage();
        }
      } else {
        responseMessage = getWrongOrderMessage(req.body.Body, availableOptions);
      }
      await sendMessageToCustomer(customer, responseMessage);
      return;
    } catch (err) {
      req.log.error(err);
      return;
    }
  }
  const coffeeOrder = messageIntent.value;

  let customerEntry = await findOrCreateCustomer(customer);
  const openOrders = customerEntry.data.openOrders;
  if (Array.isArray(openOrders) && openOrders.length > 0) {
    try {
      const order = await orderQueueList.syncListItems(openOrders[0]).fetch();
      const responseMessage = getExistingOrderMessage(
        order.data.product,
        order.index
      );
      await sendMessageToCustomer(customer, responseMessage);
      return;
    } catch (err) {
      req.log.error(err);
      return;
    }
  }

  try {
    const orderEntry = await orderQueueList.syncListItems.create(
      createOrderItem(customer, coffeeOrder, req.body.Body)
    );

    customerEntry.data.openOrders.push(orderEntry.index);
    await customersMap.syncMapItems(customerEntry.key).update({
      data: customerEntry.data
    });

    await allOrdersList.syncListItems.create({
      data: {
        product: coffeeOrder,
        message: req.body.Body,
        source: customer.source,
        countryCode: customer.countryCode
      }
    });

    await registerOpenOrder(customer.identity);

    const msg = getOrderCreatedMessage(coffeeOrder, orderEntry.index);
    await sendMessageToCustomer(customer, msg);
  } catch (err) {
    req.log.error(err);
  }
}

function getCustomerInformation({ From, Body, To, FromCountry }) {
  if (!From || !Body || !To || !FromCountry) {
    return null;
  }

  const source = From.indexOf('Messenger') !== -1 ? 'facebook' : 'sms';
  return {
    // address: From,
    openOrders: [],
    countryCode: FromCountry,
    contact: To,
    source
  };
}

function createOrderItem(customer, coffeeOrder, originalMessage) {
  return {
    data: {
      product: coffeeOrder,
      message: originalMessage,
      source: customer.source,
      status: 'open',
      customer: customer.identity
    }
  };
}

async function findOrCreateCustomer(customer) {
  try {
    customerEntry = await customersMap.syncMapItems(customer.identity).fetch();
  } catch (err) {
    customerEntry = await customersMap.syncMapItems.create({
      key: customer.identity,
      data: customer
    });
  }
  return customerEntry;
}

async function sendMessageToCustomer(customer, msg) {
  return sendMessage(customer.identity, msg);
}

function determineIntent(message) {
  const msgNormalized = message.toLowerCase().trim();
  if (msgNormalized.indexOf('help') !== -1) {
    return { intent: INTENTS.HELP };
  }

  if (msgNormalized.indexOf('queue') !== -1) {
    return { intent: INTENTS.QUEUE };
  }

  if (msgNormalized.indexOf('cancel') !== -1) {
    return { intent: INTENTS.CANCEL };
  }

  const coffeeOrder = determineCoffeeFromMessage(message);
  if (!coffeeOrder) {
    return { intent: INTENTS.INVALID };
  }

  return { intent: INTENTS.ORDER, value: coffeeOrder };
}

async function getQueuePosition(customer) {
  const key = customer.identity;
  let customerEntry;
  try {
    customerEntry = await customersMap.syncMapItems(key).fetch();
  } catch (err) {
    return NaN;
  }
  const orderNumber = customerEntry.data.openOrders[0];
  if (!orderNumber) {
    return NaN;
  }
  const items = await orderQueueList.syncListItems.list({ pageSize: 100 });
  const queuePosition = items.findIndex(item => item.index === orderNumber);
  return queuePosition >= 0 ? queuePosition : NaN;
}

async function cancelOrder(customer) {
  const key = customer.identity;
  let customerEntry;
  try {
    customerEntry = await customersMap.syncMapItems(key).fetch();
  } catch (err) {
    return false;
  }
  const orderNumber = customerEntry.data.openOrders[0];
  if (!orderNumber) {
    return false;
  }
  await orderQueueList.syncListItems(orderNumber).remove();
  customerEntry.data.openOrders = [];
  await customersMap.syncMapItems(key).update({
    data: customerEntry.data
  });
  return true;
}

module.exports = { handler: handleIncomingMessages };
