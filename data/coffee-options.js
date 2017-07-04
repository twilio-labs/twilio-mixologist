const { config } = require('./config');

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
  determineCoffeeFromMessage
};
