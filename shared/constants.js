const ROLES = {
  OWNER: 'owner',
  STAFF: 'staff',
  DRIVER: 'driver',
  CUSTOMER: 'customer'
};

const ORDER_STATUS = ['new', 'preparing', 'ready', 'collected'];
const PAYMENT_TYPES = ['card', 'credit', 'guest'];
const ORDER_TYPES = ['static', 'route'];

module.exports = {
  ROLES,
  ORDER_STATUS,
  PAYMENT_TYPES,
  ORDER_TYPES
};
