const { config } = require('./config');

/**
 * These are all coffee options that can actually be ordered
 */
const AVAILABLE_OPTIONS = [
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
const POSSIBLE_OPTIONS = {
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

/**
 * Determines based on a message which coffee is trying to be ordered.
 * 
 * @param {any} messageBody 
 * @returns string with coffee name or null if none could be determined
 */
function determineCoffeeFromMessage(messageBody) {
  const possibleOptions = config().spellingMap;
  const availableOptions = config().availableCoffees;
  const message = messageBody.trim().toLowerCase();
  for (let option of Object.keys(possibleOptions)) {
    if (
      message.indexOf(option) !== -1 &&
      availableOptions[possibleOptions[option]]
    ) {
      return possibleOptions[option];
    }
  }
  return null;
}

module.exports = {
  AVAILABLE_OPTIONS,
  POSSIBLE_OPTIONS,
  determineCoffeeFromMessage
};
