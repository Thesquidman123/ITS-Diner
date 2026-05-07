const { ensureFile, readCollection, writeCollection } = require('./fileStore');
const { hashPassword } = require('../shared/auth');
const { createId, nowIso } = require('../shared/utils');
const { ROLES } = require('../shared/constants');

function seedIfNeeded() {
  ensureFile('users.json', []);
  ensureFile('menu.json', []);
  ensureFile('orders.json', []);
  ensureFile('routes.json', []);
  ensureFile('notifications.json', []);
  ensureFile('areas.json', []);
  ensureFile('promotions.json', []);
  ensureFile('settings.json', { appName: 'ITS Diner', isOpen: true, closedMessage: 'We are currently closed. Check back soon!', loyaltyStampsRequired: 9, staticOrderingEnabled: true });
  ensureFile('email-log.json', []);

  const users = readCollection('users.json', []);
  if (users.length === 0) {
    writeCollection('users.json', [
      {
        id: createId('usr'),
        role: ROLES.OWNER,
        name: 'Owner Demo',
        email: 'owner@foodvan.local',
        phone: '07000000001',
        passwordHash: hashPassword('Password123!'),
        creditEnabled: false,
        creditLimit: 0,
        balance: 0,
        favourites: [],
        subscribedAreas: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: createId('usr'),
        role: ROLES.STAFF,
        name: 'Kitchen Demo',
        email: 'staff@foodvan.local',
        phone: '07000000002',
        passwordHash: hashPassword('Password123!'),
        creditEnabled: false,
        creditLimit: 0,
        balance: 0,
        favourites: [],
        subscribedAreas: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: createId('usr'),
        role: ROLES.DRIVER,
        name: 'Driver Demo',
        email: 'driver@foodvan.local',
        phone: '07000000003',
        passwordHash: hashPassword('Password123!'),
        creditEnabled: false,
        creditLimit: 0,
        balance: 0,
        favourites: [],
        subscribedAreas: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
    ]);
  }


  const routes = readCollection('routes.json', []);
  if (routes.length === 0) {
    const driver = readCollection('users.json', []).find((user) => user.role === ROLES.DRIVER);
    writeCollection('routes.json', [
      {
        id: createId('route'),
        name: 'Lunch Route',
        driverId: driver ? driver.id : null,
        activeStopId: null,
        activeUntil: null,
        isLive: false,
        stops: [
          { id: createId('stop'), name: 'Business Park', startsAt: '12:00', durationMinutes: 20, isActive: false },
          { id: createId('stop'), name: 'Town Square', startsAt: '13:00', durationMinutes: 20, isActive: false }
        ],
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ]);
  }
}

module.exports = { seedIfNeeded };
