const SYNC_NAMES = {
  ORDER_QUEUE: 'orderQueue',
  CONFIGURATION: 'configuration',
  CUSTOMERS: 'customers',
  ALL_ORDERS: 'allOrders'
};

const DEFAULT_JSON_ENTRY_KEY = 'CHOOSE_KEY';

const SEGMENTS = {
  OPEN_ORDER: 'open-order'
};

const TAGS = {
  INTERACTED: 'interacted',
  ALL: 'all'
};

const INTENTS = {
  HELP: 'help',
  QUEUE: 'queue',
  ORDER: 'order',
  CANCEL: 'cancel',
  INVALID: 'invalid'
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
  'Filter Coffee'
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
  cappacino: 'Cappuccino',
  cappocino: 'Cappuccino',
  capocino: 'Cappuccino',
  capacino: 'Cappuccino',
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
  'fliter coffee': 'Filter Coffee'
};

const DEFAULT_CONFIGURATION = {
  isOn: true,
  offlineMessage: 'We are sorry but there is currently no coffee.',
  availableCoffees: createBooleanMapOfArray(AVAILABLE_DEFAULT_OPTIONS),
  spellingMap: SPELLING_MISTAKES,
  repoUrl: 'https://github.com/dkundel/twilio-barista-node'
};

function createBooleanMapOfArray(array) {
  return array.reduce((map, entry) => {
    map[entry] = true;
    return map;
  }, {});
}

module.exports = {
  AVAILABLE_DEFAULT_OPTIONS,
  DEFAULT_CONFIGURATION,
  DEFAULT_JSON_ENTRY_KEY,
  INTENTS,
  SEGMENTS,
  SPELLING_MISTAKES,
  SYNC_NAMES,
  TAGS
};
