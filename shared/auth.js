const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../server/config');

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '7d' });
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken
};
