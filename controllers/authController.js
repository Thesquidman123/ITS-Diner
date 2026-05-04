const usersModel = require('../models/usersModel');
const { signToken, comparePassword, hashPassword } = require('../shared/auth');
const { createId, nowIso, sanitizeEmail } = require('../shared/utils');
const { ROLES } = require('../shared/constants');
const { assertRequired } = require('../shared/validators');

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function signup(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    assertRequired(name, 'Name is required');
    assertRequired(email, 'Email is required');
    assertRequired(password, 'Password is required');
    const normalizedEmail = sanitizeEmail(email);
    if (usersModel.findByEmail(normalizedEmail)) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const user = {
      id: createId('usr'),
      role: ROLES.CUSTOMER,
      name,
      email: normalizedEmail,
      phone: phone || '',
      passwordHash: hashPassword(password),
      creditEnabled: false,
      creditLimit: 0,
      balance: 0,
      favourites: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    usersModel.insert(user);
    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = sanitizeEmail(email);
  const user = usersModel.findByEmail(normalizedEmail);
  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken(user);
  return res.json({ token, user: publicUser(user) });
}

function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}

module.exports = {
  signup,
  login,
  me
};
