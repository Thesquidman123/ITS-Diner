const nodemailer = require('nodemailer');
const notificationsModel = require('../../models/notificationsModel');
const { readCollection, writeCollection } = require('../../models/fileStore');
const envConfig = require('../config');
const { createId, nowIso } = require('../../shared/utils');
const { getSettings } = require('../../controllers/settingsController');

async function sendEmail(to, subject, message) {
  const saved = getSettings();
  const host = envConfig.smtpHost || saved.smtpHost || '';
  const port = envConfig.smtpPort || saved.smtpPort || 587;
  const user = envConfig.smtpUser || saved.smtpUser || '';
  const pass = envConfig.smtpPass || saved.smtpPass || '';
  const from = envConfig.emailFrom || saved.smtpFrom || 'noreply@itsdiner.local';

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass }
    });
    await transporter.sendMail({ from, to, subject, text: message });
    return;
  }

  const log = readCollection('email-log.json', []);
  log.push({ id: createId('email'), to, subject, message, createdAt: nowIso() });
  writeCollection('email-log.json', log);
}

async function createNotification({ userId = null, type, title, message, email }) {
  const notification = {
    id: createId('note'),
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: nowIso()
  };
  notificationsModel.insert(notification);
  if (email) {
    await sendEmail(email, title, message);
  }
  return notification;
}

module.exports = {
  createNotification
};
