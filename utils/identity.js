const { createHmac } = require('crypto');

const SECRET = process.env.PHONE_NUMBER_HASHING_SECRET;

function getIdentityFromAddress(address) {
  const key = createHmac('sha512', SECRET).update(address);
  return key.digest('hex').substr(0, 15);
}

module.exports = { getIdentityFromAddress };
