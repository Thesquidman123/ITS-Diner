import { useEffect, useState } from 'react';
import { Bell, CreditCard, MapPin, ShoppingBag, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import api from '../lib/api';

const STATUS_COLOURS = {
  new: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-emerald-100 text-emerald-700',
  collected: 'bg-slate-100 text-slate-500'
};

export default function AccountPage({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stampsRequired, setStampsRequired] = useState(9);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetches = [
      api.get('/customers/me').catch(() => ({ data: user })),
      api.get('/notifications').catch(() => ({ data: [] }))
    ];
    if (user.role === 'customer') {
      fetches.push(api.get('/customers/me/orders').catch(() => ({ data: [] })));
      fetches.push(api.get('/areas').catch(() => ({ data: [] })));
      fetches.push(api.get('/settings').catch(() => ({ data: {} })));
    }
    Promise.all(fetches).then(([profileRes, notificationsRes, ordersRes, areasRes, settingsRes]) => {
      setProfile(profileRes.data);
      setNotifications(notificationsRes.data || []);
      if (ordersRes) setOrders(ordersRes.data || []);
      if (areasRes) setAreas(areasRes.data || []);
      if (settingsRes) setStampsRequired(Number(settingsRes.data?.loyaltyStampsRequired || 9));
    });
  }, [user?.id]);

  const toggleAreaSubscription = async (areaId) => {
    const res = await api.post(`/areas/${areaId}/subscribe`);
    setProfile(res.data);
  };

  const exportData = async () => {
    const res = await api.get('/customers/me/export');
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `its-diner-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/customers/me');
      logout();
      navigate('/');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="card soft-panel py-12 text-center fade-in-up">
        <User className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 font-semibold text-slate-600">Sign in to view your account</p>
        <Link to="/auth" className="btn-primary mx-auto mt-4 inline-flex">Sign in</Link>
      </div>
    );
  }

  const isCustomer = user.role === 'customer';

  return (
    <div className="space-y-4 fade-in-up">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-5 text-white shadow-2xl">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-lg font-extrabold leading-tight">{profile?.name}</p>
            <p className="text-sm text-white/60">{profile?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide">
              {profile?.role}
            </span>
          </div>
        </div>
      </section>

      {isCustomer && profile?.creditEnabled && (
        <Link to="/credit" className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 ring-1 ring-violet-200 transition hover:ring-violet-400">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-violet-600" />
            <div>
              <p className="font-bold text-slate-900">Credit tab</p>
              <p className="text-sm text-slate-500">
                £{Number(profile.balance || 0).toFixed(2)} owed of £{Number(profile.creditLimit || 0).toFixed(2)} limit
              </p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${Number(profile.balance) <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {Number(profile.balance) <= 0 ? 'Paid in full' : 'Balance owed'}
          </span>
        </Link>
      )}

      {isCustomer && (
        <section className="card border border-white/60 space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-amber-500" />
            <h3 className="font-extrabold text-slate-900">Loyalty stamps</h3>
          </div>
          <p className="text-sm text-slate-500">
            Collect a stamp with every order. Get {stampsRequired} stamps and earn a free item!
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: stampsRequired }).map((_, i) => {
              const filled = i < (profile?.stamps || 0);
              return (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base transition-all ${
                    filled
                      ? 'border-amber-400 bg-amber-400 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-300'
                  }`}
                >
                  {filled ? '☕' : ''}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            {profile?.stamps || 0} of {stampsRequired} stamps collected
            {(profile?.stamps || 0) >= stampsRequired && ' — 🎉 Reward ready! Show staff.'}
          </p>
        </section>
      )}

      {isCustomer && (
        <section className="card border border-white/60 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" />
            <h3 className="font-extrabold text-slate-900">Area alerts</h3>
          </div>
          <p className="text-sm text-slate-500">Subscribe to areas to get a notification when the van arrives nearby.</p>
          {areas.length === 0 ? (
            <p className="text-sm text-slate-400">No areas set up yet — ask the owner or driver.</p>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => {
                const subscribed = (profile?.subscribedAreas || []).includes(area.id);
                return (
                  <div key={area.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-slate-800">{area.name}</p>
                      {area.description && <p className="text-xs text-slate-500">{area.description}</p>}
                    </div>
                    <button
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${subscribed ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      onClick={() => toggleAreaSubscription(area.id)}
                    >
                      {subscribed ? '✓ Subscribed' : 'Subscribe'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {isCustomer && (
        <section className="card border border-white/60 space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-brand-600" />
            <h3 className="font-extrabold text-slate-900">Order history</h3>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 20).map((order, i) => (
                <div key={order.id} className="stagger-item rounded-2xl border border-slate-200 bg-slate-50/80 p-3" style={{ '--delay': `${i * 30}ms` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">#{order.ref || '—'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOURS[order.status]}`}>{order.status}</span>
                        {order.scheduledFor && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            🕐 {new Date(order.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                      <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold text-slate-900">£{Number(order.total).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="card border border-white/60 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-brand-600" />
          <h3 className="font-extrabold text-slate-900">Notifications</h3>
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 20).map((n, i) => (
              <div key={n.id} className="stagger-item rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm" style={{ '--delay': `${i * 25}ms` }}>
                <p className="font-semibold text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-slate-500">{n.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card border border-white/60 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          <h3 className="font-extrabold text-slate-900">Your data &amp; privacy</h3>
        </div>
        <p className="text-sm text-slate-500">
          Under GDPR you have the right to access, download, and delete your personal data at any time.{' '}
          <Link to="/privacy" className="underline hover:text-slate-700">Read our privacy policy</Link>.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={exportData}
          >
            ⬇ Download my data
          </button>
          {!deleteConfirm ? (
            <button
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              onClick={() => setDeleteConfirm(true)}
            >
              Delete my account
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-red-50 p-4 ring-1 ring-red-200 space-y-3">
              <p className="text-sm font-semibold text-red-700">⚠ This will permanently delete your account and anonymise your orders. This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-60"
                  onClick={deleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete everything'}
                </button>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
