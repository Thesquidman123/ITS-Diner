import { useEffect, useState } from 'react';
import { CreditCard, TrendingDown, TrendingUp } from 'lucide-react';
import api from '../lib/api';

export default function CreditPage({ user }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payForm, setPayForm] = useState({ amount: '' });
  const [adjustForm, setAdjustForm] = useState({ creditLimit: '', balance: '' });
  const [showAdjust, setShowAdjust] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [profileRes, ordersRes] = await Promise.all([
      api.get('/customers/me'),
      api.get('/customers/me/orders')
    ]);
    setProfile(profileRes.data);
    setOrders(ordersRes.data.filter((o) => o.paymentType === 'credit'));
    setAdjustForm({ creditLimit: profileRes.data.creditLimit || 0, balance: profileRes.data.balance || 0 });
  };

  useEffect(() => { if (user) load(); }, [user?.id]);

  if (!user) {
    return (
      <div className="card soft-panel py-12 text-center">
        <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 font-semibold text-slate-600">Sign in to view your tab</p>
      </div>
    );
  }

  if (profile && !profile.creditEnabled) {
    return (
      <div className="space-y-4 fade-in-up">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-700 p-5 text-white shadow-2xl shadow-violet-500/30">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
              💳 Credit Tab
            </span>
            <h2 className="mt-2 text-2xl font-extrabold">Credit Account</h2>
            <p className="mt-1 text-sm text-white/70">Order now, pay later at the van.</p>
          </div>
        </section>
        <div className="card soft-panel py-10 text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-3 font-semibold text-slate-700">Tab not enabled</p>
          <p className="mt-1 text-sm text-slate-500">Ask the owner to set up a credit tab for your account.</p>
        </div>
      </div>
    );
  }

  const balance = Number(profile?.balance || 0);
  const limit = Number(profile?.creditLimit || 0);
  const pct = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
  const paidInFull = balance <= 0;
  const remaining = Math.max(0, limit - balance);

  const handlePayDown = async (e) => {
    e.preventDefault();
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0) return;
    if (user.role === 'customer') {
      await api.post('/customers/me/paydown', { amount });
    } else {
      await api.patch(`/customers/${profile.id}/credit`, {
        creditEnabled: profile.creditEnabled,
        creditLimit: profile.creditLimit,
        balance: Math.max(0, balance - amount)
      });
    }
    setPayForm({ amount: '' });
    setMessage(`Payment of £${amount.toFixed(2)} recorded.`);
    load();
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    await api.patch(`/customers/${profile.id}/credit`, {
      creditEnabled: true,
      creditLimit: Number(adjustForm.creditLimit),
      balance: Number(adjustForm.balance)
    });
    setShowAdjust(false);
    setMessage('Tab updated.');
    load();
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="space-y-4 fade-in-up">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-700 p-5 text-white shadow-2xl shadow-violet-500/30">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
            💳 Credit Tab
          </span>
          <h2 className="mt-2 text-2xl font-extrabold">Your Tab</h2>
          <p className="mt-1 text-sm text-white/70">{profile?.name}</p>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
          ✓ {message}
        </div>
      )}

      <section className="card space-y-4 border border-white/60">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900">Balance summary</h3>
          {paidInFull ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              ✓ Paid in full
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
              £{balance.toFixed(2)} owed
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Owed</p>
            <p className={`mt-1 text-xl font-extrabold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              £{balance.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Limit</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">£{limit.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Available</p>
            <p className="mt-1 text-xl font-extrabold text-violet-700">£{remaining.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500">
            <span>Used</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-violet-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {!paidInFull && (
        <section className="card border border-white/60">
          <h3 className="font-extrabold text-slate-900">Record a payment</h3>
          <p className="mt-0.5 text-sm text-slate-500">Log cash or card payments made at the van.</p>
          <form className="mt-3 flex gap-3" onSubmit={handlePayDown}>
            <input
              className="input flex-1"
              type="number"
              step="0.01"
              min="0.01"
              max={balance}
              placeholder="Amount (£)"
              value={payForm.amount}
              onChange={(e) => setPayForm({ amount: e.target.value })}
              required
            />
            <button className="btn-primary !px-5 whitespace-nowrap">
              <TrendingDown className="mr-1.5 h-4 w-4" />Pay down
            </button>
          </form>
        </section>
      )}

      {user.role === 'owner' && (
        <section className="card border border-white/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900">Owner adjustments</h3>
            <button className="text-sm text-brand-600 underline" onClick={() => setShowAdjust(!showAdjust)}>
              {showAdjust ? 'Cancel' : 'Adjust'}
            </button>
          </div>
          {showAdjust && (
            <form className="space-y-3" onSubmit={handleAdjust}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Credit limit (£)</label>
                  <input className="input mt-1" type="number" step="0.01" value={adjustForm.creditLimit} onChange={(e) => setAdjustForm({ ...adjustForm, creditLimit: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Current balance (£)</label>
                  <input className="input mt-1" type="number" step="0.01" value={adjustForm.balance} onChange={(e) => setAdjustForm({ ...adjustForm, balance: e.target.value })} />
                </div>
              </div>
              <button className="btn-primary w-full">Save adjustments</button>
            </form>
          )}
        </section>
      )}

      <section className="card border border-white/60 space-y-3">
        <h3 className="font-extrabold text-slate-900">Tab history</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">No tab orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order, i) => (
              <div key={order.id} className="stagger-item flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5" style={{ '--delay': `${i * 30}ms` }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">#{order.ref || '—'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${order.status === 'collected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                  <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">£{Number(order.total).toFixed(2)}</p>
                  {order.status === 'collected' ? (
                    <TrendingUp className="ml-auto h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="ml-auto h-3.5 w-3.5 text-amber-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
