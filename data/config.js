const EventEmitter = require('events');
const { configurationDoc } = require('../api/twilio');

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
  countriesAvailable: [],
  repoUrl: 'https://github.com/dkundel/twilio-barista-node'
};

function createBooleanMapOfArray(array) {
  return array.reduce((map, entry) => {
    map[entry] = true;
    return map;
  }, {});
}

let internalConfig = {};
const configEvents = new EventEmitter();

async function loadConfig() {
  try {
    const { data } = await configurationDoc.fetch();
    setConfig(data);
  } catch (err) {
    console.error(err);
    setConfig(DEFAULT_CONFIGURATION);
  }
  return config();
}

function config() {
  return internalConfig;
}

function setConfig(conf) {
  internalConfig = conf;
  configEvents.emit('updated', { config: conf });
}

module.exports = {
  DEFAULT_CONFIGURATION,
  config,
  setConfig,
  configEvents,
  loadConfig
};
