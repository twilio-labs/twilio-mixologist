const router = require('express').Router();
const bodyParser = require('body-parser');

const { gateForAdmin } = require('../../utils/auth');
const numbers = require('./numbers');

const parseJsonBody = bodyParser.json();

router.get('/numbers', numbers.get);
router.post(
  '/notification',
  gateForAdmin,
  parseJsonBody,
  require('./notification').handler
);
router.post('/numbers', gateForAdmin, parseJsonBody, numbers.post);
router.post('/reset', gateForAdmin, require('./reset').handler);
router.post('/setup', gateForAdmin, require('./setup').handler);

module.exports = router;
