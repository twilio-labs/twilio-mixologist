const express = require('express');

const router = express.Router();

router.use('/orders', require('./orders'));
router.use('/incoming', require('./incoming'));

router.get('/setup', (req, res, next) => {
  const webhookurl = req.protocol + '://' + req.get('host') + '/incoming';
  res.render('setup', { webhookurl });
});

router.get('*', (req, res, next) => {
  res.redirect('/orders');
});

module.exports = router;