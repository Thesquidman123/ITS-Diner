const express = require('express');
const { listNotifications } = require('../controllers/notificationController');
const { requireAuth } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, listNotifications);

module.exports = router;
