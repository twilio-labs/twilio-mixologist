const router = require('express').Router();
const bodyParser = require('body-parser');

const parseBody = bodyParser.urlencoded({ extended: false });

router.post('/sync', parseBody, require('./sync').handler);
router.post('/incoming', parseBody, require('./incoming').handler);

module.exports = router;
