const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadsDir } = require('../config');
const { createId } = require('../../shared/utils');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function processImage(req, res, next) {
  if (!req.file) {
    return next();
  }
  const filename = `${createId('img')}.jpg`;
  const outputPath = path.join(uploadsDir, filename);
  sharp(req.file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toFile(outputPath)
    .then(() => {
      req.file.filename = filename;
      next();
    })
    .catch(next);
}

module.exports = {
  upload,
  processImage
};
