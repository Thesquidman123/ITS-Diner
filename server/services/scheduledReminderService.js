const ordersModel = require('../../models/ordersModel');
const usersModel = require('../../models/usersModel');
const { createNotification } = require('./notificationService');
const { nowIso } = require('../../shared/utils');

const REMINDER_WINDOW_MS = 10 * 60 * 1000;
const REMINDER_FLAG = 'reminderSent';

async function checkScheduledReminders() {
  const now = Date.now();
  const orders = ordersModel.all().filter(
    (order) =>
      order.scheduledFor &&
      order.status !== 'collected' &&
      order.status !== 'ready' &&
      !order[REMINDER_FLAG]
  );

  for (const order of orders) {
    const scheduledAt = new Date(order.scheduledFor).getTime();
    const diff = scheduledAt - now;
    if (diff > 0 && diff <= REMINDER_WINDOW_MS) {
      const minutesLeft = Math.round(diff / 60000);
      if (order.customerId) {
        const customer = usersModel.findById(order.customerId);
        await createNotification({
          userId: order.customerId,
          type: 'scheduled-reminder',
          title: 'Your order is due soon',
          message: `Order #${order.ref} is scheduled in ~${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Head over soon!`,
          email: customer ? customer.email : undefined
        });
      }
      await createNotification({
        userId: null,
        type: 'scheduled-reminder-staff',
        title: 'Scheduled order due soon',
        message: `Order #${order.ref} for ${order.customerName} is due in ~${minutesLeft} min. Start preparing.`
      });
      ordersModel.update(order.id, { ...order, reminderSent: true, updatedAt: nowIso() });
    }
  }
}

function startScheduledReminderService(intervalMs = 60000) {
  setInterval(checkScheduledReminders, intervalMs);
}

module.exports = { startScheduledReminderService };
