function createBooleanMapOfArray(array) {
  return array.reduce((map, entry) => ({ ...map, [entry]: true }), {});
}

const SYNC_NAMES = {
  ORDER_QUEUE: 'orderQueue_',
  CONFIGURATION: 'configuration',
  EVENT_CONFIG: 'event_',
  CUSTOMERS: 'customers',
  ALL_ORDERS: 'allOrders_',
  METRICS: 'metrics'
};

const DEFAULT_JSON_ENTRY_KEY = 'CHOOSE_KEY';

const TAGS = {
  INTERACTED: 'interacted',
  ALL: 'all',
  OPEN_ORDER: 'open-order',
  PREFIX_EVENT: 'event_',
};

const INTENTS = {
  HELP: 'help',
  QUEUE: 'queue',
  ORDER: 'order',
  CANCEL: 'cancel',
  INVALID: 'invalid',
  UNREGISTER: 'unregister',
  REGISTER: 'register',
  GET_EVENT: 'getEvent',
};

const COOKIES = {
  CUSTOMER_STATE: 'CustomerState',
  EVENT_MAPPING: 'EventMapping',
  ORIGINAL_MESSAGE: 'PreviousMessage',
};

const CUSTOMER_STATES = {
  SET: 'set-eventId',
};

/**
 * These are all coffee options that can actually be ordered
 */
const AVAILABLE_DEFAULT_OPTIONS = [
  'Espresso',
  'Cappuccino',
  'Latte',
  'Americano',
  'Flat White',
  'Filter Coffee',
  'Hot Chocolate',
];

/**
 * This is a rudamentary solution to solve typos. All these
 * wrong spellings will map to an actual available coffee.
 */
const SPELLING_MISTAKES = {
  expreso: 'Espresso',
  expresso: 'Espresso',
  espresso: 'Espresso',
  cappacino: 'Cappuccino',
  capacino: 'Cappuccino',
  cappocino: 'Cappuccino',
  capocino: 'Cappuccino',
  cappucino: 'Cappuccino',
  cappuccino: 'Cappuccino',
  capuccino: 'Cappuccino',
  capochino: 'Cappuccino',
  late: 'Latte',
  lattey: 'Latte',
  larte: 'Latte',
  lattee: 'Latte',
  latte: 'Latte',
  'cafe late': 'Latte',
  'caffeé latte': 'Latte',
  'caffe latte': 'Latte',
  americano: 'Americano',
  'white americano': 'Americano',
  caffeé: 'Americano',
  'flat white': 'Flat White',
  flatwhite: 'Flat White',
  'flat-white': 'Flat White',
  'flatt white': 'Flat White',
  'filter coffee': 'Filter Coffee',
  coffee: 'Filter Coffee',
  'fliter coffee': 'Filter Coffee',
  'hot chocolate': 'Hot Chocolate',
  chocolate: 'Hot Chocolate',
  cocolate: 'Hot Chocolate',
};

const DEFAULT_CONFIGURATION = {
  connectedPhoneNumbers: [],
  spellingMap: SPELLING_MISTAKES,
};

const DEFAULT_EVENT_CONFIGURATION = {
  isOn: true,
  isVisible: false,
  mode: 'barista',
  offlineMessage: 'We are sorry but there is currently no coffee.',
  availableCoffees: createBooleanMapOfArray(AVAILABLE_DEFAULT_OPTIONS),
  repoUrl: 'bit.ly/twilio-barista',
  expectedOrders: 300,
  visibleNumbers: [],
};

module.exports = {
  AVAILABLE_DEFAULT_OPTIONS,
  DEFAULT_CONFIGURATION,
  DEFAULT_EVENT_CONFIGURATION,
  DEFAULT_JSON_ENTRY_KEY,
  INTENTS,
  SPELLING_MISTAKES,
  SYNC_NAMES,
  TAGS,
  COOKIES,
  CUSTOMER_STATES,
};
