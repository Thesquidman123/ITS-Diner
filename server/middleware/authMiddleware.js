const jwt = require('jsonwebtoken');
const usersModel = require('../../models/usersModel');
const { jwtSecret } = require('../config');

function resolveUserFromToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    return usersModel.findById(payload.sub) || null;
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = resolveUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  req.user = user;
  return next();
}

function optionalAuth(req, res, next) {
  const user = resolveUserFromToken(req);
  if (user) {
    req.user = user;
  }
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole
};
