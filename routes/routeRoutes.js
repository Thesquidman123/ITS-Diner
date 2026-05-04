const express = require('express');
const { listRoutes, createRoute, arriveAtStop, clearActiveStop } = require('../controllers/routeController');
const { requireAuth, requireRole, optionalAuth } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, listRoutes);
router.post('/', requireAuth, requireRole('owner'), createRoute);
router.patch('/:id/arrive', requireAuth, requireRole('driver', 'owner'), arriveAtStop);
router.patch('/:id/clear', requireAuth, requireRole('driver', 'owner'), clearActiveStop);

module.exports = router;
