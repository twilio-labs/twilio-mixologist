function isHttps(req) {
  return req && req.headers && req.headers['x-forwarded-proto'] === 'https';
}

function getBaseHostUrl(req) {
  if (!req) {
    return null;
  }

  let protocol = isHttps(req) ? 'https' : 'http';
  return `${protocol}://${req.get('host')}`;
}

module.exports = {
  isHttps,
  getBaseHostUrl
};
