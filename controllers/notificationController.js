const notificationsModel = require('../models/notificationsModel');

function listNotifications(req, res) {
  const all = notificationsModel.all().filter((item) => !item.userId || item.userId === req.user.id || req.user.role === 'owner');
  res.json(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30));
}

module.exports = {
  listNotifications
};
