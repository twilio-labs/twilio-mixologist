const { config } = require('../data/config');
const { restClient } = require('./twilio');
const emojiFlags = require('emoji-flags');

async function handler(req, res, next) {
  const { connectedPhoneNumbers } = config();
  const filteredNumbers = connectedPhoneNumbers
    .split(',')
    .map(num => num.trim());
  const phoneNumbers = await Promise.all(
    filteredNumbers.map(async number => {
      const {
        countryCode,
        phoneNumber
      } = await restClient.lookups.phoneNumbers(number).fetch();
      const { emoji } = emojiFlags.countryCode(countryCode);
      return {
        countryCode,
        phoneNumber,
        emoji
      };
    })
  );
  res.send({
    phoneNumbers
  });
}

module.exports = {
  handler: handler
};
