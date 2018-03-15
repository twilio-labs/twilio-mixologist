const { config } = require('../data/config');
const { restClient } = require('./twilio');
const emojiFlags = require('emoji-flags');

async function handler(req, res, next) {
  const { eventId } = req.query;
  const { visibleNumbers } = config(eventId);
  const filteredNumbers = visibleNumbers.split(',').map(num => num.trim());

  try {
    const phoneNumbers = (await Promise.all(
      filteredNumbers.map(async number => {
        try {
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
        } catch (err) {
          return undefined;
        }
      })
    )).filter(x => !!x);
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
