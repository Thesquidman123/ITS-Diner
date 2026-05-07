const { readCollection, writeCollection } = require('../models/fileStore');
const { nowIso } = require('../shared/utils');

const DEFAULTS = {
  appName: 'ITS Diner',
  isOpen: true,
  closedMessage: 'We are currently closed. Check back soon!',
  loyaltyStampsRequired: 9,
  loyaltyRewardDescription: 'Free item of your choice',
  staticOrderingEnabled: true,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: ''
};

function getSettings() {
  const raw = readCollection('settings.json', DEFAULTS);
  return Array.isArray(raw) ? DEFAULTS : { ...DEFAULTS, ...raw };
}

function get(req, res) {
  res.json(getSettings());
}

function update(req, res) {
  const current = getSettings();
  const allowed = ['isOpen', 'closedMessage', 'appName', 'loyaltyStampsRequired', 'loyaltyRewardDescription', 'staticOrderingEnabled', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom'];
  const patch = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  });
  const updated = { ...current, ...patch, updatedAt: nowIso() };
  writeCollection('settings.json', updated);
  res.json(updated);
}

module.exports = { get, update, getSettings };
