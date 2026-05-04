const { v4: uuidv4 } = require('uuid');

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${uuidv4()}`;
}

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 3; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

function sanitizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function calculateOrderTotals(items = []) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  return {
    subtotal,
    total: subtotal
  };
}

module.exports = {
  nowIso,
  createId,
  generateRef,
  sanitizeEmail,
  calculateOrderTotals
};
