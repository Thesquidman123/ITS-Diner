const express = require('express');
const { profile, myOrders, toggleFavourite, reorder, listCustomers, updateCredit, payDown, exportMyData, deleteMyAccount } = require('../controllers/customerController');
const { requireAuth, requireRole } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/me', requireAuth, profile);
router.get('/me/orders', requireAuth, requireRole('customer'), myOrders);
router.post('/me/favourites', requireAuth, requireRole('customer'), toggleFavourite);
router.get('/me/reorder/:id', requireAuth, requireRole('customer'), reorder);
router.get('/', requireAuth, requireRole('owner'), listCustomers);
router.post('/me/paydown', requireAuth, requireRole('customer'), payDown);
router.patch('/:id/credit', requireAuth, requireRole('owner'), updateCredit);
router.get('/me/export', requireAuth, exportMyData);
router.delete('/me', requireAuth, deleteMyAccount);

module.exports = router;
