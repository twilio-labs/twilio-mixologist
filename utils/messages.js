const template = require('lodash.template');

const WRONG_ORDER_MESSAGES = [
  'Seems like your order of "${originalMessage}" is not something we can serve. Possible orders are ${availableOptions}'
];
const EXISTING_ORDER_MESSAGES = [
  "We're still making you a ${product}. Check order #${orderNumber} with the barista if you think there's something wrong."
];
const ORDER_CREATED_MESSAGES = [
  "Thanks for ordering a ${product} from the Twilio powered Coffee Shop. Your order number is #${orderNumber}. We'll text you back when it's ready. In the mean time check out this repo https://github.com/dkundel/twilio-barista-node if you want to see how we built this app."
];
const ORDER_CANCELLED_MESSAGES = [
  'Your ${product} order has been cancelled. Please check with the barista if you think something is wrong. Your order number was #${orderNumber}.'
];
const ORDER_READY_MESSAGES = [
  'Your ${product} is ready. You can collect it from the coffee shop right away, ask for order number #${orderNumber}.'
];
const SYSTEM_OFFLINE_MESSAGES = [];

function pickRandom(arr) {
  const len = arr.length;
  const idx = Math.floor(Math.random() * len);
  return arr[idx];
}

function getWrongOrderMessage(originalMessage, availableOptions) {
  const tmpl = template(pickRandom(WRONG_ORDER_MESSAGES));
  return tmpl({
    originalMessage,
    availableOptions: availableOptions.join(', ')
  });
}

function getExistingOrderMessage(product, orderNumber) {
  const tmpl = template(pickRandom(EXISTING_ORDER_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getOrderCreatedMessage(product, orderNumber) {
  const tmpl = template(pickRandom(ORDER_CREATED_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getOrderCancelledMessage(product, orderNumber) {
  const tmpl = template(pickRandom(ORDER_CANCELLED_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getOrderReadyMessage(product, orderNumber) {
  const tmpl = template(pickRandom(ORDER_READY_MESSAGES));
  return tmpl({ product, orderNumber });
}

function getSystemOfflineMessage() {
  const tmpl = template(pickRandom(SYSTEM_OFFLINE_MESSAGES));
  return tmpl();
}

module.exports = {
  getWrongOrderMessage,
  getExistingOrderMessage,
  getOrderCreatedMessage,
  getOrderCancelledMessage,
  getOrderReadyMessage,
  getSystemOfflineMessage
};
