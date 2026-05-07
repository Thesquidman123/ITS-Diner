const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadsDir, menuUploadsDir } = require('../config');
const { createId } = require('../../shared/utils');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

fs.mkdirSync(menuUploadsDir, { recursive: true });

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Please upload a JPG, PNG, or WEBP image.`
    );
    err.status = 400;
    cb(err, false);
  }
}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE }, fileFilter });

function processImage(req, res, next) {
  if (!req.file) return next();
  const filename = `${createId('img')}.jpg`;
  const outputPath = path.join(menuUploadsDir, filename);
  sharp(req.file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(outputPath)
    .then(() => {
      req.file.filename = `menu/${filename}`;
      next();
    })
    .catch((err) => {
      console.error('[upload] Image processing failed:', err.message);
      req.file = null;
      next();
    });
}

function checkUploadsWritable() {
  const testPath = path.join(menuUploadsDir, '.write-test');
  try {
    fs.writeFileSync(testPath, 'ok');
    fs.unlinkSync(testPath);
    console.log('✅  Uploads directory writable:', menuUploadsDir);
  } catch (err) {
    console.warn('⚠️   Uploads directory NOT writable:', menuUploadsDir, '-', err.message);
  }
}

module.exports = { upload, processImage, checkUploadsWritable };
