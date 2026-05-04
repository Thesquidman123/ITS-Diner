import { useEffect, useRef, useState } from 'react';
import { List, MapPin, Plus, Printer, Settings, Tag, Trash2, TrendingUp, Users, Utensils, X, ZapIcon } from 'lucide-react';
import api from '../lib/api';

const STATUS_COLOURS = {
  new: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-emerald-100 text-emerald-700',
  collected: 'bg-slate-100 text-slate-500'
};

const BLANK_FORM = { name: '', description: '', price: '', category: 'Burgers', available: true, image: null };

function MenuTab() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [extras, setExtras] = useState([]);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const fileRef = useRef();

  const load = async () => {
    try {
      const res = await api.get('/menu');
      setMenu(res.data);
    } catch {
      /* silent */
    }
  };
  useEffect(() => { load(); }, []);

  const handleImage = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, image: file }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const addExtra = () => setExtras((ex) => [...ex, { name: '', price: '' }]);
  const removeExtra = (idx) => setExtras((ex) => ex.filter((_, i) => i !== idx));
  const updateExtra = (idx, field, val) => setExtras((ex) => ex.map((e, i) => i === idx ? { ...e, [field]: val } : e));

  const resetForm = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setExtras([]);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('category', form.category);
      data.append('available', String(form.available));
      data.append('options', JSON.stringify(
        extras.filter((ex) => ex.name.trim()).map((ex) => ({ name: ex.name.trim(), price: Number(ex.price) || 0 }))
      ));
      if (form.image) data.append('image', form.image);

      if (editing) {
        await api.put(`/menu/${editing}`, data);
        setFormSuccess('Item updated!');
      } else {
        await api.post('/menu', data);
        setFormSuccess('Item added to menu!');
      }
      resetForm();
      load();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save item. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({ name: item.name, description: item.description || '', price: String(item.price), category: item.category, available: item.available, image: null });
    setExtras((item.options || []).map((o) => ({ name: o.name, price: String(o.price || 0) })));
    setPreview(item.imageUrl ? `http://localhost:5000${item.imageUrl}` : null);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAvail = async (id) => {
    await api.patch(`/menu/${id}/toggle`);
    load();
  };

  return (
    <div className="space-y-5">
      <form className="card space-y-4 border border-white/70" onSubmit={submit}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
            {editing ? 'Editing item' : 'Add new item'}
          </p>
          <h3 className="text-lg font-extrabold text-slate-900">{editing ? 'Update menu item' : 'Add in under 30 seconds'}</h3>
        </div>

        {formError && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
            ⚠ {formError}
          </div>
        )}
        {formSuccess && (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            ✓ {formSuccess}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input sm:col-span-2" placeholder="Item name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="input min-h-16 sm:col-span-2" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input" placeholder="Base price (£) *" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['Burgers', 'Sandwiches', 'Sides', 'Drinks', 'Desserts', 'Other'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Extras / add-ons <span className="ml-1 font-normal text-slate-400">(e.g. Cheese, Bacon)</span></p>
            <button type="button" className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition" onClick={addExtra}>
              <Plus className="h-3.5 w-3.5" /> Add extra
            </button>
          </div>
          {extras.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-400">No extras yet — click "Add extra" to let customers customise this item.</p>
          )}
          <div className="space-y-2">
            {extras.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="Extra name (e.g. Cheese)"
                  value={ex.name}
                  onChange={(e) => updateExtra(idx, 'name', e.target.value)}
                />
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                  <input
                    className="input pl-7"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={ex.price}
                    onChange={(e) => updateExtra(idx, 'price', e.target.value)}
                  />
                </div>
                <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition" onClick={() => removeExtra(idx)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            📷 {preview ? 'Change photo' : 'Add photo'}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
          </label>
          {preview && <img src={preview} alt="" className="h-14 w-14 rounded-xl object-cover shadow" />}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="avail" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="h-4 w-4 accent-yellow-400" />
          <label htmlFor="avail" className="text-sm font-medium text-slate-700">Available on menu</label>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}</button>
          {editing && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {menu.map((item) => (
          <div key={item.id} className={`card overflow-hidden !p-0 border ${item.available ? 'border-white/60' : 'border-slate-200 opacity-60'}`}>
            <div className="relative aspect-video bg-slate-100">
              {item.imageUrl
                ? <img src={`http://localhost:5000${item.imageUrl}`} alt={item.name} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center text-3xl">🍔</div>
              }
              {!item.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">Hidden</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-slate-900">{item.name}</h4>
                <span className="font-extrabold text-slate-900">£{Number(item.price).toFixed(2)}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.category}{item.description ? ` · ${item.description}` : ''}</p>
              {item.options?.length > 0 && (
                <p className="mt-0.5 text-xs text-slate-400">{item.options.map((o) => o.name).join(', ')}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary flex-1 !py-1.5 !text-xs" onClick={() => startEdit(item)}>Edit</button>
                <button className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${item.available ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`} onClick={() => toggleAvail(item.id)}>
                  {item.available ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = async () => { const res = await api.get('/orders'); setOrders(res.data); };
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  };

  const filtered = filter === 'all' ? orders : filter === 'scheduled' ? orders.filter((o) => o.scheduledFor) : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', 'new', 'preparing', 'ready', 'scheduled', 'collected'].map((f) => (
          <button key={f} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button className="ml-auto rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200" onClick={load}>↻ Refresh</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card soft-panel py-8 text-center text-sm text-slate-500">No orders in this view.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <div key={order.id} className="card stagger-item border border-white/60" style={{ '--delay': `${i * 30}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-slate-900 px-3 py-1 font-mono text-base font-black tracking-widest text-white">#{order.ref || '—'}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLOURS[order.status]}`}>{order.status}</span>
                    {order.scheduledFor && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">🕐 {new Date(order.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    {order.paymentType === 'credit' && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">TAB</span>}
                  </div>
                  <h4 className="mt-1.5 font-bold text-slate-900">{order.customerName}</h4>
                  <p className="text-sm text-slate-500">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}</p>
                  {order.promo && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono font-bold">{order.promo.code}</span>
                      <span>-£{Number(order.discount).toFixed(2)} off</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">£{Number(order.total).toFixed(2)}</p>
                  {order.promo && <p className="text-xs text-slate-400 line-through">£{Number(order.total + order.discount).toFixed(2)}</p>}
                  <p className="text-xs capitalize text-slate-400">{order.paymentType} · {order.type}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button
                  className="ml-auto rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition print:hidden"
                  onClick={() => {
                    const win = window.open('', '_blank');
                    const items = order.items.map((i) => `<tr><td>${i.quantity}×</td><td>${i.name}</td><td style="text-align:right">£${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('');
                    win.document.write(`<html><head><title>#${order.ref}</title><style>body{font-family:monospace;padding:16px;max-width:280px}h2{margin:0}table{width:100%}td{padding:2px 0}hr{border:1px dashed #000}</style></head><body><h2>#${order.ref}</h2><p>${order.customerName}<br/>${new Date(order.createdAt).toLocaleString()}</p><hr/><table>${items}</table><hr/><p style="text-align:right"><strong>TOTAL £${Number(order.total).toFixed(2)}</strong>${order.promo ? '<br/>Code: ' + order.promo.code : ''}</p><script>window.print();window.close();<\/script></body></html>`);
                    win.document.close();
                  }}
                >
                  <Printer className="inline h-3 w-3 mr-1" />Print
                </button>
                {['new', 'preparing', 'ready', 'collected'].map((s) => (
                  <button key={s} className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${order.status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => updateStatus(order.id, s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ creditEnabled: false, creditLimit: 25, balance: 0 });

  const load = async () => { const res = await api.get('/customers'); setCustomers(res.data); };
  useEffect(() => { load(); }, []);

  const saveCredit = async (id) => {
    await api.patch(`/customers/${id}/credit`, form);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-3">
      {customers.length === 0 ? (
        <div className="card soft-panel py-8 text-center text-sm text-slate-500">No customers yet.</div>
      ) : customers.map((c, i) => (
        <div key={c.id} className="card stagger-item border border-white/60 space-y-3" style={{ '--delay': `${i * 30}ms` }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900">{c.name}</h4>
              <p className="text-sm text-slate-500">{c.email}</p>
            </div>
            <div className="text-right">
              {c.creditEnabled ? (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200">Tab enabled</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">No tab</span>
              )}
            </div>
          </div>

          {c.creditEnabled && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Balance</span>
                <span className={Number(c.balance) >= Number(c.creditLimit) ? 'text-red-600' : 'text-slate-700'}>
                  £{Number(c.balance).toFixed(2)} / £{Number(c.creditLimit).toFixed(2)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${Number(c.balance) >= Number(c.creditLimit) ? 'bg-red-500' : 'bg-violet-500'}`}
                  style={{ width: `${Math.min(100, (Number(c.balance) / Number(c.creditLimit)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {editing === c.id ? (
            <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`ce-${c.id}`} checked={form.creditEnabled} onChange={(e) => setForm({ ...form, creditEnabled: e.target.checked })} className="h-4 w-4 accent-violet-500" />
                <label htmlFor={`ce-${c.id}`} className="text-sm font-medium">Tab enabled</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Limit (£)</label>
                  <input className="input mt-1" type="number" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Current balance (£)</label>
                  <input className="input mt-1" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 !py-1.5 !text-sm" onClick={() => saveCredit(c.id)}>Save</button>
                <button className="btn-secondary !py-1.5 !text-sm" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn-secondary w-full !py-1.5 !text-sm" onClick={() => { setEditing(c.id); setForm({ creditEnabled: c.creditEnabled || false, creditLimit: c.creditLimit || 25, balance: c.balance || 0 }); }}>
              Manage tab
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function RoutesTab() {
  const [routes, setRoutes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', driverId: '', stops: [{ name: '', startsAt: '', durationMinutes: 20, areaId: '' }] });

  const load = async () => {
    const [rRes, aRes, cRes] = await Promise.all([api.get('/routes'), api.get('/areas'), api.get('/customers')]);
    setRoutes(rRes.data);
    setAreas(aRes.data);
    const allUsers = await api.get('/customers');
    const driverList = [];
    setDrivers(driverList);
  };

  useEffect(() => { load(); }, []);

  const addStop = () => setForm({ ...form, stops: [...form.stops, { name: '', startsAt: '', durationMinutes: 20, areaId: '' }] });

  const updateStop = (idx, field, val) => {
    const stops = form.stops.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    setForm({ ...form, stops });
  };

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/routes', form);
    setShowForm(false);
    setForm({ name: '', driverId: '', stops: [{ name: '', startsAt: '', durationMinutes: 20, areaId: '' }] });
    load();
  };

  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ New route'}
      </button>

      {showForm && (
        <form className="card space-y-3 border border-white/70" onSubmit={submit}>
          <h3 className="font-bold text-slate-900">Create route</h3>
          <input className="input" placeholder="Route name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Stops</p>
            {form.stops.map((stop, idx) => (
              <div key={idx} className="mb-2 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
                <input className="input sm:col-span-2" placeholder={`Stop ${idx + 1} name *`} required value={stop.name} onChange={(e) => updateStop(idx, 'name', e.target.value)} />
                <input className="input" placeholder="Time (e.g. 12:00)" value={stop.startsAt} onChange={(e) => updateStop(idx, 'startsAt', e.target.value)} />
                <input className="input" placeholder="Duration (mins)" type="number" value={stop.durationMinutes} onChange={(e) => updateStop(idx, 'durationMinutes', Number(e.target.value))} />
                <select className="input sm:col-span-2" value={stop.areaId} onChange={(e) => updateStop(idx, 'areaId', e.target.value)}>
                  <option value="">No area (notify all customers)</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            ))}
            <button type="button" className="text-sm text-brand-600 underline" onClick={addStop}>+ Add stop</button>
          </div>
          <button className="btn-primary w-full">Create route</button>
        </form>
      )}

      {routes.length === 0 ? (
        <div className="card soft-panel py-8 text-center text-sm text-slate-500">No routes yet.</div>
      ) : routes.map((route, i) => (
        <div key={route.id} className="card stagger-item border border-white/60" style={{ '--delay': `${i * 30}ms` }}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900">{route.name}</h4>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${route.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {route.isLive ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {route.stops.map((stop) => {
              const areaName = areas.find((a) => a.id === stop.areaId)?.name;
              return (
                <div key={stop.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{stop.name}</span>
                  {stop.startsAt && <span className="text-slate-400">· {stop.startsAt}</span>}
                  {areaName && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">{areaName}</span>}
                  {stop.isActive && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AreasTab() {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = async () => {
    const [aRes, cRes] = await Promise.all([api.get('/areas'), api.get('/customers')]);
    setAreas(aRes.data);
    setCustomers(cRes.data);
  };

  useEffect(() => { load(); }, []);

  const createArea = async (e) => {
    e.preventDefault();
    await api.post('/areas', form);
    setForm({ name: '', description: '' });
    setShowForm(false);
    load();
  };

  const deleteArea = async (id) => {
    await api.delete(`/areas/${id}`);
    load();
  };

  const toggleCustomer = async (areaId, customerId, inArea) => {
    if (inArea) {
      await api.delete(`/areas/${areaId}/customers/${customerId}`);
    } else {
      await api.post(`/areas/${areaId}/customers`, { customerId });
    }
    load();
  };

  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ New area'}
      </button>

      {showForm && (
        <form className="card space-y-3 border border-white/70" onSubmit={createArea}>
          <h3 className="font-bold text-slate-900">Create area</h3>
          <input className="input" placeholder="Area name (e.g. Town Centre) *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn-primary w-full">Create area</button>
        </form>
      )}

      {areas.length === 0 ? (
        <div className="card soft-panel py-8 text-center text-sm text-slate-500">No areas yet. Create one to group customers for targeted van alerts.</div>
      ) : areas.map((area, i) => (
        <div key={area.id} className="card stagger-item border border-white/60 space-y-3" style={{ '--delay': `${i * 30}ms` }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900">{area.name}</h4>
              {area.description && <p className="text-sm text-slate-500">{area.description}</p>}
              <p className="mt-0.5 text-xs text-slate-400">{(area.customerIds || []).length} customer{(area.customerIds || []).length !== 1 ? 's' : ''}</p>
            </div>
            <button className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition" onClick={() => deleteArea(area.id)}>Delete</button>
          </div>
          <div className="space-y-1.5">
            {customers.map((c) => {
              const inArea = (area.customerIds || []).includes(c.id);
              return (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                  <button
                    className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${inArea ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    onClick={() => toggleCustomer(area.id, c.id, inArea)}
                  >
                    {inArea ? 'Remove' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PromotionsTab() {
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', type: 'percent_off', value: '', minOrderValue: '', usageLimit: '', expiresAt: '' });
  const [formError, setFormError] = useState('');

  const load = async () => { const res = await api.get('/promotions'); setPromos(res.data); };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ code: '', name: '', type: 'percent_off', value: '', minOrderValue: '', usageLimit: '', expiresAt: '' }); setEditing(null); setShowForm(false); setFormError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editing) {
        await api.put(`/promotions/${editing}`, form);
      } else {
        await api.post('/promotions', form);
      }
      resetForm();
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save promotion');
    }
  };

  const toggleActive = async (promo) => {
    await api.put(`/promotions/${promo.id}`, { ...promo, active: !promo.active });
    load();
  };

  const deletePromo = async (id) => {
    await api.delete(`/promotions/${id}`);
    load();
  };

  const startEdit = (promo) => {
    setEditing(promo.id);
    setForm({ code: promo.code, name: promo.name, type: promo.type, value: String(promo.value), minOrderValue: String(promo.minOrderValue || ''), usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : '', expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TYPE_LABELS = { percent_off: '% off order', fixed_off: '£ off order', bogo: 'Buy one get one free' };

  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
        {showForm && !editing ? 'Cancel' : '+ New promotion'}
      </button>

      {showForm && (
        <form className="card space-y-3 border border-white/70" onSubmit={submit}>
          <h3 className="font-bold text-slate-900">{editing ? 'Edit promotion' : 'Create promotion'}</h3>
          {formError && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">⚠ {formError}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Code (e.g. CHEESE10) *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <input className="input" placeholder="Description (e.g. 10% off) *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent_off">% off order</option>
              <option value="fixed_off">£ fixed off order</option>
              <option value="bogo">Buy one get one free (cheapest free)</option>
            </select>
            {form.type !== 'bogo' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{form.type === 'percent_off' ? '%' : '£'}</span>
                <input className="input pl-7" placeholder="Value *" required type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            )}
            {form.type === 'bogo' && <input className="input" value="Cheapest item free" disabled />}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">£ min</span>
              <input className="input pl-10" placeholder="Min order (optional)" type="number" step="0.01" min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
            </div>
            <input className="input" placeholder="Max uses (blank = unlimited)" type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Expires (optional)</label>
              <input className="input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{editing ? 'Save changes' : 'Create promotion'}</button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {promos.length === 0 ? (
        <div className="card soft-panel py-8 text-center text-sm text-slate-500">No promotions yet. Create discount codes, BOGO deals and more.</div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo, i) => (
            <div key={promo.id} className={`card stagger-item border ${promo.active ? 'border-white/60' : 'border-slate-200 opacity-60'}`} style={{ '--delay': `${i * 30}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-0.5 font-mono text-sm font-black text-white tracking-widest">{promo.code}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${promo.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {promo.active ? 'Active' : 'Paused'}
                    </span>
                    {promo.expiresAt && new Date(promo.expiresAt) < new Date() && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">Expired</span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-slate-800">{promo.name}</p>
                  <p className="text-sm text-slate-500">
                    {TYPE_LABELS[promo.type]}
                    {promo.type !== 'bogo' && ` — ${promo.type === 'percent_off' ? `${promo.value}%` : `£${promo.value.toFixed(2)}`} off`}
                    {promo.minOrderValue > 0 && ` · min £${promo.minOrderValue.toFixed(2)}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Used {promo.usageCount} time{promo.usageCount !== 1 ? 's' : ''}
                    {promo.usageLimit && ` / ${promo.usageLimit} max`}
                    {promo.expiresAt && ` · expires ${new Date(promo.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary !py-1.5 !text-xs" onClick={() => startEdit(promo)}>Edit</button>
                  <button className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${promo.active ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`} onClick={() => toggleActive(promo)}>
                    {promo.active ? 'Pause' : 'Resume'}
                  </button>
                  <button className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition" onClick={() => deletePromo(promo.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => { const res = await api.get('/settings'); setSettings(res.data); };
  useEffect(() => { load(); }, []);

  const patch = async (updates) => {
    setSaving(true);
    const res = await api.patch('/settings', updates);
    setSettings(res.data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <div className="card soft-panel py-8 text-center text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4">
      {saved && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">✓ Settings saved</div>}

      <div className="card border border-white/60 space-y-4">
        <h3 className="font-extrabold text-slate-900">Van status</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">Currently {settings.isOpen ? <span className="text-emerald-600">Open</span> : <span className="text-red-500">Closed</span>}</p>
            <p className="text-xs text-slate-500">Customers see a closed banner and cannot order when set to closed.</p>
          </div>
          <button
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              settings.isOpen ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            onClick={() => patch({ isOpen: !settings.isOpen })}
            disabled={saving}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
              settings.isOpen ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Closed message (shown to customers)</label>
          <input
            className="input"
            value={settings.closedMessage || ''}
            onChange={(e) => setSettings({ ...settings, closedMessage: e.target.value })}
            onBlur={() => patch({ closedMessage: settings.closedMessage })}
          />
        </div>
      </div>

      <div className="card border border-white/60 space-y-4">
        <h3 className="font-extrabold text-slate-900">Loyalty stamps</h3>
        <p className="text-sm text-slate-500">Customers earn 1 stamp per order. When they reach the target, they get a free-item notification.</p>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Stamps required for reward</label>
          <input
            className="input w-32"
            type="number" min="1" max="50"
            value={settings.loyaltyStampsRequired || 9}
            onChange={(e) => setSettings({ ...settings, loyaltyStampsRequired: Number(e.target.value) })}
            onBlur={() => patch({ loyaltyStampsRequired: settings.loyaltyStampsRequired })}
          />
        </div>
      </div>

      <div className="card border border-white/60 space-y-4">
        <h3 className="font-extrabold text-slate-900">Email / SMTP settings</h3>
        <p className="text-sm text-slate-500">Configure outbound email so order confirmations are sent to customers. Leave blank to log emails to file instead.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">SMTP Host</label>
            <input className="input" placeholder="smtp.example.com" value={settings.smtpHost || ''} onChange={e => setSettings({ ...settings, smtpHost: e.target.value })} onBlur={() => patch({ smtpHost: settings.smtpHost })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">SMTP Port</label>
            <input className="input" type="number" placeholder="587" value={settings.smtpPort || 587} onChange={e => setSettings({ ...settings, smtpPort: Number(e.target.value) })} onBlur={() => patch({ smtpPort: settings.smtpPort })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">SMTP Username</label>
            <input className="input" placeholder="user@example.com" value={settings.smtpUser || ''} onChange={e => setSettings({ ...settings, smtpUser: e.target.value })} onBlur={() => patch({ smtpUser: settings.smtpUser })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">SMTP Password</label>
            <input className="input" type="password" placeholder="••••••••" value={settings.smtpPass || ''} onChange={e => setSettings({ ...settings, smtpPass: e.target.value })} onBlur={() => patch({ smtpPass: settings.smtpPass })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">From address</label>
            <input className="input" placeholder="noreply@itsdiner.com" value={settings.smtpFrom || ''} onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })} onBlur={() => patch({ smtpFrom: settings.smtpFrom })} />
          </div>
        </div>
        {(!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) && (
          <p className="rounded-xl bg-yellow-50 px-3 py-2 text-xs text-yellow-700 ring-1 ring-yellow-200">⚠ SMTP not configured — emails are being logged to <code>data/email-log.json</code> instead of sent.</p>
        )}
      </div>

      <DataRetention />

      <BackupRestore />
    </div>
  );
}

function DataRetention() {
  const [months, setMonths] = useState(24);
  const [purging, setPurging] = useState(false);
  const [result, setResult] = useState(null);

  const purge = async () => {
    setPurging(true);
    setResult(null);
    try {
      const res = await api.delete(`/admin/orders/old?months=${months}`);
      setResult({ ok: true, msg: res.data.message });
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.message || 'Purge failed' });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="card border border-white/60 space-y-4">
      <h3 className="font-extrabold text-slate-900">Data retention (GDPR)</h3>
      <p className="text-sm text-slate-500">
        Anonymise old orders by removing customer names and emails from orders older than a chosen number of months.
        Order totals and items are kept for accounting. This action cannot be undone.
      </p>
      {result && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${result.ok ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
          {result.ok ? '✓' : '⚠'} {result.msg}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Anonymise orders older than</label>
          <div className="flex items-center gap-2">
            <input
              className="input w-24"
              type="number" min="1" max="120"
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
            />
            <span className="text-sm text-slate-500">months</span>
          </div>
        </div>
        <button
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          onClick={purge}
          disabled={purging}
        >
          {purging ? 'Anonymising…' : 'Anonymise old orders'}
        </button>
      </div>
      <p className="text-[11px] text-slate-400">Recommended: run every 12–24 months to stay compliant with GDPR storage limitation principles.</p>
    </div>
  );
}

function BackupRestore() {
  const [restoreState, setRestoreState] = useState('idle');
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileRef = useRef();

  const downloadBackup = async () => {
    const res = await api.get('/admin/backup');
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streetbites-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreState('loading');
    setRestoreMsg('');
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await api.post('/admin/restore', payload);
      setRestoreState('success');
      setRestoreMsg(res.data.message);
    } catch (err) {
      setRestoreState('error');
      setRestoreMsg(err.response?.data?.message || 'Restore failed — check the file is a valid ITS Diner backup.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="card border border-white/60 space-y-4">
      <h3 className="font-extrabold text-slate-900">Backup &amp; Restore</h3>
      <p className="text-sm text-slate-500">
        Download a full snapshot of all app data (menu, orders, customers, settings, promotions).
        Restore from a previous backup to roll back everything at once.
      </p>

      {restoreState === 'success' && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">✓ {restoreMsg}</div>
      )}
      {restoreState === 'error' && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">⚠ {restoreMsg}</div>
      )}

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary flex items-center gap-2" onClick={downloadBackup}>
          ⬇ Download backup
        </button>
        <label className="btn-secondary flex cursor-pointer items-center gap-2">
          ⬆ Restore from file
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
        </label>
      </div>

      <p className="text-[11px] text-slate-400">
        ⚠ Restoring will overwrite all current data immediately. Download a fresh backup first.
      </p>
    </div>
  );
}

function TakingsTab() {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState('week');

  useEffect(() => { api.get('/orders').then(r => setOrders(r.data)).catch(() => {}); }, []);

  const now = new Date();
  function periodStart(p) {
    if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (p === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
    if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(0);
  }

  const active = orders.filter(o => new Date(o.createdAt) >= periodStart(period) && o.status !== 'cancelled');
  const todayActive = orders.filter(o => new Date(o.createdAt) >= periodStart('today') && o.status !== 'cancelled');

  const revenue = active.reduce((s, o) => s + Number(o.total || 0), 0);
  const todayRevenue = todayActive.reduce((s, o) => s + Number(o.total || 0), 0);
  const avgOrder = active.length ? revenue / active.length : 0;

  const byPayment = {};
  active.forEach(o => { const t = o.paymentType || 'other'; byPayment[t] = (byPayment[t] || 0) + Number(o.total || 0); });
  const paymentTotal = Object.values(byPayment).reduce((s, v) => s + v, 0) || 1;

  const itemMap = {};
  active.forEach(o => (o.items || []).forEach(it => {
    if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, qty: 0, rev: 0 };
    itemMap[it.name].qty += it.quantity || 1;
    itemMap[it.name].rev += Number(it.price || 0) * (it.quantity || 1);
  }));
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 6);
  const maxQty = topItems[0]?.qty || 1;

  const allPeriod = orders.filter(o => new Date(o.createdAt) >= periodStart(period));
  const byStatus = {};
  allPeriod.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

  const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7 days' },
    { key: 'month', label: 'This month' },
    { key: 'all', label: 'All time' },
  ];

  const PAYMENT_COLOURS = { card: 'bg-blue-500', credit: 'bg-violet-500', cash: 'bg-emerald-500', other: 'bg-slate-400' };
  const STATUS_LABELS = { new: '🆕 New', preparing: '🍳 Preparing', ready: '✅ Ready', collected: '📦 Collected', cancelled: '❌ Cancelled' };

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${period === key ? 'bg-[#F5B800] text-stone-900 shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's takings", value: `£${todayRevenue.toFixed(2)}`, sub: `${todayActive.length} orders`, accent: 'border-l-4 border-[#F5B800]' },
          { label: 'Period revenue', value: `£${revenue.toFixed(2)}`, sub: PERIODS.find(p => p.key === period)?.label, accent: 'border-l-4 border-blue-400' },
          { label: 'Orders', value: active.length, sub: `${allPeriod.length} incl. cancelled`, accent: 'border-l-4 border-emerald-400' },
          { label: 'Avg order value', value: `£${avgOrder.toFixed(2)}`, sub: 'excl. cancelled', accent: 'border-l-4 border-violet-400' },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} className={`card border border-white/60 ${accent}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payment breakdown */}
        <div className="card border border-white/60 space-y-3">
          <h3 className="font-extrabold text-slate-900">Revenue by payment type</h3>
          {Object.keys(byPayment).length === 0 ? (
            <p className="text-sm text-slate-400">No orders in this period.</p>
          ) : (
            Object.entries(byPayment).sort((a, b) => b[1] - a[1]).map(([type, val]) => (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold capitalize text-slate-700">{type}</span>
                  <span className="font-bold text-slate-900">£{val.toFixed(2)} <span className="font-normal text-slate-400">({Math.round(val / paymentTotal * 100)}%)</span></span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${PAYMENT_COLOURS[type] || 'bg-slate-400'}`}
                    style={{ width: `${(val / paymentTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order status breakdown */}
        <div className="card border border-white/60 space-y-3">
          <h3 className="font-extrabold text-slate-900">Order status breakdown</h3>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-sm text-slate-400">No orders in this period.</p>
          ) : (
            Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{STATUS_LABELS[status] || status}</span>
                <span className="text-sm font-extrabold text-slate-900">{count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top selling items */}
      <div className="card border border-white/60 space-y-3">
        <h3 className="font-extrabold text-slate-900">Top selling items</h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-slate-400">No items sold in this period.</p>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">
                    <span className="mr-2 text-xs font-bold text-slate-400">#{i + 1}</span>
                    {item.name}
                  </span>
                  <div className="flex gap-3 text-right">
                    <span className="text-slate-500">{item.qty} sold</span>
                    <span className="font-bold text-slate-900">£{item.rev.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#F5B800] transition-all duration-500"
                    style={{ width: `${(item.qty / maxQty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'menu', label: 'Menu', icon: Utensils },
  { key: 'orders', label: 'Orders', icon: List },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'routes', label: 'Routes', icon: MapPin },
  { key: 'areas', label: 'Areas', icon: ZapIcon },
  { key: 'promotions', label: 'Promos', icon: Tag },
  { key: 'takings', label: 'Takings', icon: TrendingUp },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function OwnerPage({ user }) {
  const [tab, setTab] = useState('menu');

  if (!user || user.role !== 'owner') {
    return <div className="card"><p className="text-sm text-slate-500">Owner access only.</p></div>;
  }

  return (
    <div className="space-y-4 fade-in-up">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-5 text-white shadow-2xl shadow-black/40">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
            👑 Owner
          </span>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight">Business Dashboard</h2>
          <p className="mt-1 text-sm text-white/70">Manage menu, orders, customers, routes and areas.</p>
        </div>
      </section>

      <div className="grid grid-cols-8 gap-1 rounded-2xl bg-slate-100/80 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold transition-all duration-200 ${
              tab === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab(key)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'menu' && <MenuTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'customers' && <CustomersTab />}
      {tab === 'routes' && <RoutesTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'promotions' && <PromotionsTab />}
      {tab === 'takings' && <TakingsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}
