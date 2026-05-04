const express = require('express');
const { createIntent, getConfig } = require('../controllers/paymentController');

const router = express.Router();

router.get('/config', getConfig);
router.post('/intent', createIntent);

module.exports = router;
