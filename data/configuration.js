const { AVAILABLE_OPTIONS, POSSIBLE_OPTIONS } = require('./coffee-options');

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

module.exports = { DEFAULT_CONFIGURATION };
