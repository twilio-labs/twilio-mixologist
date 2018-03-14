const { config } = require('./config');

function sortByLengthDesc(a, b) {
  return b.length - a.length;
}

/**
 * Determines based on a message which coffee is trying to be ordered.
 *
 * @param {any} messageBody
 * @returns string with coffee name or null if none could be determined
 */
function determineCoffeeFromMessage(messageBody, forEvent) {
  const possibleOptions = config(forEvent).spellingMap;
  const availableOptions = config(forEvent).availableCoffees;
  const message = messageBody.trim().toLowerCase();
  for (let option of Object.keys(possibleOptions).sort(sortByLengthDesc)) {
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
