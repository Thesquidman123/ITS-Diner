import { useEffect, useState } from 'react';
import api from '../lib/api';

function OwnerDashboard() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Burgers', options: '[]', available: true, image: null });

  const load = async () => {
    const [menuRes, ordersRes, customersRes, routesRes] = await Promise.all([
      api.get('/menu'),
      api.get('/orders'),
      api.get('/customers'),
      api.get('/routes')
    ]);
    setMenu(menuRes.data);
    setOrders(ordersRes.data);
    setCustomers(customersRes.data);
    setRoutes(routesRes.data);
  };

  useEffect(() => { load(); }, []);

  const submitItem = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'image' && value) {
        data.append('image', value);
      } else if (key !== 'image') {
        data.append(key, value);
      }
    });
    await api.post('/menu', data);
    setForm({ name: '', description: '', price: '', category: 'Burgers', options: '[]', available: true, image: null });
    load();
  };

  const updateCredit = async (customer) => {
    await api.patch(`/customers/${customer.id}/credit`, {
      creditEnabled: !customer.creditEnabled,
      creditLimit: customer.creditLimit || 25,
      balance: customer.balance || 0
    });
    load();
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card border border-white/70 !bg-gradient-to-br !from-yellow-50 !to-white"><p className="text-sm text-slate-500">Menu items</p><h3 className="mt-2 text-2xl font-extrabold tracking-tight">{menu.length}</h3></div>
        <div className="card border border-white/70 !bg-gradient-to-br !from-yellow-50 !to-white"><p className="text-sm text-slate-500">Orders</p><h3 className="mt-2 text-2xl font-extrabold tracking-tight">{orders.length}</h3></div>
        <div className="card border border-white/70 !bg-gradient-to-br !from-yellow-50 !to-white"><p className="text-sm text-slate-500">Customers</p><h3 className="mt-2 text-2xl font-extrabold tracking-tight">{customers.length}</h3></div>
        <div className="card border border-white/70 !bg-gradient-to-br !from-yellow-50 !to-white"><p className="text-sm text-slate-500">Routes</p><h3 className="mt-2 text-2xl font-extrabold tracking-tight">{routes.length}</h3></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <form className="card space-y-3 border border-white/70" onSubmit={submitItem}>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600">Menu</p>
            <h3 className="section-title">Add item in under 30 seconds</h3>
          </div>
          <input className="input" placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <textarea className="input min-h-24" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Price" type="number" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            <select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>Burgers</option>
              <option>Sandwiches</option>
              <option>Sides</option>
              <option>Drinks</option>
            </select>
          </div>
          <textarea className="input min-h-24" placeholder='Options JSON, e.g. [{"name":"Cheese","price":1}]' value={form.options} onChange={(event) => setForm({ ...form, options: event.target.value })} />
          <input className="input" type="file" accept="image/*" capture="environment" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} />
          <button className="btn-primary w-full">Save menu item</button>
        </form>

        <div className="space-y-4">
          <section className="card border border-white/70">
            <h3 className="section-title text-lg">Recent orders</h3>
            <div className="mt-3 space-y-2">
              {orders.length === 0 ? <p className="text-sm text-slate-500">No orders yet. New orders will appear here automatically.</p> : orders.slice(0, 6).map((order, index) => (
                <div key={order.id} className="stagger-item rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm" style={{ '--delay': `${index * 40}ms` }}>
                  <div className="flex justify-between"><span>{order.customerName}</span><strong>£{Number(order.total).toFixed(2)}</strong></div>
                  <p className="mt-1 text-slate-500"><span className="chip !bg-yellow-100 !text-brand-700 !border-yellow-200">{order.status}</span> · {order.paymentType}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="card border border-white/70">
            <h3 className="section-title text-lg">Customer credit</h3>
            <div className="mt-3 space-y-2">
              {customers.length === 0 ? <p className="text-sm text-slate-500">No customers found yet.</p> : customers.map((customer, index) => (
                <div key={customer.id} className="stagger-item rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm" style={{ '--delay': `${index * 40}ms` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-slate-500">£{Number(customer.balance || 0).toFixed(2)} / £{Number(customer.creditLimit || 0).toFixed(2)}</p>
                    </div>
                    <button className="btn-secondary" onClick={() => updateCredit(customer)}>{customer.creditEnabled ? 'Disable' : 'Enable'} tab</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const load = async () => {
    const response = await api.get('/orders');
    setOrders(response.data);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    load();
  };

  return (
    <div className="space-y-5">
      <section className="card border border-white/70">
        <h3 className="section-title">Kitchen board</h3>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? <p className="text-sm text-slate-500">No active tickets. You are all caught up.</p> : orders.map((order, index) => (
            <div key={order.id} className="stagger-item rounded-3xl border border-slate-200 bg-white/80 p-4" style={{ '--delay': `${index * 45}ms` }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-900">{order.customerName}</h4>
                  <p className="text-sm text-slate-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</p>
                </div>
                <strong className="text-lg">£{Number(order.total).toFixed(2)}</strong>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['new', 'preparing', 'ready', 'collected'].map((status) => (
                  <button key={status} className={`rounded-2xl px-3 py-2 text-sm font-semibold ${order.status === status ? 'bg-yellow-100 text-brand-700 ring-1 ring-yellow-200' : 'bg-slate-100 text-slate-600'}`} onClick={() => updateStatus(order.id, status)}>{status}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DriverDashboard() {
  const [routes, setRoutes] = useState([]);
  const load = async () => {
    const response = await api.get('/routes');
    setRoutes(response.data);
  };
  useEffect(() => { load(); }, []);

  const arrive = async (routeId, stopId) => {
    await api.patch(`/routes/${routeId}/arrive`, { stopId });
    load();
  };

  const clear = async (routeId) => {
    await api.patch(`/routes/${routeId}/clear`);
    load();
  };

  return (
    <div className="space-y-5">
      {routes.length === 0 ? <section className="card border border-white/70"><p className="text-sm text-slate-500">No routes assigned yet. Ask owner to create a route.</p></section> : routes.map((route) => (
        <section key={route.id} className="card border border-white/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-600">Assigned route</p>
              <h3 className="section-title">{route.name}</h3>
            </div>
            <div className={`rounded-full px-3 py-1 text-sm font-semibold ${route.isLive ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500'}`}>{route.isLive ? 'Live' : 'Offline'}</div>
          </div>
          <div className="mt-4 space-y-3">
            {route.stops.map((stop, index) => (
              <div key={stop.id} className="stagger-item flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3" style={{ '--delay': `${index * 45}ms` }}>
                <div>
                  <p className="font-medium">{stop.name}</p>
                  <p className="text-sm text-slate-500">Window: {stop.startsAt || 'Flexible'} · {stop.durationMinutes} mins</p>
                </div>
                <button className="btn-primary" onClick={() => arrive(route.id, stop.id)}>ARRIVED</button>
              </div>
            ))}
          </div>
          <button className="btn-secondary mt-4 w-full" onClick={() => clear(route.id)}>End live stop</button>
        </section>
      ))}
    </div>
  );
}

function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    Promise.all([api.get('/customers/me/orders'), api.get('/notifications')]).then(([ordersRes, notificationsRes]) => {
      setOrders(ordersRes.data);
      setNotifications(notificationsRes.data);
    });
  }, []);

  return (
    <div className="space-y-5">
      <section className="card border border-white/70">
        <h3 className="section-title text-lg">Recent orders</h3>
        <div className="mt-3 space-y-2">
          {orders.length === 0 ? <p className="text-sm text-slate-500">You have no orders yet. Place one from the Order tab.</p> : orders.map((order, index) => (
            <div key={order.id} className="stagger-item rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm" style={{ '--delay': `${index * 35}ms` }}>
              <div className="flex justify-between"><span className="chip !bg-yellow-100 !text-brand-700 !border-yellow-200">{order.status}</span><strong>£{Number(order.total).toFixed(2)}</strong></div>
              <p className="mt-1 text-slate-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="card border border-white/70">
        <h3 className="section-title text-lg">Notifications</h3>
        <div className="mt-3 space-y-2">
          {notifications.length === 0 ? <p className="text-sm text-slate-500">No notifications right now.</p> : notifications.map((notification, index) => (
            <div key={notification.id} className="stagger-item rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm" style={{ '--delay': `${index * 35}ms` }}>
              <p className="font-medium">{notification.title}</p>
              <p className="text-slate-500">{notification.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage({ user, scope }) {
  if (!user) {
    return <div className="card"><p className="text-sm text-slate-500">Sign in to access your dashboard.</p></div>;
  }

  if (scope === 'owner') {
    return user.role === 'owner' ? <OwnerDashboard /> : <div className="card"><p className="text-sm text-slate-500">Owner dashboard access is restricted.</p></div>;
  }

  if (scope === 'van') {
    if (user.role === 'driver') return <DriverDashboard />;
    if (user.role === 'staff') return <StaffDashboard />;
    return <div className="card"><p className="text-sm text-slate-500">Van operations are available to staff and driver roles.</p></div>;
  }

  if (user.role === 'owner') return <OwnerDashboard />;
  if (user.role === 'staff') return <StaffDashboard />;
  if (user.role === 'driver') return <DriverDashboard />;
  return <CustomerDashboard />;
}
