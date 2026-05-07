const usersModel = require('../models/usersModel');
const ordersModel = require('../models/ordersModel');
const { nowIso } = require('../shared/utils');

function profile(req, res) {
  const { passwordHash, ...safe } = req.user;
  res.json(safe);
}

function myOrders(req, res) {
  const orders = ordersModel.all().filter((order) => order.customerId === req.user.id);
  res.json(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

function toggleFavourite(req, res) {
  const { itemId } = req.body;
  const favourites = req.user.favourites || [];
  const updatedFavourites = favourites.includes(itemId)
    ? favourites.filter((entry) => entry !== itemId)
    : [...favourites, itemId];
  const updated = usersModel.update(req.user.id, {
    ...req.user,
    favourites: updatedFavourites,
    updatedAt: nowIso()
  });
  const { passwordHash, ...safe } = updated;
  res.json(safe);
}

function reorder(req, res) {
  const order = ordersModel.findById(req.params.id);
  if (!order || order.customerId !== req.user.id) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.json({ items: order.items, type: order.type, routeId: order.routeId || null, stopId: order.stopId || null });
}

function listCustomers(req, res) {
  const customers = usersModel
    .all()
    .filter((user) => user.role === 'customer')
    .map(({ passwordHash, ...safe }) => safe);
  res.json(customers);
}

function updateCredit(req, res) {
  const customer = usersModel.findById(req.params.id);
  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({ message: 'Customer not found' });
  }
  const updated = usersModel.update(customer.id, {
    ...customer,
    creditEnabled: Boolean(req.body.creditEnabled),
    creditLimit: Number(req.body.creditLimit || 0),
    balance: Number(req.body.balance ?? customer.balance ?? 0),
    updatedAt: nowIso()
  });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
}

function payDown(req, res) {
  const customer = usersModel.findById(req.user.id);
  if (!customer || !customer.creditEnabled) {
    return res.status(400).json({ message: 'Credit not enabled' });
  }
  const amount = Number(req.body.amount || 0);
  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }
  const newBalance = Math.max(0, Number(customer.balance || 0) - amount);
  const updated = usersModel.update(customer.id, { ...customer, balance: newBalance, updatedAt: nowIso() });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
}

function redeemLoyalty(req, res) {
  const customer = usersModel.findById(req.params.id);
  if (!customer || customer.role !== 'customer') {
    return res.status(404).json({ message: 'Customer not found' });
  }
  const updated = usersModel.update(customer.id, { ...customer, stamps: 0, updatedAt: nowIso() });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
}

function exportMyData(req, res) {
  const { passwordHash, ...safe } = req.user;
  const orders = ordersModel.all().filter((o) => o.customerId === req.user.id);
  res.json({
    exportedAt: nowIso(),
    profile: safe,
    orders
  });
}

function deleteMyAccount(req, res) {
  const userId = req.user.id;
  const orders = ordersModel.all();
  orders.forEach((o) => {
    if (o.customerId === userId) {
      ordersModel.update(o.id, { ...o, customerId: null, customerName: '[deleted]', confirmationEmail: null });
    }
  });
  usersModel.remove(userId);
  res.json({ message: 'Account and personal data deleted.' });
}

module.exports = {
  profile,
  myOrders,
  toggleFavourite,
  reorder,
  listCustomers,
  updateCredit,
  payDown,
  redeemLoyalty,
  exportMyData,
  deleteMyAccount
};
