const express = require('express');
const { backup, restore, purgeOldOrders } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/backup', requireAuth, requireRole('owner'), backup);
router.post('/restore', requireAuth, requireRole('owner'), restore);
router.delete('/orders/old', requireAuth, requireRole('owner'), purgeOldOrders);

module.exports = router;
