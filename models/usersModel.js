const { createRepository } = require('./baseRepository');
const repository = createRepository('users.json', []);

function findByEmail(email) {
  return repository.all().find((user) => user.email === email) || null;
}

module.exports = {
  ...repository,
  findByEmail
};
