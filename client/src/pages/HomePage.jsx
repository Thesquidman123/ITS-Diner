import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Minus, Plus, Search, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import api from '../lib/api';
import CheckoutSheet from '../components/CheckoutSheet';

export default function HomePage({ user, onRequireAuth }) {
  const [menu, setMenu] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [cart, setCart] = useState([]);
  const [basketOpen, setBasketOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [routeChoice, setRouteChoice] = useState({ orderType: 'static', routeId: null, stopId: null });
  const [pickerItem, setPickerItem] = useState(null);
  const [pickerSelected, setPickerSelected] = useState([]);
  const [vanSettings, setVanSettings] = useState(null);

  const loadData = async () => {
    const [menuResponse, routesResponse, settingsResponse] = await Promise.all([
      api.get('/menu'),
      api.get('/routes').catch(() => ({ data: [] })),
      api.get('/settings').catch(() => ({ data: { isOpen: true } }))
    ]);
    setMenu(menuResponse.data);
    setRoutes(routesResponse.data || []);
    setVanSettings(settingsResponse.data);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const filteredMenu = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return menu;
    }
    return menu.filter((item) =>
      [item.name, item.description, item.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [menu, search]);

  const grouped = useMemo(() => filteredMenu.reduce((accumulator, item) => {
    if (!accumulator[item.category]) {
      accumulator[item.category] = [];
    }
    accumulator[item.category].push(item);
    return accumulator;
  }, {}), [filteredMenu]);

  const summary = useMemo(() => {
    const items = cart.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || []
    }));
    const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, total, orderType: routeChoice.orderType, routeId: routeChoice.routeId, stopId: routeChoice.stopId };
  }, [cart, routeChoice]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const pushToCart = (item, selectedOptions = []) => {
    const optionTotal = selectedOptions.reduce((s, o) => s + Number(o.price || 0), 0);
    const unitPrice = Number(item.price) + optionTotal;
    const cartKey = item.id + (selectedOptions.length ? ':' + selectedOptions.map((o) => o.name).join(',') : '');
    setCart((current) => {
      const existing = current.find((e) => e.cartKey === cartKey);
      if (existing) {
        return current.map((e) => e.cartKey === cartKey
          ? { ...e, quantity: e.quantity + 1, lineTotal: (e.quantity + 1) * e.basePrice }
          : e);
      }
      return [...current, { cartKey, id: item.id, name: item.name, quantity: 1, basePrice: unitPrice, lineTotal: unitPrice, selectedOptions }];
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 600);
  };

  const addToCart = (item) => {
    if (item.options && item.options.length > 0) {
      setPickerItem(item);
      setPickerSelected([]);
    } else {
      pushToCart(item, []);
    }
  };

  const confirmPicker = () => {
    if (!pickerItem) return;
    pushToCart(pickerItem, pickerSelected);
    setPickerItem(null);
    setPickerSelected([]);
  };

  const togglePickerOption = (option) => {
    setPickerSelected((prev) =>
      prev.find((o) => o.name === option.name)
        ? prev.filter((o) => o.name !== option.name)
        : [...prev, option]
    );
  };

  const amendCartItem = (cartKey, delta) => {
    setCart((current) => current
      .map((entry) => {
        if (entry.cartKey !== cartKey) return entry;
        const nextQuantity = entry.quantity + delta;
        return { ...entry, quantity: nextQuantity, lineTotal: nextQuantity * Number(entry.basePrice) };
      })
      .filter((entry) => entry.quantity > 0));
  };

  const toggleFavourite = async (itemId) => {
    if (!user) { onRequireAuth(); return; }
    await api.post('/customers/me/favourites', { itemId });
  };

  const liveStops = routes.flatMap((route) =>
    route.stops.filter((stop) => stop.isActive).map((stop) => ({
      routeId: route.id, stopId: stop.id, label: `${route.name} · ${stop.name}`
    }))
  );

  return (
    <div className="space-y-4 fade-in-up pb-24">

      {/* ── Closed banner ── */}
      {vanSettings && !vanSettings.isOpen && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 ring-2 ring-red-200 text-center">
          <p className="text-2xl">🚫</p>
          <p className="mt-1 font-extrabold text-red-700">We're currently closed</p>
          <p className="mt-0.5 text-sm text-red-600">{vanSettings.closedMessage || 'Check back soon!'}</p>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-5 text-white shadow-2xl shadow-black/40">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
            🔥 Live menu
          </span>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">Order in minutes</h2>
          <p className="mt-1 text-sm text-white/80">Pay by card or add to your approved tab.</p>
        </div>
      </section>

      {/* ── Order type ── */}
      <section className="card !p-3">
        <div className="flex gap-1 rounded-2xl bg-slate-100/80 p-1">
          {[
            { type: 'static', label: '📍 Collection' },
            { type: 'route', label: '🚐 Route stop' },
          ].map(({ type, label }) => (
            <button
              key={type}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${
                routeChoice.orderType === type
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() =>
                setRouteChoice(type === 'static'
                  ? { orderType: 'static', routeId: null, stopId: null }
                  : (c) => ({ ...c, orderType: 'route' }))
              }
            >
              {label}
            </button>
          ))}
        </div>
        {routeChoice.orderType === 'route' && (
          <div className="mt-3">
            <select
              className="input"
              value={routeChoice.stopId || ''}
              onChange={(e) => {
                const s = liveStops.find((stop) => stop.stopId === e.target.value);
                setRouteChoice({ orderType: 'route', routeId: s?.routeId || null, stopId: s?.stopId || null });
              }}
            >
              <option value="">Select active stop…</option>
              {liveStops.map((stop) => (
                <option key={stop.stopId} value={stop.stopId}>{stop.label}</option>
              ))}
            </select>
            {liveStops.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">No active stops right now — switch to Collection to order.</p>
            )}
          </div>
        )}
      </section>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input !rounded-2xl !pl-10"
          placeholder="Search the menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setSearch('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {filteredMenu.length === 0 && search && (
        <div className="card soft-panel py-10 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">No results for &ldquo;{search}&rdquo;</p>
          <button className="mt-3 text-sm text-brand-600 underline" onClick={() => setSearch('')}>Clear search</button>
        </div>
      )}

      {/* ── Menu ── */}
      {Object.entries(grouped).map(([category, items], categoryIndex) => (
        <section key={category} className="space-y-3 stagger-item" style={{ '--delay': `${categoryIndex * 40}ms` }}>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold tracking-tight text-slate-900">{category}</h3>
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">{items.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, itemIndex) => {
              const inCart = cart.filter((e) => e.id === item.id).reduce((s, e) => ({ quantity: s.quantity + e.quantity }), { quantity: 0 });
              const justAdded = addedId === item.id;
              return (
                <article
                  key={item.id}
                  className="card group stagger-item overflow-hidden !p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80"
                  style={{ '--delay': `${(categoryIndex * 60) + (itemIndex * 30)}ms` }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                    {item.imageUrl
                      ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={item.imageUrl} alt={item.name} />
                      : <div className="flex h-full items-center justify-center text-4xl">🍔</div>
                    }
                    <button
                      className="absolute right-2.5 top-2.5 rounded-full border border-white/60 bg-white/80 p-1.5 text-rose-400 shadow backdrop-blur transition hover:scale-110 hover:bg-white"
                      onClick={() => toggleFavourite(item.id)}
                    >
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                    {inCart.quantity > 0 && (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        ×{inCart.quantity}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-slate-900">{item.name}</h4>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-base font-extrabold text-slate-900">£{Number(item.price).toFixed(2)}</span>
                    </div>
                    <div className="mt-3">
                      <button
                        className={`btn-primary w-full transition-all duration-150 ${justAdded ? 'scale-95 opacity-75' : ''}`}
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        {inCart.quantity > 0 ? `Add another${item.options?.length ? ' / change extras' : ''}` : 'Add to basket'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {/* ── Basket pill — mobile only ── */}
      {cart.length > 0 && !basketOpen && (
        <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 md:hidden">
          <button
            className="pop-in flex items-center gap-3 rounded-full bg-gradient-to-r from-[#F5B800] to-[#d97706] px-5 py-3 text-sm font-bold text-stone-900 shadow-2xl shadow-yellow-500/40 transition hover:shadow-yellow-500/60 active:scale-95"
            onClick={() => setBasketOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">£{cartTotal.toFixed(2)}</span>
            <ChevronUp className="h-4 w-4 opacity-70" />
          </button>
        </div>
      )}

      {/* ── Basket bottom sheet — mobile only ── */}
      {basketOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setBasketOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[80vh] flex-col rounded-t-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">Your basket</p>
                <h3 className="text-lg font-extrabold text-slate-900">{cartCount} item{cartCount !== 1 ? 's' : ''} · £{cartTotal.toFixed(2)}</h3>
              </div>
              <button
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                onClick={() => setBasketOpen(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 px-5 pb-3">
              {cart.map((item) => (
                <div key={item.cartKey} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                    {item.selectedOptions?.length > 0 && (
                      <p className="truncate text-xs text-brand-600">{item.selectedOptions.map((o) => o.name).join(', ')}</p>
                    )}
                    <p className="text-xs text-slate-500">£{Number(item.basePrice).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-90 transition"
                      onClick={() => amendCartItem(item.cartKey, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-5 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 active:scale-90 transition"
                      onClick={() => amendCartItem(item.cartKey, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="w-14 text-right text-sm font-bold text-slate-800">£{item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-900">£{cartTotal.toFixed(2)}</span>
              </div>
              <button
                className="btn-primary w-full !py-3 text-base"
                disabled={routeChoice.orderType === 'route' && !routeChoice.stopId}
                onClick={() => { setBasketOpen(false); setCheckoutOpen(true); }}
              >
                Checkout · £{cartTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sticky basket ── */}
      {cart.length > 0 && (
        <section className="card hidden sticky bottom-4 space-y-3 border border-white/60 !bg-white/95 shadow-xl shadow-slate-200/60 md:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">Basket</p>
              <h3 className="text-lg font-extrabold text-slate-900">{cartCount} item{cartCount !== 1 ? 's' : ''}</h3>
            </div>
            <ShoppingCart className="h-5 w-5 text-brand-500" />
          </div>
          <div className="space-y-1.5">
            {cart.map((item) => (
              <div key={item.cartKey} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <span className="truncate text-sm font-medium text-slate-700">{item.name}</span>
                  {item.selectedOptions?.length > 0 && (
                    <p className="truncate text-xs text-brand-600">{item.selectedOptions.map((o) => o.name).join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
                  <button className="flex h-6 w-6 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition" onClick={() => amendCartItem(item.cartKey, -1)}><Minus className="h-3 w-3" /></button>
                  <span className="min-w-5 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                  <button className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700 transition" onClick={() => amendCartItem(item.cartKey, 1)}><Plus className="h-3 w-3" /></button>
                </div>
                <span className="text-sm font-bold text-slate-800">£{item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <button
            className="btn-primary w-full !py-3"
            disabled={!cart.length || (routeChoice.orderType === 'route' && !routeChoice.stopId)}
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout · £{cartTotal.toFixed(2)}
          </button>
        </section>
      )}

      {/* ── Extras picker modal ── */}
      {pickerItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" onClick={() => setPickerItem(null)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">Customise</p>
              <h3 className="mt-0.5 text-xl font-extrabold text-slate-900">{pickerItem.name}</h3>
              {pickerItem.description && <p className="mt-1 text-sm text-slate-500">{pickerItem.description}</p>}
              <p className="mt-1 text-base font-bold text-slate-900">£{Number(pickerItem.price).toFixed(2)}</p>
            </div>

            <p className="mb-2 text-sm font-semibold text-slate-700">Extras / add-ons</p>
            <div className="space-y-2">
              {pickerItem.options.map((option) => {
                const selected = pickerSelected.find((o) => o.name === option.name);
                return (
                  <button
                    key={option.name}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-400/40'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                    onClick={() => togglePickerOption(option)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-black transition ${
                        selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                      }`}>{selected ? '✓' : ''}</span>
                      {option.name}
                    </div>
                    <span className={selected ? 'text-brand-600' : 'text-slate-400'}>
                      {option.price > 0 ? `+£${Number(option.price).toFixed(2)}` : 'Free'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setPickerItem(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={confirmPicker}>
                Add · £{(Number(pickerItem.price) + pickerSelected.reduce((s, o) => s + Number(o.price || 0), 0)).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setBasketOpen(false);
        }}
        summary={summary}
        customer={user}
        onComplete={() => {
          setCart([]);
          setBasketOpen(false);
        }}
      />
    </div>
  );
}
