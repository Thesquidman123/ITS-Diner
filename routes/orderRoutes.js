const express = require('express');
const { createOrder, listOrders, updateStatus } = require('../controllers/orderController');
const { requireAuth, requireRole, optionalAuth } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, listOrders);
router.post('/', optionalAuth, createOrder);
router.patch('/:id/status', requireAuth, requireRole('owner', 'staff'), updateStatus);

module.exports = router;
