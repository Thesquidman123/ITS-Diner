const routesModel = require('../models/routesModel');
const usersModel = require('../models/usersModel');
const areasModel = require('../models/areasModel');
const { createId, nowIso } = require('../shared/utils');
const { routeStopMinutes } = require('../server/config');
const { createNotification } = require('../server/services/notificationService');

function listRoutes(req, res) {
  let routes = routesModel.all();
  if (req.user?.role === 'driver') {
    routes = routes.filter((route) => route.driverId === req.user.id);
  }
  if (!req.user || req.user.role === 'customer') {
    routes = routes.map((route) => ({
      id: route.id,
      name: route.name,
      activeStopId: route.activeStopId,
      activeUntil: route.activeUntil,
      isLive: route.isLive,
      stops: route.stops.map((stop) => ({
        id: stop.id,
        name: stop.name,
        startsAt: stop.startsAt,
        durationMinutes: stop.durationMinutes,
        isActive: stop.isActive
      }))
    }));
  }
  res.json(routes);
}

function createRoute(req, res) {
  const route = {
    id: createId('route'),
    name: req.body.name,
    driverId: req.body.driverId || null,
    activeStopId: null,
    activeUntil: null,
    isLive: false,
    stops: Array.isArray(req.body.stops) ? req.body.stops.map((stop) => ({
      id: stop.id || createId('stop'),
      name: stop.name,
      startsAt: stop.startsAt || '',
      durationMinutes: Number(stop.durationMinutes || routeStopMinutes),
      isActive: false
    })) : [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  routesModel.insert(route);
  res.status(201).json(route);
}

async function arriveAtStop(req, res, next) {
  try {
    const route = routesModel.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    const stop = route.stops.find((entry) => entry.id === req.body.stopId);
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    const durationMinutes = Number(stop.durationMinutes || routeStopMinutes);
    const activeUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const updated = routesModel.update(route.id, {
      ...route,
      activeStopId: stop.id,
      activeUntil,
      isLive: true,
      stops: route.stops.map((entry) => ({ ...entry, isActive: entry.id === stop.id })),
      updatedAt: nowIso()
    });

    const allCustomers = usersModel.all().filter((user) => user.role === 'customer');
    let targetCustomers = allCustomers;
    if (stop.areaId) {
      const area = areasModel.findById(stop.areaId);
      if (area && area.customerIds && area.customerIds.length > 0) {
        const areaSet = new Set(area.customerIds);
        const subscribers = allCustomers.filter(
          (c) => areaSet.has(c.id) || (c.subscribedAreas || []).includes(stop.areaId)
        );
        if (subscribers.length > 0) targetCustomers = subscribers;
      }
    }
    await Promise.all(targetCustomers.map((customer) => createNotification({
      userId: customer.id,
      type: 'route-live',
      title: 'Van has arrived nearby',
      message: `The van is now at ${stop.name}. Route ordering is open for ${durationMinutes} minutes.`,
      email: customer.email
    })));

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

function clearActiveStop(req, res) {
  const route = routesModel.findById(req.params.id);
  if (!route) {
    return res.status(404).json({ message: 'Route not found' });
  }
  const updated = routesModel.update(route.id, {
    ...route,
    activeStopId: null,
    activeUntil: null,
    isLive: false,
    stops: route.stops.map((stop) => ({ ...stop, isActive: false })),
    updatedAt: nowIso()
  });
  return res.json(updated);
}

module.exports = {
  listRoutes,
  createRoute,
  arriveAtStop,
  clearActiveStop
};
