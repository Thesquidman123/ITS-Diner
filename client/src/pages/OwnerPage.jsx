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

const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMG_BYTES = 5 * 1024 * 1024;

function MenuTab() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [extras, setExtras] = useState([]);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [clearImageFlag, setClearImageFlag] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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

  const handleImageFile = (file) => {
    if (!file) return;
    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      setFormError(`Unsupported file type (${file.type || 'unknown'}). Please use JPG, PNG, or WEBP.`);
      return;
    }
    if (file.size > MAX_IMG_BYTES) {
      setFormError(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      return;
    }
    setFormError('');
    setClearImageFlag(false);
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleImage = (e) => handleImageFile(e.target.files?.[0] || null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files?.[0] || null);
  };

  const handleRemoveImage = () => {
    setForm((f) => ({ ...f, image: null }));
    setPreview(null);
    setClearImageFlag(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addExtra = () => setExtras((ex) => [...ex, { name: '', price: '' }]);
  const removeExtra = (idx) => setExtras((ex) => ex.filter((_, i) => i !== idx));
  const updateExtra = (idx, field, val) => setExtras((ex) => ex.map((e, i) => i === idx ? { ...e, [field]: val } : e));

  const resetForm = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setExtras([]);
    setPreview(null);
    setClearImageFlag(false);
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
      if (clearImageFlag) data.append('clearImage', 'true');

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
    setPreview(item.imageUrl ? item.imageUrl : null);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAvail = async (id) => {
    await api.patch(`/menu/${id}/toggle`);
    load();
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from the menu? This cannot be undone.`)) return;
    await api.delete(`/menu/${item.id}`);
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

        {/* Drag-and-drop image upload */}
        <div>
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="h-40 w-full rounded-2xl object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-white transition">
                    📷 Change
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImage} />
                  </label>
                  <button type="button" className="rounded-xl bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition" onClick={handleRemoveImage}>
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 py-6 text-center">
                <span className="text-2xl">📷</span>
                <span className="text-sm font-semibold text-slate-600">{dragOver ? 'Drop to upload' : 'Drag & drop or click to add photo'}</span>
                <span className="text-xs text-slate-400">JPG · PNG · WEBP · max 5 MB</span>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImage} />
              </label>
            )}
          </div>
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
                ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
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
                <button className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition" onClick={() => deleteItem(item)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildLabelHtml(order, appName) {
  const time = new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const itemRows = order.items.map((it) => {
    const opts = (it.selectedOptions || []).map((o) => `<div style="margin-left:12px;font-size:11px">+ ${o.name}${o.price ? ' (+£' + Number(o.price).toFixed(2) + ')' : ''}</div>`).join('');
    return `<div style="margin-bottom:6px"><strong>${it.quantity}&times; ${it.name}</strong>${opts}</div>`;
  }).join('');
  const scheduled = order.scheduledFor
    ? `<div style="background:#000;color:#fff;padding:4px 8px;font-size:11px;margin-bottom:6px">&#x1F551; SCHEDULED ${new Date(order.scheduledFor).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>`
    : '';
  const tab = order.paymentType === 'credit' ? '<span style="border:1px solid #000;padding:1px 5px;font-size:10px">TAB</span>' : '';
  const promo = order.promo ? `<div style="font-size:11px">Promo: ${order.promo.code} &minus;£${Number(order.discount).toFixed(2)}</div>` : '';
  return `<!DOCTYPE html><html><head><title>Label #${order.ref}</title>
<style>
  @page { margin: 8mm; size: 80mm auto; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; background: #fff; width: 80mm; margin: 0 auto; padding: 0; }
  .dashed { border-top: 1px dashed #000; margin: 6px 0; }
</style>
</head><body>
<div style="text-align:center;font-size:11px;letter-spacing:2px;text-transform:uppercase">${appName || 'Food Van'}</div>
<div style="text-align:center;font-size:36px;font-weight:900;letter-spacing:4px;line-height:1.1">#${order.ref}</div>
<div class="dashed"></div>
<div style="font-size:13px"><strong>${order.customerName}</strong></div>
<div style="font-size:11px;color:#333">${time}</div>
${scheduled}
<div class="dashed"></div>
${itemRows}
<div class="dashed"></div>
${promo}
<div style="display:flex;justify-content:space-between;align-items:center">
  <div style="font-size:11px;text-transform:capitalize">${order.paymentType} &bull; ${order.type} ${tab}</div>
  <div style="font-size:18px;font-weight:900">£${Number(order.total).toFixed(2)}</div>
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);};<\/script>
</body></html>`;
}

const KDS_COLS = [
  { key: 'new',       label: 'New',       headerCls: 'bg-blue-600',    ringCls: 'ring-blue-300',    dotCls: 'bg-blue-500',    nextLabel: 'Start preparing' },
  { key: 'preparing', label: 'Preparing', headerCls: 'bg-amber-500',   ringCls: 'ring-amber-300',   dotCls: 'bg-amber-500',   nextLabel: 'Mark ready' },
  { key: 'ready',     label: 'Ready ✓',   headerCls: 'bg-emerald-600', ringCls: 'ring-emerald-300', dotCls: 'bg-emerald-500', nextLabel: 'Collected' },
];

function beep(freq = 880, dur = 0.18, vol = 0.25) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    g.gain.value = vol; osc.frequency.value = freq;
    osc.start(); osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch {}
}

function schedInfo(order, now) {
  if (!order.scheduledFor) return null;
  const mins = Math.round((new Date(order.scheduledFor) - now) / 60000);
  const urgency = mins < 0 ? 'overdue' : mins <= 5 ? 'urgent' : mins <= 15 ? 'soon' : 'ok';
  return { mins, urgency };
}

function ageLabel(createdAt, now) {
  const m = Math.floor((now - new Date(createdAt)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

function sortKds(list, now) {
  return [...list].sort((a, b) => {
    const aS = a.scheduledFor ? new Date(a.scheduledFor) - now : Infinity;
    const bS = b.scheduledFor ? new Date(b.scheduledFor) - now : Infinity;
    if (aS !== bS) return aS - bS;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [appName, setAppName] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showCollected, setShowCollected] = useState(false);
  const prevNewIds = useRef(new Set());
  const alertedIds = useRef(new Set());

  const load = async () => {
    const res = await api.get('/orders');
    const data = res.data;
    const ids = new Set(data.filter((o) => o.status === 'new').map((o) => o.id));
    const hasNew = [...ids].some((id) => !prevNewIds.current.has(id));
    if (hasNew && prevNewIds.current.size > 0) {
      beep(880, 0.15); setTimeout(() => beep(1100, 0.15), 200);
    }
    prevNewIds.current = ids;
    setOrders(data);
  };

  useEffect(() => {
    load();
    api.get('/settings').then((r) => setAppName(r.data.appName || '')).catch(() => {});
    const ot = setInterval(load, 15000);
    const ct = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(ot); clearInterval(ct); };
  }, []);

  useEffect(() => {
    orders.forEach((o) => {
      if (!o.scheduledFor || o.status === 'collected' || alertedIds.current.has(o.id)) return;
      const mins = (new Date(o.scheduledFor) - now) / 60000;
      if (mins <= 15 && mins > 0) {
        alertedIds.current.add(o.id);
        beep(440, 0.25); setTimeout(() => beep(660, 0.25), 350); setTimeout(() => beep(880, 0.25), 700);
      }
    });
  }, [now, orders]);

  const advance = async (id, status) => {
    const next = { new: 'preparing', preparing: 'ready', ready: 'collected' }[status];
    if (next) { await api.patch(`/orders/${id}/status`, { status: next }); load(); }
  };

  const byStatus = (key) => sortKds(orders.filter((o) => o.status === key), now);
  const collected = sortKds(orders.filter((o) => o.status === 'collected'), now).slice(0, 20);
  const newOrders = byStatus('new');

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live orders</span>
        <button className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition" onClick={load}>↻ Refresh</button>
        <button
          className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          onClick={() => setShowCollected((v) => !v)}
        >
          {showCollected ? 'Hide collected' : `Collected (${collected.length})`}
        </button>
        <button
          className="ml-auto flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          onClick={() => {
            if (!newOrders.length) return;
            const win = window.open('', '_blank');
            win.document.write(newOrders.map((o) => buildLabelHtml(o, appName)).join('<div style="page-break-after:always"></div>'));
            win.document.close();
          }}
        >
          <Printer className="h-3.5 w-3.5" /> Print all new
        </button>
      </div>

      {/* kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KDS_COLS.map((col) => {
          const colOrders = byStatus(col.key);
          return (
            <div key={col.key} className="flex flex-col gap-2 min-w-0">
              {/* column header */}
              <div className={`flex items-center justify-between rounded-2xl px-4 py-2 text-white ${col.headerCls}`}>
                <span className="font-bold tracking-wide">{col.label}</span>
                {colOrders.length > 0 && (
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-sm font-black">{colOrders.length}</span>
                )}
              </div>

              {colOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">No orders</div>
              )}

              {colOrders.map((order) => {
                const si = schedInfo(order, now);
                const isOverdue = si?.urgency === 'overdue';
                const isUrgent = si?.urgency === 'urgent';
                const isSoon = si?.urgency === 'soon';
                const cardCls = isOverdue
                  ? 'ring-2 ring-red-500 bg-red-50 animate-pulse'
                  : isUrgent
                  ? 'ring-2 ring-orange-400 bg-orange-50'
                  : isSoon
                  ? 'ring-1 ring-amber-400 bg-amber-50'
                  : 'bg-white border border-slate-200';

                return (
                  <div key={order.id} className={`rounded-2xl p-3 shadow-sm transition ${cardCls}`}>
                    {/* scheduled banner */}
                    {si && (
                      <div className={`mb-2 flex items-center justify-between rounded-xl px-2.5 py-1 text-xs font-bold ${isOverdue ? 'bg-red-600 text-white' : isUrgent ? 'bg-orange-500 text-white' : isSoon ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <span>🕐 {new Date(order.scheduledFor).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{isOverdue ? 'OVERDUE' : `${Math.abs(si.mins)}m ${si.mins < 0 ? 'ago' : 'away'}`}</span>
                      </div>
                    )}

                    {/* ref + age */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 font-mono text-sm font-black tracking-widest text-white">#{order.ref}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">{ageLabel(order.createdAt, now)}</span>
                    </div>

                    {/* customer */}
                    <p className="mt-1.5 font-bold text-slate-900 leading-tight">{order.customerName}</p>

                    {/* items */}
                    <ul className="mt-1.5 space-y-1">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="text-sm">
                          <span className="font-semibold">{it.quantity}× {it.name}</span>
                          {(it.selectedOptions || []).map((o, oi) => (
                            <div key={oi} className="ml-3 text-[11px] text-slate-500">+ {o.name}{o.price ? ` (+£${Number(o.price).toFixed(2)})` : ''}</div>
                          ))}
                        </li>
                      ))}
                    </ul>

                    {/* footer: total + tags */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">£{Number(order.total).toFixed(2)}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-500">{order.paymentType}</span>
                      {order.paymentType === 'credit' && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">TAB</span>}
                      {order.promo && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{order.promo.code}</span>}
                      <button
                        className="ml-auto flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-200 transition"
                        onClick={() => { const win = window.open('', '_blank'); win.document.write(buildLabelHtml(order, appName)); win.document.close(); }}
                      >
                        <Printer className="h-2.5 w-2.5" /> Label
                      </button>
                    </div>

                    {/* advance button */}
                    {col.key !== 'ready' ? (
                      <button
                        className={`mt-2 w-full rounded-xl py-2 text-sm font-bold text-white transition ${col.key === 'new' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        onClick={() => advance(order.id, order.status)}
                      >
                        {col.nextLabel} →
                      </button>
                    ) : (
                      <button
                        className="mt-2 w-full rounded-xl bg-slate-700 py-2 text-sm font-bold text-white hover:bg-slate-900 transition"
                        onClick={() => advance(order.id, order.status)}
                      >
                        ✓ {col.nextLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* collected orders (collapsed) */}
      {showCollected && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Collected ({collected.length})</p>
          {collected.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">None yet</div>}
          {collected.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm opacity-70">
              <span className="font-mono font-black text-slate-700">#{order.ref}</span>
              <span className="text-slate-500">{order.customerName}</span>
              <span className="font-bold">£{Number(order.total).toFixed(2)}</span>
              <span className="text-xs text-slate-400">{ageLabel(order.createdAt, now)}</span>
              <button className="rounded-lg bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-300 transition" onClick={() => { const win = window.open('', '_blank'); win.document.write(buildLabelHtml(order, appName)); win.document.close(); }}>
                <Printer className="inline h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ creditEnabled: false, creditLimit: 25, balance: 0 });
  const [initialBalance, setInitialBalance] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(null);
  const [stampsRequired, setStampsRequired] = useState(9);
  const [rewardDesc, setRewardDesc] = useState('Free item of your choice');

  const load = async () => {
    const [cRes, oRes] = await Promise.all([api.get('/customers'), api.get('/orders')]);
    setCustomers(cRes.data);
    setOrders(oRes.data);
    return cRes.data;
  };
  useEffect(() => {
    load();
    api.get('/settings').then(r => { setStampsRequired(Number(r.data.loyaltyStampsRequired || 9)); setRewardDesc(r.data.loyaltyRewardDescription || 'Free item of your choice'); }).catch(() => {});
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const customerOrders = (customerId) =>
    orders
      .filter((o) => o.customerId === customerId && new Date(o.createdAt) >= sixMonthsAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const openManageTab = async (c) => {
    const fresh = await load();
    const current = fresh.find((x) => x.id === c.id) || c;
    const bal = Number(current.balance || 0);
    setEditing(current.id);
    setInitialBalance(bal);
    setForm({ creditEnabled: current.creditEnabled || false, creditLimit: current.creditLimit || 25, balance: bal });
  };

  const saveCredit = async (id) => {
    const freshList = await load();
    const fresh = freshList.find((x) => x.id === id);
    const liveBalance = fresh ? Number(fresh.balance || 0) : initialBalance;
    const balanceToSave = form.balance !== initialBalance ? form.balance : liveBalance;
    await api.patch(`/customers/${id}/credit`, { ...form, balance: balanceToSave });
    setEditing(null);
    load();
  };

  const confirmReward = async (id) => {
    await api.post(`/customers/${id}/redeem-loyalty`);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition" onClick={load}>↻ Refresh balances</button>
      </div>
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

          {/* Loyalty reward banner */}
          {Number(c.stamps || 0) >= stampsRequired && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-300">
              <div>
                <p className="text-sm font-bold text-amber-800">🎉 Reward earned! ({c.stamps}/{stampsRequired} stamps)</p>
                <p className="text-xs text-amber-700">{rewardDesc}</p>
              </div>
              <button
                className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition"
                onClick={() => confirmReward(c.id)}
              >
                ✓ Confirm given
              </button>
            </div>
          )}

          {/* 6-month order history */}
          {historyOpen === c.id && (
            <div className="space-y-1.5 rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last 6 months</p>
              {customerOrders(c.id).length === 0 ? (
                <p className="text-xs text-slate-400">No orders in this period.</p>
              ) : (
                customerOrders(c.id).map((o) => (
                  <div key={o.id} className="flex items-start justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs shadow-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-600">#{o.ref}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_COLOURS[o.status]}`}>{o.status}</span>
                        {o.paymentType === 'credit' && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">TAB</span>}
                      </div>
                      <p className="mt-0.5 text-slate-500 truncate">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                      <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="font-extrabold text-slate-900 shrink-0">£{Number(o.total).toFixed(2)}</span>
                  </div>
                ))
              )}
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
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 !py-1.5 !text-sm" onClick={() => openManageTab(c)}>Manage tab</button>
              <button
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                onClick={() => setHistoryOpen(historyOpen === c.id ? null : c.id)}
              >
                {historyOpen === c.id ? '▲ History' : `▼ History (${customerOrders(c.id).length})`}
              </button>
            </div>
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
        <p className="text-sm text-slate-500">Customers earn 1 stamp per order. When they reach the target they get a notification, and you see an alert in the Customers tab to confirm the reward has been given.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Stamps required for reward</label>
            <input
              className="input"
              type="number" min="1" max="50"
              value={settings.loyaltyStampsRequired || 9}
              onChange={(e) => setSettings({ ...settings, loyaltyStampsRequired: Number(e.target.value) })}
              onBlur={() => patch({ loyaltyStampsRequired: settings.loyaltyStampsRequired })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Reward description (shown to customer &amp; staff)</label>
            <input
              className="input"
              placeholder="e.g. Free regular coffee"
              value={settings.loyaltyRewardDescription || ''}
              onChange={(e) => setSettings({ ...settings, loyaltyRewardDescription: e.target.value })}
              onBlur={() => patch({ loyaltyRewardDescription: settings.loyaltyRewardDescription })}
            />
          </div>
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
  const [menu, setMenu] = useState([]);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {});
    api.get('/menu').then(r => setMenu(r.data)).catch(() => {});
  }, []);

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

  const menuById = Object.fromEntries(menu.map(m => [m.id, m]));

  const itemMap = {};
  active.forEach(o => (o.items || []).forEach(it => {
    if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, menuItemId: it.menuItemId, qty: 0, rev: 0 };
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
            {topItems.map((item, i) => {
              const mi = menuById[item.menuItemId];
              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center gap-3">
                    {mi?.imageUrl ? (
                      <img src={mi.imageUrl} alt={item.name} className="h-10 w-10 rounded-xl object-cover shrink-0 border border-slate-100" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">🍽</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="mr-1.5 text-xs font-bold text-slate-400">#{i + 1}</span>
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {mi?.category && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{mi.category}</span>}
                        </div>
                        <div className="flex gap-3 text-right text-sm shrink-0">
                          <span className="text-slate-500">{item.qty} sold</span>
                          <span className="font-bold text-slate-900">£{item.rev.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-2 rounded-full bg-[#F5B800] transition-all duration-500" style={{ width: `${(item.qty / maxQty) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

const PROTECTED_TABS = new Set(['settings', 'takings']);
const OWNER_PIN = '2468';

export default function OwnerPage({ user }) {
  const [tab, setTab] = useState('orders');
  const [isOpen, setIsOpen] = useState(true);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [pinTarget, setPinTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [unlockedTabs, setUnlockedTabs] = useState(new Set());

  useEffect(() => {
    api.get('/settings').then(r => setIsOpen(Boolean(r.data.isOpen))).catch(() => {});
  }, []);

  const toggleOpen = async () => {
    setTogglingOpen(true);
    const next = !isOpen;
    setIsOpen(next);
    await api.patch('/settings', { isOpen: next }).catch(() => setIsOpen(!next));
    setTogglingOpen(false);
  };

  const handleTabClick = (key) => {
    if (PROTECTED_TABS.has(key) && !unlockedTabs.has(key)) {
      setPinTarget(key);
      setPinInput('');
      setPinError(false);
    } else {
      setTab(key);
    }
  };

  const handlePinKey = (digit) => {
    const next = (pinInput + digit).slice(0, 4);
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === OWNER_PIN) {
        setUnlockedTabs(prev => new Set([...prev, pinTarget]));
        setTab(pinTarget);
        setPinTarget(null);
        setPinInput('');
      } else {
        setPinError(true);
        setTimeout(() => setPinInput(''), 600);
      }
    }
  };

  if (!user || user.role !== 'owner') {
    return <div className="card"><p className="text-sm text-slate-500">Owner access only.</p></div>;
  }

  return (
    <div className="space-y-4 fade-in-up">
      {/* Header with van status */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-5 text-white shadow-2xl shadow-black/40">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
              👑 Owner
            </span>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight">Business Dashboard</h2>
            <p className="mt-1 text-sm text-white/70">Manage menu, orders, customers, routes and areas.</p>
          </div>
          {/* Van open/closed toggle */}
          <div className="shrink-0 flex flex-col items-end gap-2 mt-1">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOpen ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/40' : 'bg-red-500/30 text-red-300 ring-1 ring-red-400/40'}`}>
              {isOpen ? '🟢 Open' : '🔴 Closed'}
            </span>
            <button
              disabled={togglingOpen}
              onClick={toggleOpen}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-60 ${isOpen ? 'bg-emerald-500' : 'bg-slate-500'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${isOpen ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <div className="grid grid-cols-8 gap-1 rounded-2xl bg-slate-100/80 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold transition-all duration-200 ${
              tab === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => handleTabClick(key)}
          >
            <Icon className="h-4 w-4" />
            {label}
            {PROTECTED_TABS.has(key) && !unlockedTabs.has(key) && (
              <span className="absolute right-1 top-1 text-[8px] leading-none text-slate-400">🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* PIN modal */}
      {pinTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          onClick={() => setPinTarget(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl p-6 shadow-2xl"
            style={{ backgroundColor: '#ffffff', colorScheme: 'light' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="mb-1 text-center text-lg font-extrabold" style={{ color: '#0f172a' }}>
              🔒 {TABS.find(t => t.key === pinTarget)?.label}
            </p>
            <p className="mb-5 text-center text-sm" style={{ color: '#64748b' }}>Enter PIN to continue</p>
            <div className="mb-5 flex justify-center gap-4">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border-2 transition-all duration-150"
                  style={{
                    borderColor: pinInput.length > i ? (pinError ? '#ef4444' : '#0f172a') : '#cbd5e1',
                    backgroundColor: pinInput.length > i ? (pinError ? '#ef4444' : '#0f172a') : 'transparent'
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9].map(d => (
                <button
                  key={d}
                  className="rounded-2xl py-4 text-xl font-bold transition-all active:scale-95"
                  style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                  onClick={() => handlePinKey(String(d))}
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                className="rounded-2xl py-4 text-xl font-bold transition-all active:scale-95"
                style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                onClick={() => handlePinKey('0')}
              >
                0
              </button>
              <button
                className="rounded-2xl py-4 text-base font-bold transition-all active:scale-95"
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                onClick={() => { setPinInput(p => p.slice(0, -1)); setPinError(false); }}
              >
                ⌫
              </button>
            </div>
            {pinError && (
              <p className="mt-3 text-center text-sm font-semibold" style={{ color: '#ef4444' }}>
                Incorrect PIN
              </p>
            )}
            <button
              className="mt-4 w-full text-center text-xs transition-colors"
              style={{ color: '#94a3b8' }}
              onClick={() => setPinTarget(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
