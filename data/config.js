const EventEmitter = require('events');
const { AVAILABLE_OPTIONS, POSSIBLE_OPTIONS } = require('./coffee-options');
const { configurationDoc } = require('../api/twilio');

const DEFAULT_CONFIGURATION = {
  isOn: true,
  offlineMessage: 'We are sorry but there is currently no coffee.',
  availableCoffees: createBooleanMapOfArray(AVAILABLE_OPTIONS),
  spellingMap: POSSIBLE_OPTIONS,
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
