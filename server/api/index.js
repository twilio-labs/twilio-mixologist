const path = require('path');
const router = require('express').Router();
const bodyParser = require('body-parser');
const { authenticate, gateForAdmin } = require('../utils/auth');

const parseJsonBody = bodyParser.json();

// Empty endpoint that just prompts whether the API is alive
router.get('/', (req, res, next) => {
  res.send('API Alive!');
});

// Loads router for different webhooks used
router.use('/webhook', require('./webhooks'));

// Generates Twilio Sync access token
router.get('/token', authenticate, require('./token').handler);
router.get('/dashboard-token', require('./token').handlerDashboard);

// Different routes for admin interface
router.use('/admin', require('./admin'));

// Serves a "god view" debugging interface
router.get('/debug', gateForAdmin, (req, res, next) => {
  res.sendFile(path.resolve(__dirname, '../utils/debug.html'));
});

// Returns information necessary for the kiosk screen
router.get('/kiosk', require('./kiosk').handler);

// Returns basic stats on coffee orders
router.get('/stats', require('./stats').handler);

module.exports = router;
