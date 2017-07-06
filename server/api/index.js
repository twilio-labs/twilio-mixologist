const path = require('path');
const router = require('express').Router();
const bodyParser = require('body-parser');

const { authenticate, gateForAdmin } = require('../utils/auth');

const parseBody = bodyParser.urlencoded({ extended: false });
const parseJsonBody = bodyParser.json();

router.get('/', (req, res, next) => {
  res.send('Hello World!');
});

router.get('/token', authenticate, require('./token').handler);
router.post('/webhook/incoming', parseBody, require('./incoming').handler);
router.post('/webhook/sync', parseBody, require('./sync').handler);
router.post('/setup', require('./setup').handler);
router.post(
  '/notification',
  gateForAdmin,
  parseJsonBody,
  require('./notification').handler
);

router.get('/debug', gateForAdmin, (req, res, next) => {
  res.sendFile(path.resolve(__dirname, '../utils/debug.html'));
});

module.exports = router;
