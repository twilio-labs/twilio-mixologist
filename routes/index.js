const express = require('express');

const auth = require('../utils/auth');

const router = express.Router();

function enableCors(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}

router.use('/orders', auth, require('./orders'));
router.use('/incoming', require('./incoming'));

router.get('/api/dashboard', enableCors, require('./dashboard'));

router.get('/setup', (req, res, next) => {
  const webhookurl = req.protocol + '://' + req.get('host') + '/incoming';
  res.render('setup', { webhookurl });
});

router.get('*', (req, res, next) => {
  res.redirect('/orders');
});

module.exports = router;