const path = require('path');
const router = require('express').Router();
const bodyParser = require('body-parser');

const authenticate = require('../utils/auth');

const parseBody = bodyParser.urlencoded({ extended: false });

router.get('/', (req, res, next) => {
  res.send('Hello World!');
});

router.get('/token', authenticate, require('./token').handler);
router.post('/webhook/incoming', parseBody, require('./incoming').handler);
router.post('/webhook/sync', parseBody, require('./sync').handler);
router.post('/setup', require('./setup').handler);

router.get('/debug', authenticate, (req, res, next) => {
  if (req.user === 'admin') {
    res.sendFile(path.resolve(__dirname, '../utils/debug.html'));
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
