const { config } = require('../data/config');

function handler(req, res, next) {
  const { connectedPhoneNumbers } = config();
  const phoneNumbers = connectedPhoneNumbers.split(',').map(num => num.trim());
  res.send({
    phoneNumbers
  });
}

module.exports = {
  handler: handler
};
