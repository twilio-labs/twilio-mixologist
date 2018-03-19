function isHttps(req) {
  return req && req.headers && req.headers['x-forwarded-proto'] === 'https';
}

function getBaseHostUrl(req) {
  if (!req) {
    return null;
  }

  const protocol = isHttps(req) ? 'https' : 'http';
  return `${protocol}://${req.get('host')}`;
}

function forceSsl(req, res, next) {
  if (isHttps(req)) {
    next();
  } else {
    const url = `https://${req.get('host')}${req.url}`;
    res.redirect(307, url);
  }
}

module.exports = {
  forceSsl,
  isHttps,
  getBaseHostUrl,
};
