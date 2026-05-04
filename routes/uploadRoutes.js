const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { requireAuth, requireRole } = require('../server/middleware/authMiddleware');
const { upload, processImage } = require('../server/middleware/uploadMiddleware');

const router = express.Router();

router.post('/', requireAuth, requireRole('owner'), upload.single('image'), processImage, uploadImage);

module.exports = router;
