const path = require('path');
const router = require('express').Router();
const bodyParser = require('body-parser');

const { authenticate, gateForAdmin } = require('../utils/auth');
const numbers = require('./numbers');

const parseJsonBody = bodyParser.json();

// Empty endpoint that just prompts whether the API is alive
router.get('/', (req, res, next) => {
  res.send('API Alive!');
});

// Loads router for different webhooks used
router.use('/webhook', require('./webhooks'));

// Generates Twilio Sync access token
router.get('/token', authenticate, require('./token').handler);

// Different routes for admin interface
router.get('/numbers', numbers.get);
router.post(
  '/notification',
  gateForAdmin,
  parseJsonBody,
  require('./notification').handler
);
router.post('/numbers', gateForAdmin, parseJsonBody, numbers.post);
router.post('/reset', gateForAdmin, require('./reset').handler);
router.post('/setup', require('./setup').handler);

// Serves a "god view" debugging interface
router.get('/debug', gateForAdmin, (req, res, next) => {
  res.sendFile(path.resolve(__dirname, '../utils/debug.html'));
});

module.exports = router;
