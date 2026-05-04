const { createRepository } = require('./baseRepository');

const promotionsModel = createRepository('promotions.json', []);

module.exports = promotionsModel;
