const express = require('express');

const router = express.Router();

router.use('/orders', require('./orders'));
router.use('/incoming', require('./incoming'));

module.exports = router;