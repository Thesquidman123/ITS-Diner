const { createRepository } = require('./baseRepository');
module.exports = createRepository('settings.json', {
  appName: 'ITS Diner',
  staticOrderingEnabled: true
});
