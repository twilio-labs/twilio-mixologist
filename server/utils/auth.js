const basicAuth = require('basic-auth');

const LOGINS = processLogins(process.env.LOGINS);

function authenticate(req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  }

  const user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  const [foundUser] = LOGINS.filter(login => login.username === user.name);

  if (
    foundUser &&
    foundUser.username === user.name &&
    foundUser.password === user.pass
  ) {
    req.user = foundUser.role;
    return next();
  }
  return unauthorized(res);
}

function gateForAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user !== 'admin') {
      res.sendStatus(403);
    } else {
      next();
    }
  });
}

function processLogins(loginString) {
  const users = loginString.split(';').map(s => s.trim());
  return users.map(userString => {
    const [username, password, role] = userString.split(',').map(s => s.trim());
    return { username, password, role };
  });
}

module.exports = {
  authenticate,
  gateForAdmin,
};
