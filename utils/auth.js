const basicAuth = require('basic-auth');

const USERNAME = process.env.LOGIN_USERNAME;
const PASSWORD = process.env.LOGIN_PASSWORD;

module.exports = function(req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  }

  const user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name === USERNAME && user.pass === PASSWORD) {
    return next();
  } else {
    return unauthorized(res);
  }
};
