const express = require('express');
const {
  listAreas,
  createArea,
  updateArea,
  deleteArea,
  addCustomerToArea,
  removeCustomerFromArea,
  subscribeToArea
} = require('../controllers/areasController');
const { requireAuth, requireRole } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, listAreas);
router.post('/', requireAuth, requireRole('owner', 'driver'), createArea);
router.patch('/:id', requireAuth, requireRole('owner', 'driver'), updateArea);
router.delete('/:id', requireAuth, requireRole('owner', 'driver'), deleteArea);
router.post('/:id/customers', requireAuth, requireRole('owner', 'driver'), addCustomerToArea);
router.delete('/:id/customers/:customerId', requireAuth, requireRole('owner', 'driver'), removeCustomerFromArea);
router.post('/:id/subscribe', requireAuth, requireRole('customer'), subscribeToArea);

module.exports = router;
