const { config } = require('../data/config');
const { restClient } = require('./twilio');
const emojiFlags = require('emoji-flags');

async function handler(req, res, next) {
  const { eventId } = req.query;
  const { connectedPhoneNumbers } = config(eventId);
  const filteredNumbers = connectedPhoneNumbers
    .split(',')
    .map(num => num.trim());

  try {
    const phoneNumbers = await Promise.all(
      filteredNumbers.map(async number => {
        const sanitizedNumber = number.replace(/[^(\d|\w)]/g, '');
        const {
          countryCode,
          phoneNumber
        } = await restClient.lookups.phoneNumbers(sanitizedNumber).fetch();
        const { emoji } = emojiFlags.countryCode(countryCode);
        return {
          countryCode,
          phoneNumber: number,
          emoji
        };
      })
    );
    res.send({
      phoneNumbers
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).send('Failed to retrieve kiosk info');
  }
}

module.exports = {
  handler: handler
};
