/**
 * These are all coffee options that can actually be ordered
 */
const AVAILABLE_OPTIONS = [
  'Espresso',
  'Cappuccino',
  'Latte',
  'Americano',
  'Mocha',
  'Flat White'
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
  'caff� latte': 'Latte',
  'caff� latte': 'Latte',
  'caffe latte': 'Latte',
  americano: 'Americano',
  'white americano': 'Americano',
  'caff�': 'Americano',
  mocha: 'Mocha',
  mocca: 'Mocha',
  moca: 'Mocha',
  mocacino: 'Mocha',
  mochaccino: 'Mocha',
  'flat white': 'Flat White',
  flatwhite: 'Flat White',
  'flat-white': 'Flat White',
  'flatt white': 'Flat White'
};

/**
 * Determines based on a message which coffee is trying to be ordered.
 * 
 * @param {any} messageBody 
 * @returns string with coffee name or null if none could be determined
 */
function determineCoffeeFromMessage(messageBody) {
  const message = messageBody.trim().toLowerCase();
  for (let option of Object.keys(POSSIBLE_OPTIONS)) {
    if (
      message.indexOf(option) !== -1 &&
      AVAILABLE_OPTIONS.indexOf(POSSIBLE_OPTIONS[option]) !== -1
    ) {
      return POSSIBLE_OPTIONS[option];
    }
  }
  return null;
}

module.exports = {
  AVAILABLE_OPTIONS,
  POSSIBLE_OPTIONS,
  determineCoffeeFromMessage
};
