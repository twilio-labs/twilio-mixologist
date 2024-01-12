const { config } = require('../data/config');
const { restClient } = require('./twilio');
const emojiFlags = require('emoji-flags');

async function handler(req, res) {
  const { eventId } = req.query;
  const { visibleNumbers, mode, availableMenu, menuDetails } = config(eventId);
  console.log('visibleNumbers: ', visibleNumbers)
  const filteredNumbers = visibleNumbers.map(num => num.trim());
  console.log('NUMBERS: ', filteredNumbers)

  try {
    const phoneNumbers = (await Promise.all(
      filteredNumbers.map(async number => {
        try {
          const sanitizedNumber = number.replace(/[^(\d|\w)]/g, '');
          const { countryCode } = await restClient.lookups
            .phoneNumbers(sanitizedNumber)
            .fetch();
          const { emoji } = emojiFlags.countryCode(countryCode);
          return {
            countryCode,
            phoneNumber: number,
            emoji,
          };
        } catch (err) {
          console.error(err)
          return undefined;
        }
      })
    )).filter(x => !!x);
    const menuItems = Object.keys(availableMenu);
    res.send({
      phoneNumbers,
      eventType: mode,
      menuItems,
      menuDetails
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).send('Failed to retrieve kiosk info');
  }
}

module.exports = {
  handler,
};
