const express = require('express');

const router = express.Router();

router.use('/orders', require('./orders'));

module.exports = router;