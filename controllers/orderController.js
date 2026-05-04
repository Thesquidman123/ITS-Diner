const ordersModel = require('../models/ordersModel');
const menuModel = require('../models/menuModel');
const routesModel = require('../models/routesModel');
const usersModel = require('../models/usersModel');
const promotionsModel = require('../models/promotionsModel');
const { ORDER_STATUS, PAYMENT_TYPES, ORDER_TYPES, ROLES } = require('../shared/constants');
const { createId, generateRef, nowIso, calculateOrderTotals } = require('../shared/utils');
const { createNotification } = require('../server/services/notificationService');
const { getSettings } = require('./settingsController');

function enrichItem(rawItem) {
  const menuItem = menuModel.findById(rawItem.menuItemId);
  if (!menuItem || !menuItem.available) {
    const error = new Error('One or more items are unavailable');
    error.status = 400;
    throw error;
  }
  const selectedOptions = Array.isArray(rawItem.selectedOptions) ? rawItem.selectedOptions : [];
  const optionTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price || 0), 0);
  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    quantity: Number(rawItem.quantity || 1),
    price: Number(menuItem.price) + optionTotal,
    selectedOptions
  };
}

function validateRouteOrder(type, routeId, stopId) {
  if (type !== 'route') {
    return;
  }
  const route = routesModel.findById(routeId);
  if (!route || !route.isLive || route.activeStopId !== stopId) {
    const error = new Error('Route ordering is not active for this stop');
    error.status = 400;
    throw error;
  }
}

async function createOrder(req, res, next) {
  try {
    const { items = [], paymentType, type = 'static', routeId = null, stopId = null, paymentStatus = 'pending', scheduledFor = null, guestName, guestEmail = null, promoCode = null } = req.body;
    if (!items.length) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    if (!PAYMENT_TYPES.includes(paymentType)) {
      return res.status(400).json({ message: 'Invalid payment type' });
    }
    if (!ORDER_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid order type' });
    }

    validateRouteOrder(type, routeId, stopId);
    const enrichedItems = items.map(enrichItem);
    const totals = calculateOrderTotals(enrichedItems);
    const customer = req.user ? usersModel.findById(req.user.id) : null;

    let discount = 0;
    let appliedPromo = null;
    if (promoCode) {
      const promo = promotionsModel.all().find((p) => p.code === String(promoCode).toUpperCase().trim());
      if (promo && promo.active) {
        if (totals.total >= promo.minOrderValue) {
          if (promo.type === 'percent_off') {
            discount = Math.round((totals.total * promo.value) / 100 * 100) / 100;
          } else if (promo.type === 'fixed_off') {
            discount = Math.min(promo.value, totals.total);
          } else if (promo.type === 'bogo') {
            const cheapest = enrichedItems.reduce((min, i) => i.price < min.price ? i : min, enrichedItems[0]);
            discount = cheapest ? cheapest.price : 0;
          }
          promotionsModel.update(promo.id, { ...promo, usageCount: promo.usageCount + 1, updatedAt: nowIso() });
          appliedPromo = { code: promo.code, name: promo.name, type: promo.type, discount };
        }
      }
    }

    const finalTotal = Math.max(0, totals.total - discount);

    if (paymentType === 'credit') {
      if (!customer || customer.role !== ROLES.CUSTOMER) {
        return res.status(403).json({ message: 'Only customers can add orders to tab' });
      }
      if (!customer.creditEnabled) {
        return res.status(400).json({ message: 'Credit not enabled for this customer' });
      }
      const projectedBalance = Number(customer.balance || 0) + finalTotal;
      if (projectedBalance > Number(customer.creditLimit || 0)) {
        return res.status(400).json({ message: 'Credit limit exceeded' });
      }
      usersModel.update(customer.id, { ...customer, balance: projectedBalance, updatedAt: nowIso() });
    }

    const confirmationEmail = customer ? (customer.email || null) : (guestEmail || null);
    const order = {
      id: createId('ord'),
      ref: generateRef(),
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : guestName || 'Guest',
      confirmationEmail,
      items: enrichedItems,
      subtotal: totals.subtotal,
      discount,
      total: finalTotal,
      promo: appliedPromo,
      status: 'new',
      paymentType,
      paymentStatus,
      type,
      routeId,
      stopId,
      scheduledFor: scheduledFor || null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    ordersModel.insert(order);

    // Award loyalty stamp to registered customers
    if (customer && customer.role === ROLES.CUSTOMER) {
      const settings = getSettings();
      const required = Number(settings.loyaltyStampsRequired || 9);
      const currentStamps = Number(customer.stamps || 0);
      const newStamps = currentStamps + 1;
      usersModel.update(customer.id, { ...customer, stamps: newStamps, updatedAt: nowIso() });
      if (newStamps >= required) {
        usersModel.update(customer.id, { stamps: 0, updatedAt: nowIso() });
        await createNotification({
          userId: customer.id,
          type: 'loyalty',
          title: '🎉 Free item earned!',
          message: `You've collected ${required} stamps — enjoy a free item on your next order! Show this to the crew.`,
          email: customer.email
        });
      }
    }

    // Send order confirmation email to any customer who provided one
    if (confirmationEmail) {
      const name = customer ? customer.name : (guestName || 'there');
      const itemList = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      await createNotification({
        userId: customer ? customer.id : null,
        type: 'order-confirm',
        title: `Order confirmed — #${order.ref}`,
        message: `Hi ${name}, your order #${order.ref} has been placed!\n\nItems: ${itemList}\nTotal: £${order.total.toFixed(2)}\n\nShow reference #${order.ref} when collecting. Thanks!`,
        email: confirmationEmail
      });
    }

    await createNotification({
      userId: null,
      type: 'order',
      title: 'New order received',
      message: `${order.customerName} placed a ${order.type} order for £${order.total.toFixed(2)}`
    });

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
}

function listOrders(req, res) {
  let allOrders = ordersModel.all();
  const needsRef = allOrders.filter((o) => !o.ref);
  if (needsRef.length) {
    needsRef.forEach((o) => ordersModel.update(o.id, { ...o, ref: generateRef() }));
    allOrders = ordersModel.all();
  }
  allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.user.role === ROLES.CUSTOMER) {
    return res.json(allOrders.filter((order) => order.customerId === req.user.id));
  }
  return res.json(allOrders);
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!ORDER_STATUS.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = ordersModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const updated = ordersModel.update(order.id, {
      ...order,
      status,
      updatedAt: nowIso()
    });
    if (order.customerId) {
      const customer = usersModel.findById(order.customerId);
      await createNotification({
        userId: order.customerId,
        type: 'order-status',
        title: 'Order updated',
        message: `Your order is now ${status}`,
        email: customer ? customer.email : undefined
      });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  listOrders,
  updateStatus
};
