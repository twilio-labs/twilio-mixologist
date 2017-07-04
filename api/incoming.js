const twilio = require('twilio');
const { MessagingResponse } = require('twilio').twiml;

const {
  AVAILABLE_OPTIONS,
  determineCoffeeFromMessage
} = require('../data/coffee-options');
const {
  getWrongOrderMessage,
  getExistingOrderMessage,
  getOrderCreatedMessage
} = require('../utils/messages');
const {
  restClient,
  customersMap,
  orderQueueList,
  allOrdersList
} = require('./twilio');

/**
 * This is the request handler for incoming SMS and Facebook messages by handling webhook request from Twilio.
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 * @returns 
 */
async function handleIncomingMessages(req, res, next) {
  const twiml = new MessagingResponse();
  // Respond to HTTP request with empty Response object since we will use the REST API to respond to messages.
  res.type('text/xml').send(twiml.toString());

  const customer = getCustomerInformation(req.body);
  const coffeeOrder = determineCoffeeFromMessage(req.body.Body);
  if (!coffeeOrder) {
    try {
      let responseMessage = getWrongOrderMessage(
        req.body.Body,
        AVAILABLE_OPTIONS
      );
      await sendMessage(customer, responseMessage);
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }
  console.log('Determined coffee:', coffeeOrder);

  let customerEntry = await findOrCreateCustomer(customer);
  console.log('Customer Entry', customerEntry);
  const openOrders = customerEntry.data.openOrders;
  console.log('Open orders', openOrders);
  if (Array.isArray(openOrders) && openOrders.length > 0) {
    try {
      console.log('Has open orders');
      const order = await orderQueueList.syncListItems(openOrders[0]).fetch();
      const responseMessage = getExistingOrderMessage(
        order.data.product,
        order.index
      );
      await sendMessage(customer, responseMessage);
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  try {
    console.log('Create order entry');
    const orderEntry = await orderQueueList.syncListItems.create(
      createOrderItem(customer, coffeeOrder, req.body.Body)
    );

    customerEntry.data.openOrders.push(orderEntry.index);
    console.log('new customer entry:', customerEntry);
    await customersMap.syncMapItems(customerEntry.key).update({
      data: customerEntry.data
    });

    console.log('Update all orders list');
    await allOrdersList.syncListItems.create({
      data: {
        product: coffeeOrder,
        message: req.body.Body,
        source: customer.source
      }
    });

    const msg = getOrderCreatedMessage(coffeeOrder, orderEntry.index);
    await sendMessage(customer, msg);
  } catch (err) {
    console.error(err);
  }
}

function getCustomerInformation({ From, Body, To, FromCountry }) {
  if (!From || !Body || !To || !FromCountry) {
    return null;
  }

  const source = From.indexOf('Messenger') !== -1 ? 'facebook' : 'sms';
  return {
    address: From,
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
      customer: customer.address
    }
  };
}

async function findOrCreateCustomer(customer) {
  try {
    customerEntry = await customersMap.syncMapItems(customer.address).fetch();
  } catch (err) {
    customerEntry = await customersMap.syncMapItems.create({
      key: customer.address,
      data: customer
    });
  }
  return customerEntry;
}

function sendMessage(customer, msg) {
  return restClient.messages.create({
    from: customer.contact,
    to: customer.address,
    body: msg
  });
}

module.exports = { handler: handleIncomingMessages };
