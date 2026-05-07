const path = require('path');
const fs = require('fs');
const menuModel = require('../models/menuModel');
const { createId, nowIso } = require('../shared/utils');
const { assertRequired, parseOptions } = require('../shared/validators');
const { uploadsDir } = require('../server/config');

function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    /* ignore — file may already be gone */
  }
}

function listMenu(req, res) {
  const includeUnavailable = req.user && req.user.role === 'owner';
  const items = menuModel
    .all()
    .filter((item) => includeUnavailable || item.available)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  res.json(items);
}

function createMenuItem(req, res, next) {
  try {
    const { name, price, category, description } = req.body;
    assertRequired(name, 'Name is required');
    assertRequired(price, 'Price is required');
    assertRequired(category, 'Category is required');
    const item = {
      id: createId('menu'),
      name,
      description: description || '',
      price: Number(price),
      category,
      options: parseOptions(typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options),
      imageUrl: req.file ? `/uploads/${path.basename(req.file.filename)}` : '',
      available: req.body.available === 'false' ? false : Boolean(req.body.available ?? true),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    menuModel.insert(item);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

function updateMenuItem(req, res, next) {
  try {
    const current = menuModel.findById(req.params.id);
    if (!current) {
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const newImageUrl = req.file ? `/uploads/${path.basename(req.file.filename)}` : current.imageUrl;
    try {
      const updated = menuModel.update(req.params.id, {
        ...current,
        ...req.body,
        price: req.body.price !== undefined ? Number(req.body.price) : current.price,
        options: req.body.options ? parseOptions(typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options) : current.options,
        imageUrl: newImageUrl,
        available: req.body.available !== undefined ? req.body.available === 'false' ? false : Boolean(req.body.available) : current.available,
        updatedAt: nowIso()
      });
      if (req.file && current.imageUrl && current.imageUrl !== newImageUrl) {
        deleteImageFile(current.imageUrl);
      }
      return res.json(updated);
    } catch (saveError) {
      if (req.file) deleteImageFile(newImageUrl);
      throw saveError;
    }
  } catch (error) {
    return next(error);
  }
}

function toggleAvailability(req, res) {
  const current = menuModel.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  const updated = menuModel.update(req.params.id, {
    ...current,
    available: !current.available,
    updatedAt: nowIso()
  });
  return res.json(updated);
}

module.exports = {
  listMenu,
  createMenuItem,
  updateMenuItem,
  toggleAvailability
};
