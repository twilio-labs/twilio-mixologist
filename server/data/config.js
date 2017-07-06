const EventEmitter = require('events');
const { configurationDoc } = require('../api/twilio');
const {
  DEFAULT_JSON_ENTRY_KEY,
  DEFAULT_CONFIGURATION
} = require('../../shared/consts');

let internalConfig = {};
const configEvents = new EventEmitter();

async function updateConfigEntry(key, value) {
  const currentConfig = config();
  const newConfig = Object.assign(currentConfig, { [key]: value });
  const { data } = await configurationDoc.update({ data: newConfig });
  setConfig(data);
  return config();
}

async function loadConfig() {
  try {
    const { data } = await configurationDoc.fetch();
    setConfig(data);
  } catch (err) {
    setConfig(DEFAULT_CONFIGURATION);
  }
  return config();
}

function config() {
  return internalConfig;
}

function setConfig(conf) {
  for (let key of Object.keys(conf)) {
    const val = conf[key];
    if (typeof val === 'object' && !Array.isArray(val)) {
      delete val[''];
      delete val[DEFAULT_JSON_ENTRY_KEY];
    }
  }
  internalConfig = conf;
  configEvents.emit('updated', { config: conf });
}

module.exports = {
  DEFAULT_CONFIGURATION,
  config,
  setConfig,
  configEvents,
  loadConfig,
  updateConfigEntry
};
