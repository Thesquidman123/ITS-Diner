const express = require('express');
const { list, create, update, remove, validate } = require('../controllers/promotionsController');
const { requireAuth, requireRole } = require('../server/middleware/authMiddleware');

const router = express.Router();

router.get('/', list);
router.post('/validate', validate);
router.post('/', requireAuth, requireRole('owner'), create);
router.put('/:id', requireAuth, requireRole('owner'), update);
router.delete('/:id', requireAuth, requireRole('owner'), remove);

module.exports = router;
