import { useEffect, useState } from 'react';
import { Bell, ChefHat, Clock, MapPin, Truck } from 'lucide-react';
import api from '../lib/api';

const STATUS_FLOW = ['new', 'preparing', 'ready', 'collected'];
const STATUS_COLOURS = {
  new: 'bg-blue-100 text-blue-700 ring-blue-200',
  preparing: 'bg-amber-100 text-amber-700 ring-amber-200',
  ready: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  collected: 'bg-slate-100 text-slate-500 ring-slate-200'
};

function KitchenBoard() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('live');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api.get('/orders');
    setOrders(res.data);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    setBusy(true);
    await api.patch(`/orders/${orderId}/status`, { status });
    await load();
    setBusy(false);
  };

  const now = new Date();
  const liveOrders = orders.filter(
    (o) => !o.scheduledFor && o.status !== 'collected'
  );
  const scheduledOrders = orders.filter(
    (o) => o.scheduledFor && o.status !== 'collected'
  ).sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const collectedOrders = orders.filter((o) => o.status === 'collected');

  const displayed = tab === 'live' ? liveOrders : tab === 'scheduled' ? scheduledOrders : collectedOrders;

  function formatScheduled(iso) {
    const d = new Date(iso);
    const diff = Math.round((d - now) / 60000);
    if (diff < 0) return `Overdue ${Math.abs(diff)}m`;
    if (diff === 0) return 'Due now';
    return `Due in ${diff}m (${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ChefHat className="h-5 w-5 text-brand-600" />
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Kitchen Board</h2>
        <span className="ml-auto rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
          Auto-refresh 15s
        </span>
      </div>

      <div className="flex gap-1 rounded-2xl bg-slate-100/80 p-1">
        {[
          { key: 'live', label: `Live (${liveOrders.length})` },
          { key: 'scheduled', label: `Scheduled (${scheduledOrders.length})` },
          { key: 'done', label: `Collected (${collectedOrders.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${
              tab === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="card soft-panel py-10 text-center">
          <p className="text-2xl">{tab === 'scheduled' ? '🗓️' : '✅'}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {tab === 'live' ? 'No active orders' : tab === 'scheduled' ? 'No scheduled orders' : 'Nothing collected yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((order, index) => (
            <div
              key={order.id}
              className={`card stagger-item space-y-3 border ${
                order.scheduledFor && new Date(order.scheduledFor) < now
                  ? 'border-red-200 !bg-red-50/50'
                  : 'border-white/60'
              }`}
              style={{ '--delay': `${index * 40}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                      #{order.ref || '???'}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STATUS_COLOURS[order.status]}`}>
                      {order.status}
                    </span>
                    {order.paymentType === 'credit' && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200">
                        TAB
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1.5 font-bold text-slate-900">{order.customerName}</h4>
                  <p className="text-sm text-slate-500">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                  </p>
                  {order.scheduledFor && (
                    <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${
                      new Date(order.scheduledFor) < now ? 'text-red-600' : 'text-amber-700'
                    }`}>
                      <Clock className="h-3.5 w-3.5" />
                      {formatScheduled(order.scheduledFor)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900">£{Number(order.total).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 capitalize">{order.type}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.filter((s) => s !== 'collected').map((status) => (
                  <button
                    key={status}
                    disabled={busy || order.status === status}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      order.status === status
                        ? 'cursor-default bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    onClick={() => updateStatus(order.id, status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
                <button
                  disabled={busy}
                  className="ml-auto rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  onClick={() => updateStatus(order.id, 'collected')}
                >
                  ✓ Collected
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickMenu() {
  const [menu, setMenu] = useState([]);
  const load = async () => { const res = await api.get('/menu'); setMenu(res.data); };
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    await api.patch(`/menu/${id}/toggle`);
    load();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold text-slate-900">Quick sold-out toggle</h3>
      <p className="text-xs text-slate-500">Tap an item to mark it sold out or back in stock instantly.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
              item.available
                ? 'border-white/60 bg-white text-slate-800 hover:border-slate-200 hover:bg-slate-50'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <span className="truncate">{item.name}</span>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {item.available ? 'Available' : 'Sold out'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DriverRoutes() {
  const [routes, setRoutes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [routesRes, areasRes] = await Promise.all([
      api.get('/routes'),
      api.get('/areas')
    ]);
    setRoutes(routesRes.data);
    setAreas(areasRes.data);
  };

  useEffect(() => { load(); }, []);

  const arrive = async (routeId, stopId) => {
    setBusy(true);
    await api.patch(`/routes/${routeId}/arrive`, { stopId });
    await load();
    setBusy(false);
  };

  const clearStop = async (routeId) => {
    setBusy(true);
    await api.patch(`/routes/${routeId}/clear`);
    await load();
    setBusy(false);
  };

  function getAreaName(areaId) {
    const area = areas.find((a) => a.id === areaId);
    return area ? area.name : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Truck className="h-5 w-5 text-brand-600" />
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">My Routes</h2>
      </div>

      {routes.length === 0 ? (
        <div className="card soft-panel py-10 text-center">
          <p className="text-2xl">🚐</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">No routes assigned yet. Ask the owner to create a route.</p>
        </div>
      ) : (
        routes.map((route) => (
          <section key={route.id} className="card space-y-4 border border-white/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">Assigned route</p>
                <h3 className="text-lg font-extrabold text-slate-900">{route.name}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${
                route.isLive
                  ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                  : 'bg-slate-100 text-slate-500 ring-slate-200'
              }`}>
                {route.isLive ? '🟢 Live' : 'Offline'}
              </span>
            </div>

            <div className="space-y-2.5">
              {route.stops.map((stop, i) => (
                <div
                  key={stop.id}
                  className={`stagger-item flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${
                    stop.isActive
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50/80'
                  }`}
                  style={{ '--delay': `${i * 40}ms` }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <p className="font-semibold text-slate-900">{stop.name}</p>
                      {stop.areaId && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                          {getAreaName(stop.areaId) || 'Area'}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {stop.startsAt ? `Window: ${stop.startsAt}` : 'Flexible timing'} · {stop.durationMinutes} mins
                    </p>
                  </div>
                  {!stop.isActive && (
                    <button
                      disabled={busy}
                      className="btn-primary !py-1.5 !text-sm"
                      onClick={() => arrive(route.id, stop.id)}
                    >
                      I'm here
                    </button>
                  )}
                  {stop.isActive && (
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                      ✓ Active
                    </span>
                  )}
                </div>
              ))}
            </div>

            {route.isLive && (
              <button
                disabled={busy}
                className="btn-secondary w-full"
                onClick={() => clearStop(route.id)}
              >
                End live stop
              </button>
            )}
          </section>
        ))
      )}
    </div>
  );
}

export default function VanPage({ user }) {
  const [tab, setTab] = useState(user?.role === 'driver' ? 'routes' : 'kitchen');

  if (!user || (user.role !== 'staff' && user.role !== 'driver')) {
    return (
      <div className="card">
        <p className="text-sm text-slate-500">Van operations are available to staff and driver roles only.</p>
      </div>
    );
  }

  const tabs = [];
  if (user.role === 'staff' || user.role === 'owner') {
    tabs.push({ key: 'kitchen', label: 'Kitchen', icon: ChefHat });
    tabs.push({ key: 'menu', label: 'Menu', icon: Bell });
  }
  if (user.role === 'driver') {
    tabs.push({ key: 'routes', label: 'Routes', icon: Truck });
    tabs.push({ key: 'alerts', label: 'Alerts', icon: Bell });
  }

  return (
    <div className="space-y-4 fade-in-up">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-5 text-white shadow-2xl">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
            {user.role === 'driver' ? '🚐 Driver' : '👨‍🍳 Kitchen'}
          </span>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight">Van Operations</h2>
          <p className="mt-1 text-sm text-white/70">
            {user.role === 'driver' ? 'Manage your route stops and customer alerts.' : 'Manage incoming and scheduled orders.'}
          </p>
        </div>
      </section>

      {tabs.length > 1 && (
        <div className="flex gap-1 rounded-2xl bg-slate-100/80 p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${
                tab === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setTab(key)}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      )}

      {tab === 'kitchen' && <KitchenBoard />}
      {tab === 'menu' && <QuickMenu />}
      {tab === 'routes' && <DriverRoutes />}
      {tab === 'alerts' && (
        <div className="card soft-panel py-10 text-center">
          <p className="text-2xl"><Bell className="mx-auto h-8 w-8 text-slate-300" /></p>
          <p className="mt-2 text-sm font-semibold text-slate-500">Alerts are sent automatically when you mark a stop as arrived.</p>
        </div>
      )}
    </div>
  );
}
