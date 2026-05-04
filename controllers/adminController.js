const fs = require('fs');
const path = require('path');
const { readCollection, writeCollection } = require('../models/fileStore');
const { uploadsDir } = require('../server/config');
const { nowIso } = require('../shared/utils');

const COLLECTIONS = ['users', 'menu', 'orders', 'routes', 'notifications', 'areas', 'promotions', 'settings', 'email-log'];
const VALID_VERSIONS = ['1.0', '1.1'];

function readImages() {
  const images = {};
  try {
    if (!fs.existsSync(uploadsDir)) return images;
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file) => {
      const fullPath = path.join(uploadsDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        images[file] = fs.readFileSync(fullPath).toString('base64');
      }
    });
  } catch {
    /* skip on error */
  }
  return images;
}

function writeImages(images) {
  if (!images || typeof images !== 'object') return 0;
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  let count = 0;
  Object.entries(images).forEach(([filename, b64]) => {
    try {
      const safeName = path.basename(filename);
      fs.writeFileSync(path.join(uploadsDir, safeName), Buffer.from(b64, 'base64'));
      count++;
    } catch { /* skip bad entries */ }
  });
  return count;
}

function backup(req, res) {
  const data = {};
  COLLECTIONS.forEach((name) => {
    try {
      data[name] = readCollection(`${name}.json`, name === 'settings' ? {} : []);
    } catch {
      data[name] = name === 'settings' ? {} : [];
    }
  });

  const images = readImages();

  const payload = {
    version: '1.1',
    appName: 'ITS Diner',
    createdAt: nowIso(),
    imageCount: Object.keys(images).length,
    data,
    images
  };

  res.setHeader('Content-Disposition', `attachment; filename="itsdiner-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json(payload);
}

function restore(req, res) {
  const payload = req.body;

  if (!payload || !VALID_VERSIONS.includes(payload.version) || !payload.data) {
    return res.status(400).json({ message: 'Invalid backup file. Must be a valid ITS Diner backup (version 1.0 or 1.1).' });
  }

  const restored = [];
  COLLECTIONS.forEach((name) => {
    if (payload.data[name] !== undefined) {
      writeCollection(`${name}.json`, payload.data[name]);
      restored.push(name);
    }
  });

  let imageCount = 0;
  if (payload.images) {
    imageCount = writeImages(payload.images);
  }

  return res.json({
    message: `Restored ${restored.length} data collections and ${imageCount} image${imageCount !== 1 ? 's' : ''} successfully.`,
    restored,
    imageCount
  });
}

function purgeOldOrders(req, res) {
  const months = Math.max(1, Number(req.query.months || 24));
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const orders = readCollection('orders.json', []);
  let count = 0;
  const updated = orders.map((o) => {
    if (new Date(o.createdAt) < cutoff) {
      count++;
      return {
        ...o,
        customerId: null,
        customerName: '[anonymised]',
        confirmationEmail: null
      };
    }
    return o;
  });

  writeCollection('orders.json', updated);
  return res.json({ message: `Anonymised ${count} order${count !== 1 ? 's' : ''} older than ${months} months.`, count });
}

module.exports = { backup, restore, purgeOldOrders };
