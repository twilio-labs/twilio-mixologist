const { MessagingResponse } = require('twilio').twiml;
const moment = require('moment');

const { determineCoffeeFromMessage } = require('../../data/coffee-options');
const { config } = require('../../data/config');
const {
  getWrongOrderMessage,
  getExistingOrderMessage,
  getOrderCreatedMessage,
  getHelpMessage,
  getNoOpenOrderMessage,
  getQueuePositionMessage,
  getCancelOrderMessage,
  getSystemOfflineMessage,
  getEventRegistrationMessage,
  getNoActiveEventsMessage,
} = require('../../utils/messages');
const {
  customersMap,
  orderQueueList,
  allOrdersList,
  sendMessage,
  registerAddress,
  registerOpenOrder,
  registerTagForBinding,
  removeTagForBinding,
  removeTagsForBindingWithPrefix,
  getIdentityFromAddress,
} = require('../twilio');
const {
  INTENTS,
  CUSTOMER_STATES,
  COOKIES,
  TAGS,
} = require('../../../shared/consts');

const { safe } = require('../../utils/async-requests.js');

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
    source,
    eventId: null,
  };
}

function createOrderItem(customer, coffeeOrder, originalMessage) {
  return {
    data: {
      product: coffeeOrder,
      message: originalMessage,
      source: customer.source,
      status: 'open',
      customer: customer.identity,
    },
  };
}

async function findOrCreateCustomer(customer) {
  let customerEntry;
  try {
    customerEntry = await customersMap.syncMapItems(customer.identity).fetch();
  } catch (err) {
    customerEntry = await customersMap.syncMapItems.create({
      key: customer.identity,
      data: customer,
    });
  }
  return customerEntry;
}

async function setEventForCustomer(customerEntry, eventId) {
  const eventExpiryDate = moment()
    .add(5, 'days')
    .valueOf();
  // let bindingSid = await removeTagsForBindingWithPrefix(
  //   customerEntry.data.bindingSid,
  //   TAGS.PREFIX_EVENT
  // );
  const bindingSid = await registerTagForBinding(
    customerEntry.data.bindingSid,
    TAGS.PREFIX_EVENT + eventId
  );
  const data = Object.assign({}, customerEntry.data, {
    bindingSid,
    eventId,
    eventExpiryDate,
  });
  return customerEntry.update({ data });
}

async function removeEventForCustomer(customerEntry) {
  const data = Object.assign({}, customerEntry.data);
  data.bindingSid = await removeTagForBinding(
    data.bindingSid,
    TAGS.PREFIX_EVENT + data.eventId
  );
  data.eventId = undefined;
  data.eventExpiryDate = undefined;
  return customerEntry.update({ data });
}

async function updateBindingSidForCustomer(customerEntry, bindingSid) {
  const data = Object.assign({}, customerEntry.data, {
    bindingSid,
  });
  return customerEntry.update({ data });
}

async function sendMessageToCustomer(customer, msg) {
  return sendMessage(customer.identity, msg);
}

function determineIntent(message, forEvent) {
  const msgNormalized = message.toLowerCase().trim();
  if (msgNormalized.startsWith('_register:')) {
    const eventId = msgNormalized.replace('_register:', '').trim();
    return {
      intent: INTENTS.REGISTER,
      value: eventId,
    };
  }

  if (msgNormalized.startsWith('_unregister')) {
    return {
      intent: INTENTS.UNREGISTER,
    };
  }

  if (msgNormalized.startsWith('_eventinfo')) {
    return {
      intent: INTENTS.GET_EVENT,
    };
  }

  if (msgNormalized.indexOf('help') !== -1) {
    return {
      intent: INTENTS.HELP,
    };
  }

  if (msgNormalized.indexOf('queue') !== -1) {
    return {
      intent: INTENTS.QUEUE,
    };
  }

  if (msgNormalized.indexOf('cancel') !== -1) {
    return {
      intent: INTENTS.CANCEL,
    };
  }

  const coffeeOrder = determineCoffeeFromMessage(message, forEvent);
  if (!coffeeOrder) {
    return {
      intent: INTENTS.INVALID,
    };
  }

  return {
    intent: INTENTS.ORDER,
    value: coffeeOrder,
  };
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
  const items = await orderQueueList(customer.eventId).syncListItems.list({
    pageSize: 100,
  });
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
  await orderQueueList(customer.eventId)
    .syncListItems(orderNumber)
    .remove();
  customerEntry.data.openOrders = [];
  await customersMap.syncMapItems(key).update({
    data: customerEntry.data,
  });
  return true;
}

/**
 * This is the request handler for incoming SMS and Facebook messages by handling webhook request from Twilio.
 *
 * @param {any} req
 * @param {any} res
 * @returns
 */
async function handleIncomingMessages(req, res) {
  const customer = getCustomerInformation(req.body);
  customer.identity = getIdentityFromAddress(req.body.From);
  let customerEntry = await findOrCreateCustomer(customer);
  if (!customerEntry.data.bindingSid) {
    const { sid } = await registerAddress(req.body.From, customer.source);
    customerEntry = await updateBindingSidForCustomer(customerEntry, sid);
    customer.bindingSid = sid;
  }

  if (
    !customerEntry.data.eventId ||
    customerEntry.data.eventExpiryDate < Date.now()
  ) {
    if (req.cookies[COOKIES.CUSTOMER_STATE] !== CUSTOMER_STATES.SET) {
      const { events } = config();
      const choices = Object.values(events)
        .filter(x => {
          return x.isVisible;
        })
        .map(x => x.eventName)
        .map((name, idx) => `${idx + 1}: ${name}`);
      const choiceToEventId = Object.keys(events).filter(
        x => events[x].isVisible
      );
      if (choiceToEventId.length === 0) {
        res.type('text/plain').send(getNoActiveEventsMessage());
        return;
      } else if (choiceToEventId.length > 1) {
        const message = getEventRegistrationMessage(choices);
        res.cookie(COOKIES.CUSTOMER_STATE, CUSTOMER_STATES.SET);
        res.cookie(COOKIES.EVENT_MAPPING, choiceToEventId.join(','));
        res.cookie(COOKIES.ORIGINAL_MESSAGE, req.body.Body);
        res.type('text/plain').send(message);
        return;
      }
      const autoChosenEventId = choiceToEventId[0];
      customerEntry = await setEventForCustomer(
        customerEntry,
        autoChosenEventId
      );
    } else {
      res.type('text/plain');
      const eventChoices = req.cookies[COOKIES.EVENT_MAPPING].split(',');
      const choice = parseInt(req.body.Body.trim(), 10);
      if (isNaN(choice)) {
        res.send('🙁 Please send only the number of the respective event.');
        return;
      }
      const chosenEventId = eventChoices[choice - 1];
      if (!chosenEventId) {
        res.send(
          '🤷‍♀️ You chose an invalid number for the event. 🤷‍♂️ Please try again.'
        );
        return;
      }
      customerEntry = await setEventForCustomer(customerEntry, chosenEventId);
      req.body.Body = req.cookies[COOKIES.ORIGINAL_MESSAGE];
      res.clearCookie(COOKIES.CUSTOMER_STATE);
      res.clearCookie(COOKIES.EVENT_MAPPING);
      res.clearCookie(COOKIES.ORIGINAL_MESSAGE);
    }
  }

  const { eventId } = customerEntry.data;
  customer.eventId = eventId;
  const messageIntent = determineIntent(req.body.Body, eventId);

  if (messageIntent.intent === INTENTS.REGISTER) {
    customerEntry = await setEventForCustomer(
      customerEntry,
      messageIntent.value
    );
    res.type('text/plain').send(`Registered for ${messageIntent.value}`);
    return;
  } else if (messageIntent.intent === INTENTS.UNREGISTER) {
    customerEntry = await removeEventForCustomer(customerEntry);
    res.type('text/plain').send(`Unregistered from all events`);
    return;
  } else if (messageIntent.intent === INTENTS.GET_EVENT) {
    res.type('text/plain').send(`You are registered for: ${eventId}`);
    return;
  }

  if (!config(eventId).isOn) {
    res.type('text/plain').send(getSystemOfflineMessage(eventId));
    return;
  }
  // Respond to HTTP request with empty Response object since we will use the REST API to respond to messages.
  const twiml = new MessagingResponse();
  res.type('text/xml').send(twiml.toString());

  if (messageIntent.intent !== INTENTS.ORDER) {
    const availableOptionsMap = config(eventId).availableCoffees;
    const availableOptions = Object.keys(availableOptionsMap).filter(
      key => availableOptionsMap[key]
    );
    try {
      let responseMessage;
      if (messageIntent.intent === INTENTS.HELP) {
        responseMessage = getHelpMessage(availableOptions);
      } else if (messageIntent.intent === INTENTS.QUEUE) {
        const queuePosition = await getQueuePosition(customer);
        if (Number.isNaN(queuePosition)) {
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
      res.send();
      return;
    } catch (err) {
      req.log.error(err);
      res.status(500).send();
      return;
    }
  }
  const coffeeOrder = messageIntent.value;

  const { openOrders } = customerEntry.data;
  if (Array.isArray(openOrders) && openOrders.length > 0) {
    try {
      const order = await orderQueueList(eventId)
        .syncListItems(openOrders[0])
        .fetch();
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
    const orderEntry = await orderQueueList(eventId).syncListItems.create(
      createOrderItem(customer, coffeeOrder, req.body.Body)
    );

    customerEntry.data.openOrders.push(orderEntry.index);
    await customersMap.syncMapItems(customerEntry.key).update({
      data: customerEntry.data,
    });

    await allOrdersList(eventId).syncListItems.create({
      data: {
        product: coffeeOrder,
        message: req.body.Body,
        source: customer.source,
        countryCode: customer.countryCode,
      },
    });

    const newBindingSid = await registerOpenOrder(
      customerEntry.data.bindingSid
    );
    customerEntry = await updateBindingSidForCustomer(
      customerEntry,
      newBindingSid
    );

    const msg = getOrderCreatedMessage(coffeeOrder, orderEntry.index, eventId);
    await sendMessageToCustomer(customer, msg);
    res.send();
  } catch (err) {
    req.log.error(err);
    res.status(500).send();
  }
}

module.exports = {
  handler: safe(handleIncomingMessages),
};
