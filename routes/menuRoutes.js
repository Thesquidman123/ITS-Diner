const express = require('express');
const { listMenu, createMenuItem, updateMenuItem, toggleAvailability } = require('../controllers/menuController');
const { requireAuth, requireRole, optionalAuth } = require('../server/middleware/authMiddleware');
const { upload, processImage } = require('../server/middleware/uploadMiddleware');

const router = express.Router();

router.get('/', optionalAuth, listMenu);
router.post('/', requireAuth, requireRole('owner'), upload.single('image'), processImage, createMenuItem);
router.put('/:id', requireAuth, requireRole('owner'), upload.single('image'), processImage, updateMenuItem);
router.patch('/:id/toggle', requireAuth, requireRole('owner'), toggleAvailability);

module.exports = router;
