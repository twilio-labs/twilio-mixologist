const { setup } = require('./twilio');

function handler(req, res, next) {
  console.log('??');
  setup()
    .then(() => {
      res.send('Setup Done!');
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

module.exports = { handler: handler };
