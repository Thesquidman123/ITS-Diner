const express = require('express');
const { get, update } = require('../controllers/settingsController');
const { requireAuth, requireRole } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/', get);
router.patch('/', requireAuth, requireRole('owner'), update);

module.exports = router;
