const { createToken } = require('./twilio');

function handler(req, res, next) {
  if (!req.user) {
    res.status(401).send('Need to be logged in!');
    return;
  }

  const token = createToken(req.user);

  res.send({ token, identity: req.user });
}

function handlerDashboard(req, res, next) {
  const token = createToken('dashboard');
  res.send({ token, identity: 'dashboard' });
}

module.exports = { handler, handlerDashboard };
