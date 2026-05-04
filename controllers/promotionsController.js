const promotionsModel = require('../models/promotionsModel');
const { createId, nowIso } = require('../shared/utils');

function list(req, res) {
  const promos = promotionsModel.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(promos);
}

function create(req, res, next) {
  try {
    const { code, name, type, value, minOrderValue, usageLimit, expiresAt } = req.body;
    if (!code || !name || !type || value === undefined) {
      return res.status(400).json({ message: 'code, name, type and value are required' });
    }
    const validTypes = ['percent_off', 'fixed_off', 'bogo'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${validTypes.join(', ')}` });
    }
    const existing = promotionsModel.all().find((p) => p.code.toUpperCase() === String(code).toUpperCase());
    if (existing) {
      return res.status(400).json({ message: 'A promotion with that code already exists' });
    }
    const promo = {
      id: createId('promo'),
      code: String(code).toUpperCase().trim(),
      name,
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue || 0),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usageCount: 0,
      active: true,
      expiresAt: expiresAt || null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    promotionsModel.insert(promo);
    return res.status(201).json(promo);
  } catch (err) {
    return next(err);
  }
}

function update(req, res, next) {
  try {
    const promo = promotionsModel.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promotion not found' });
    const updated = promotionsModel.update(promo.id, {
      ...promo,
      ...req.body,
      code: req.body.code ? String(req.body.code).toUpperCase().trim() : promo.code,
      value: req.body.value !== undefined ? Number(req.body.value) : promo.value,
      minOrderValue: req.body.minOrderValue !== undefined ? Number(req.body.minOrderValue) : promo.minOrderValue,
      updatedAt: nowIso()
    });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

function remove(req, res) {
  const promo = promotionsModel.findById(req.params.id);
  if (!promo) return res.status(404).json({ message: 'Promotion not found' });
  const all = promotionsModel.all().filter((p) => p.id !== promo.id);
  promotionsModel.saveAll(all);
  return res.json({ ok: true });
}

function validate(req, res) {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ message: 'code is required' });

  const promo = promotionsModel.all().find((p) => p.code === String(code).toUpperCase().trim());
  if (!promo) return res.status(404).json({ message: 'Promo code not found' });
  if (!promo.active) return res.status(400).json({ message: 'This promotion is no longer active' });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return res.status(400).json({ message: 'This promotion has expired' });
  }
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    return res.status(400).json({ message: 'This promotion has reached its usage limit' });
  }
  const total = Number(orderTotal || 0);
  if (total < promo.minOrderValue) {
    return res.status(400).json({ message: `Minimum order of £${promo.minOrderValue.toFixed(2)} required for this code` });
  }

  let discount = 0;
  if (promo.type === 'percent_off') {
    discount = Math.round((total * promo.value) / 100 * 100) / 100;
  } else if (promo.type === 'fixed_off') {
    discount = Math.min(promo.value, total);
  } else if (promo.type === 'bogo') {
    discount = 0;
  }

  return res.json({ valid: true, promo, discount });
}

module.exports = { list, create, update, remove, validate };
