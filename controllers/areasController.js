const areasModel = require('../models/areasModel');
const usersModel = require('../models/usersModel');
const { createId, nowIso } = require('../shared/utils');

function listAreas(req, res) {
  res.json(areasModel.all());
}

function createArea(req, res) {
  const { name, description = '' } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const area = {
    id: createId('area'),
    name,
    description,
    customerIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  areasModel.insert(area);
  return res.status(201).json(area);
}

function updateArea(req, res) {
  const area = areasModel.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }
  const updated = areasModel.update(area.id, {
    ...area,
    name: req.body.name || area.name,
    description: req.body.description !== undefined ? req.body.description : area.description,
    updatedAt: nowIso()
  });
  return res.json(updated);
}

function deleteArea(req, res) {
  const area = areasModel.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }
  const remaining = areasModel.all().filter((a) => a.id !== area.id);
  areasModel.saveAll(remaining);
  return res.json({ ok: true });
}

function addCustomerToArea(req, res) {
  const area = areasModel.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }
  const { customerId } = req.body;
  const customer = usersModel.findById(customerId);
  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({ message: 'Customer not found' });
  }
  const customerIds = area.customerIds || [];
  if (!customerIds.includes(customerId)) {
    customerIds.push(customerId);
  }
  const updated = areasModel.update(area.id, { ...area, customerIds, updatedAt: nowIso() });
  return res.json(updated);
}

function removeCustomerFromArea(req, res) {
  const area = areasModel.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }
  const updated = areasModel.update(area.id, {
    ...area,
    customerIds: (area.customerIds || []).filter((id) => id !== req.params.customerId),
    updatedAt: nowIso()
  });
  return res.json(updated);
}

function subscribeToArea(req, res) {
  const area = areasModel.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }
  const user = req.user;
  const subscribed = user.subscribedAreas || [];
  const isSubscribed = subscribed.includes(area.id);
  const updated = usersModel.update(user.id, {
    ...user,
    subscribedAreas: isSubscribed
      ? subscribed.filter((id) => id !== area.id)
      : [...subscribed, area.id],
    updatedAt: nowIso()
  });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
}

module.exports = {
  listAreas,
  createArea,
  updateArea,
  deleteArea,
  addCustomerToArea,
  removeCustomerFromArea,
  subscribeToArea
};
