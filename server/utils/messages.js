const template = require('lodash.template');

const { config } = require('../data/config');

const DATA_POLICY =
  'We only use your phone number to notify you about our smoothie service and redact all the messages & phone numbers afterwards.';

// available values: originalMessage, availableOptions
const WRONG_ORDER_MESSAGES = [
  'Seems like your order of "${originalMessage}" is not something we can serve. Possible orders are:\n${availableOptions}\nWrite \'I need help\' to get an overview of other commands.',
];

// available values: product, orderNumber
const EXISTING_ORDER_MESSAGES = [
  "We're still making you a ${product}. Check order #${orderNumber} with the barista if you think there's something wrong.",
];

// available values: product, orderNumber
const ORDER_CREATED_MESSAGES = [
  "Thanks for ordering a ${product} from the Twilio powered Coffee Shop. Your order number is #${orderNumber}. We'll text you back when it's ready. ${dataPolicy} In the meantime check out this repo ${repoUrl} if you want to see how we built this app. ",
];

// available values: product, orderNumber
const ORDER_CANCELLED_MESSAGES = [
  'Your ${product} order has been cancelled. Please check with the barista if you think something is wrong. Your order number was #${orderNumber}.',
];

// available values: product, orderNumber
const ORDER_READY_MESSAGES = [
  'Your ${product} is ready. You can skip the queue and collect it at ${orderPickupLocation} right away, ask for order number #${orderNumber}.',
];

// available values:
const SYSTEM_OFFLINE_MESSAGES = [
  'No more smoothies 😱\nSeems like we are out of smoothies for today. Have a great day!',
];

// available values: availableOptions
const HELP_MESSAGES = [
  'Simply message the beverage you would like. The available options are: ${availableOptions}. Alternatively write "cancel order" to cancel your existing order or "queue" to determine your position in the queue.',
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
  'Your order #${orderNumber} for ${product} has been successfully cancelled.',
];

// available values: error
const OOPS_MESSAGES = [
  'Oops something went wrong! Talk to someone from Twilio and see if they can help you.',
];

const POST_REGISTRATION = [
  "Thank you! Now let's get you some drinks. What would you like? The options are: ${availableOptions}\n PS: Every attendee can get up to ${maxNumberOrders} beverages.",
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

function formatAvailableOptions(availableOptions) {
  let string = '';
  availableOptions.map(option => {
    string+= option + '\n';
  })
  return string;
}

function pickRandom(arr) {
  const len = arr.length;
  const idx = Math.floor(Math.random() * len);
  return arr[idx];
}

function getWrongOrderMessage(originalMessage, availableOptions) {
  const tmpl = template(pickRandom(WRONG_ORDER_MESSAGES));
  return tmpl({
    originalMessage,
    availableOptions: formatAvailableOptions(availableOptions),
  });
}

function getExistingOrderMessage(product, orderNumber) {
  const tmpl = template(pickRandom(EXISTING_ORDER_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getOrderCreatedMessage(product, orderNumber, forEvent) {
  const repoUrl = config(forEvent).repoUrl;
  const dataPolicy = DATA_POLICY;
  const tmpl = template(pickRandom(ORDER_CREATED_MESSAGES));
  return tmpl({ product, orderNumber, repoUrl, dataPolicy });
}

function getOrderCancelledMessage(product, orderNumber) {
  const tmpl = template(pickRandom(ORDER_CANCELLED_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getOrderReadyMessage(product, orderNumber, forEvent) {
  const orderPickupLocation = config(forEvent).orderPickupLocation
  const tmpl = template(pickRandom(ORDER_READY_MESSAGES));
  return tmpl({ product, orderNumber, orderPickupLocation });
}

function getSystemOfflineMessage(forEvent) {
  const customMessage = config(forEvent).offlineMessage;
  if (typeof customMessage === 'string' && customMessage.trim().length > 0) {
    return customMessage;
  }
  const tmpl = template(pickRandom(SYSTEM_OFFLINE_MESSAGES));
  return tmpl();
}

function getHelpMessage(availableOptions) {
  const tmpl = template(pickRandom(HELP_MESSAGES));
  return tmpl({
    availableOptions: formatAvailableOptions(availableOptions),
  });
}

function getNoOpenOrderMessage() {
  const tmpl = template(pickRandom(NO_OPEN_ORDER_MESSAGES));
  return tmpl();
}

function getQueuePositionMessage(queuePosition) {
  const tmpl = template(pickRandom(QUEUE_POSITION_MESSAGES));
  return tmpl({ queuePosition });
}

function getCancelOrderMessage(product, orderNumber) {
  const tmpl = template(pickRandom(CANCEL_ORDER_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getOopsMessage(error) {
  const tmpl = template(pickRandom(OOPS_MESSAGES));
  return tmpl({ error });
}

function getPostRegistrationMessage(availableOptions, maxNumberOrders) {
  const tmpl = template(pickRandom(POST_REGISTRATION));
  return tmpl({ availableOptions: commaListsAnd`${availableOptions}` });
}

function getEventRegistrationMessage(choices) {
  const tmpl = template(pickRandom(EVENT_REGISTRATION));
  return tmpl({ choices: choices.join('\n') });
}

function getNoActiveEventsMessage() {
  const tmpl = template(pickRandom(NO_ACTIVE_EVENTS));
  return tmpl();
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
