const { setup } = require('../twilio');
const { getBaseHostUrl } = require('../../utils/request');

function handler(req, res, next) {
  const baseUrl = getBaseHostUrl(req);
  setup(baseUrl)
    .then(() => {
      res.send('Setup Done!');
    })
    .catch(err => {
      req.log.error(err);
      res.status(500).send(err);
    });
}

module.exports = { handler };
