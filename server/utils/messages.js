const template = require('lodash.template');
const axios = require('axios');

const { config } = require('../data/config');

let templates = [];

axios.get('https://content.twilio.com/v1/Content', {
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: process.env.TWILIO_API_KEY,
    password: process.env.TWILIO_API_SECRET
  },
}).then(res => {

  templates = res.data.contents.filter(c => c.friendly_name.startsWith(process.env.CONTENT_PREFIXES));
}).catch(error => {
  console.error("Couldn't fetch templates.");
  process.exit(0)
})

const MENU_ITEMS = process.env.MENU_ITEMS.split("|").map(rawItem => rawItem.split(":"));//TODO remove when coming via availableOptions

const DATA_POLICY =
  '\n\nWe only use your phone number to notify you about our smoothie service and redact all the messages & phone numbers afterwards.';


// available values: product, orderNumber
const EXISTING_ORDER_MESSAGES = [
  "We're still making you a ${product}. Check order #${orderNumber} with our staff if you think there's something wrong.",
];

// available values: product, orderNumber
const ORDER_CREATED_MESSAGES = [
  "Thanks for ordering a *${product}* from the Twilio powered Smoothie Bar. Your order number is *#${orderNumber}*. We'll text you back when it's ready. ${dataPolicy} In the meantime check out this repo ${repoUrl} if you want to see how we built this app. ",
];

// available values: product, orderNumber
const ORDER_CANCELLED_MESSAGES = [
  'Your ${product} order has been cancelled. Please check with our staff if you think something is wrong. Your order number was #${orderNumber}.',
];

// available values: product, orderNumber
const ORDER_READY_MESSAGES = [
  'Your ${product} is ready. You can skip the queue and collect it at ${orderPickupLocation} right away, ask for order number #${orderNumber}.',
];

// available values:
const SYSTEM_OFFLINE_MESSAGES = [
  'No more smoothies 😱\nSeems like we are out of smoothies for today. Have a great day!',
];

// available values:
const NO_OPEN_ORDER_MESSAGES = [
  'Seems like you have no open order at the moment. Simply message us the name of the beverage you would like.',
];

// available values: queuePosition
const QUEUE_POSITION_MESSAGES = [
  'There are currently ${queuePosition} orders before yours.',
];

// available values: product, orderNumber
const CANCEL_ORDER_MESSAGES = [
  'Your order #${orderNumber} for ${product} has been cancelled successfully.',
];

// available values: error
const OOPS_MESSAGES = [
  'Oops something went wrong! Talk to someone from Twilio and see if they can help you.',
];

const MAX_ORDERS = [
  "It seems like you've reached the maximum numbers of orders we allowed at this event. Sorry.",
];

const EVENT_REGISTRATION = [
  "Which event are you currently at? Please reply with the number of your event below. \n${choices}",
];

const NO_ACTIVE_EVENTS = [
  'Oh no! 😕 It seems like we are not serving at the moment. Please check back later 🙂',
];

function pickRandom(arr) {
  const len = arr.length;
  const idx = Math.floor(Math.random() * len);
  return arr[idx];
}

function getWrongOrderMessage(originalMessage, availableOptions) { //TODO make dependable to available options

  const variables = [originalMessage, ...MENU_ITEMS.flat()];
  const contentVariables = {};
  for (const key of variables.keys()) {
    contentVariables[key] = variables[key];
  }

  const templateName = `${process.env.CONTENT_PREFIXES}wrong_order_${MENU_ITEMS.length}`;
  const template = templates.find(t => t.friendly_name === templateName);

  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };

}

function getExistingOrderMessage(product, orderNumber) {
  const tmpl = template(pickRandom(EXISTING_ORDER_MESSAGES));
  return {
    body: tmpl({ product, orderNumber })
  }
}

function getOrderCreatedMessage(product, orderNumber, forEvent) {
  const repoUrl = config(forEvent).repoUrl;
  const dataPolicy = DATA_POLICY;
  const tmpl = template(pickRandom(ORDER_CREATED_MESSAGES));
  return {
    body: tmpl({ product, orderNumber, repoUrl, dataPolicy })
  }
}

function getOrderCancelledMessage(product, orderNumber) {
  const tmpl = template(pickRandom(ORDER_CANCELLED_MESSAGES));
  return {
    body: tmpl({ product, orderNumber })
  }
}

function getOrderReadyMessage(product, orderNumber, forEvent) {
  const orderPickupLocation = config(forEvent).orderPickupLocation
  const tmpl = template(pickRandom(ORDER_READY_MESSAGES));
  return {
    body: tmpl({ product, orderNumber, orderPickupLocation })
  }
}

function getSystemOfflineMessage(forEvent) {
  const customMessage = config(forEvent).offlineMessage;
  if (typeof customMessage === 'string' && customMessage.trim().length > 0) {
    return {
      body: customMessage
    };
  }
  const tmpl = template(pickRandom(SYSTEM_OFFLINE_MESSAGES));
  return {
    body: tmpl()
  }
}

function getHelpMessage(availableOptions) {  //TODO make dependable to available options

  const variables = MENU_ITEMS.flat();
  const contentVariables = {};
  for (const key of variables.keys()) {
    contentVariables[key] = variables[key];
  }

  const templateName = `${process.env.CONTENT_PREFIXES}help_privacy_${MENU_ITEMS.length}`;
  const template = templates.find(t => t.friendly_name === templateName);

  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };
}

function getNoOpenOrderMessage() {
  const tmpl = template(pickRandom(NO_OPEN_ORDER_MESSAGES));
  return {
    body: tmpl()
  }
}

function getQueuePositionMessage(queuePosition) {
  const tmpl = template(pickRandom(QUEUE_POSITION_MESSAGES));
  return {
    body: tmpl({ queuePosition })
  }
}

function getCancelOrderMessage(product, orderNumber) {
  const tmpl = template(pickRandom(CANCEL_ORDER_MESSAGES));
  return {
    body: tmpl({ product, orderNumber })
  }
}

function getOopsMessage(error) {
  const tmpl = template(pickRandom(OOPS_MESSAGES));
  return {
    body: tmpl({ error })
  }
}

function getPostRegistrationMessage(availableOptions, maxNumberOrders) {   //TODO make dependable to available options

  const variables = [maxNumberOrders, ...MENU_ITEMS.flat()];
  const contentVariables = {};
  for (const key of variables.keys()) {
    contentVariables[key] = variables[key];
  }

  const templateName = `${process.env.CONTENT_PREFIXES}post_registration_${MENU_ITEMS.length}`;
  const template = templates.find(t => t.friendly_name === templateName);

  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };

}

function getMaxOrdersMessage() {
  const tmpl = template(pickRandom(MAX_ORDERS));
  return {
    body: tmpl()
  }
}

function getEventRegistrationMessage(choices) {
  const tmpl = template(pickRandom(EVENT_REGISTRATION)); //TODO better to use a list message as well
  return {
    body: tmpl({ choices: choices.join('\n') })
  }
}

function getNoActiveEventsMessage() {
  const tmpl = template(pickRandom(NO_ACTIVE_EVENTS));
  return {
    body: tmpl()
  }
}

module.exports = {
  getWrongOrderMessage,
  getExistingOrderMessage,
  getOrderCreatedMessage,
  getOrderCancelledMessage,
  getOrderReadyMessage,
  getSystemOfflineMessage,
  getHelpMessage,
  getMaxOrdersMessage,
  getNoOpenOrderMessage,
  getQueuePositionMessage,
  getCancelOrderMessage,
  getOopsMessage,
  getPostRegistrationMessage,
  getEventRegistrationMessage,
  getNoActiveEventsMessage,
};
