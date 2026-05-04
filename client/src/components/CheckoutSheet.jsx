import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import api from '../lib/api';

function OrderConfirmation({ order, onClose }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Order confirmed!</p>
        <div className="mt-2 rounded-2xl bg-slate-900 px-6 py-3">
          <p className="text-xs text-slate-400">Your pickup reference</p>
          <p className="font-mono text-4xl font-black tracking-widest text-white">#{order.ref}</p>
        </div>
        <p className="mt-3 text-sm text-slate-500">Show this number when collecting your order.</p>
      {(order.confirmationEmail) && (
        <p className="text-xs text-slate-400">Confirmation sent to <strong>{order.confirmationEmail}</strong></p>
      )}
      </div>
      {order.scheduledFor && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
          <Clock className="h-4 w-4" />
          Scheduled for {new Date(order.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Total</span>
          <strong>£{Number(order.total).toFixed(2)}</strong>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-slate-500">Payment</span>
          <span className="capitalize">{order.paymentType === 'guest' ? 'Card (guest)' : order.paymentType}</span>
        </div>
      </div>
      <button className="btn-primary w-full" onClick={onClose}>Done</button>
    </div>
  );
}

function CardCheckoutForm({ clientSecret, onSuccess, amountLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });
    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setSubmitting(false);
      return;
    }
    onSuccess(result.paymentIntent?.id || 'payment-success');
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <PaymentElement />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={submitting || !stripe || !elements}>
        {submitting ? 'Processing...' : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}

export default function CheckoutSheet({ open, onClose, summary, customer, onComplete }) {
  const [mode, setMode] = useState('card');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoState, setPromoState] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [stripeState, setStripeState] = useState({ loading: false, ready: false, clientSecret: '', publishableKey: '', stripeEnabled: false, error: '' });
  const [creditBusy, setCreditBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmedOrder(null);
      setGuestName('');
      setGuestEmail('');
      setScheduled(false);
      setScheduledFor('');
      setPromoInput('');
      setPromoState(null);
      setPromoError('');
    }
  }, [open]);

  const stripePromise = useMemo(() => {
    if (!stripeState.publishableKey) {
      return null;
    }
    return loadStripe(stripeState.publishableKey);
  }, [stripeState.publishableKey]);

  useEffect(() => {
    if (!open || mode !== 'card' || !summary.total) {
      return;
    }
    setStripeState((current) => ({ ...current, loading: true, error: '' }));
    api.post('/payments/intent', {
      amount: Math.round(summary.total * 100),
      metadata: { checkout: 'food-van' }
    }).then((response) => {
      setStripeState({
        loading: false,
        ready: true,
        clientSecret: response.data.clientSecret,
        publishableKey: response.data.publishableKey,
        stripeEnabled: response.data.stripeEnabled,
        error: ''
      });
    }).catch((error) => {
      setStripeState({ loading: false, ready: false, clientSecret: '', publishableKey: '', stripeEnabled: false, error: error.response?.data?.message || 'Unable to set up payment' });
    });
  }, [open, mode, summary.total]);

  if (!open) {
    return null;
  }

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoError('');
    setPromoState(null);
    try {
      const res = await api.post('/promotions/validate', { code: promoInput.trim(), orderTotal: summary.total });
      setPromoState(res.data);
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code');
    } finally {
      setPromoChecking(false);
    }
  };

  const discountedTotal = promoState ? Math.max(0, summary.total - promoState.discount) : summary.total;

  const createOrder = async (paymentType, paymentStatus) => {
    const payload = {
      items: summary.items,
      paymentType,
      paymentStatus,
      type: summary.orderType,
      routeId: summary.routeId,
      stopId: summary.stopId,
      guestName: customer ? customer.name : guestName || 'Guest',
      guestEmail: customer ? null : (guestEmail.trim() || null),
      scheduledFor: scheduled && scheduledFor ? new Date(scheduledFor).toISOString() : null,
      promoCode: promoState ? promoState.promo.code : null
    };
    const response = await api.post('/orders', payload);
    setConfirmedOrder(response.data);
    onComplete(response.data);
  };

  const completeCredit = async () => {
    setCreditBusy(true);
    try {
      await createOrder('credit', 'approved');
    } finally {
      setCreditBusy(false);
    }
  };

  const completeMockCard = async () => {
    await createOrder('card', 'paid');
  };

  const minScheduledTime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return d.toISOString().slice(0, 16);
  })();

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-slate-950/45 backdrop-blur-sm fade-in md:items-center md:justify-center">
      <div className="w-full max-w-lg rounded-t-3xl border border-white/70 bg-white/95 p-5 shadow-2xl pop-in md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600">Checkout</p>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              {confirmedOrder ? 'Order placed!' : 'Complete your order'}
            </h3>
          </div>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <OrderConfirmation order={confirmedOrder} onClose={onClose} />
        ) : (
          <>
            {!customer ? (
              <div className="mb-4 space-y-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Your name (for collection)</label>
                  <input
                    className="input"
                    placeholder="e.g. John Smith"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Email for confirmation <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Used only to send your order confirmation. Not stored beyond fulfilment. <a href="/privacy" target="_blank" className="underline hover:text-slate-600">Privacy policy</a>.</p>
                </div>
              </div>
            ) : (
              customer.email && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
                  <span>📧</span>
                  <span>Confirmation will be sent to <strong className="text-slate-700">{customer.email}</strong></span>
                </div>
              )
            )}

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Schedule for later</span>
                </div>
                <button
                  type="button"
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${scheduled ? 'bg-brand-600' : 'bg-slate-200'}`}
                  onClick={() => setScheduled((s) => !s)}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${scheduled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {scheduled && (
                <input
                  type="datetime-local"
                  className="input mt-2"
                  min={minScheduledTime}
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  required={scheduled}
                />
              )}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 text-sm">
              <button className={`rounded-xl px-3 py-2 font-semibold transition-all duration-200 ${mode === 'card' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70'}`} onClick={() => setMode('card')}>Pay by card</button>
              <button className={`rounded-xl px-3 py-2 font-semibold transition-all duration-200 ${mode === 'credit' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70 disabled:opacity-40'}`} onClick={() => setMode('credit')} disabled={!customer?.creditEnabled}>Add to tab</button>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1 !py-2 !text-sm"
                  placeholder="Promo code (optional)"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoState(null); setPromoError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                />
                <button type="button" className="btn-secondary !py-2 !text-xs whitespace-nowrap" onClick={applyPromo} disabled={promoChecking}>
                  {promoChecking ? '…' : 'Apply'}
                </button>
              </div>
              {promoError && <p className="mt-1.5 text-xs text-red-600">{promoError}</p>}
              {promoState && (
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <span>✓ {promoState.promo.name}</span>
                  <span className="ml-auto">-£{promoState.discount.toFixed(2)}</span>
                  <button type="button" className="text-slate-400 hover:text-red-500" onClick={() => { setPromoState(null); setPromoInput(''); }}>✕</button>
                </div>
              )}
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>£{summary.total.toFixed(2)}</span></div>
              {promoState && <div className="mt-1 flex justify-between text-emerald-600"><span>Discount ({promoState.promo.code})</span><span>-£{promoState.discount.toFixed(2)}</span></div>}
              <div className="mt-1 flex justify-between font-bold"><span>Total</span><strong className="text-slate-900">£{discountedTotal.toFixed(2)}</strong></div>
              <div className="mt-2 flex justify-between"><span>Order type</span><span className="capitalize">{summary.orderType}</span></div>
              {customer?.creditEnabled && (
                <div className="mt-2 flex justify-between"><span>Tab balance</span><span>£{Number(customer.balance || 0).toFixed(2)} / £{Number(customer.creditLimit || 0).toFixed(2)}</span></div>
              )}
            </div>

            {mode === 'credit' ? (
              <div className="space-y-3">
                {!customer?.creditEnabled ? <p className="text-sm text-red-600">Credit is not enabled for this account.</p> : null}
                <button className="btn-primary w-full" disabled={!customer?.creditEnabled || creditBusy} onClick={completeCredit}>
                  {creditBusy ? 'Adding to tab...' : 'Confirm and add to tab'}
                </button>
              </div>
            ) : stripeState.loading ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Preparing secure payment...</p>
            ) : stripeState.error ? (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50/70 p-3">
                <p className="text-sm text-red-600">{stripeState.error}</p>
                <button className="btn-primary w-full" onClick={completeMockCard}>Use local test checkout</button>
              </div>
            ) : stripeState.stripeEnabled && stripeState.clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: stripeState.clientSecret }}>
                <CardCheckoutForm clientSecret={stripeState.clientSecret} onSuccess={() => createOrder('card', 'paid')} amountLabel={`£${summary.total.toFixed(2)}`} />
              </Elements>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-sm text-slate-500">Stripe keys are not configured — local test checkout is active.</p>
                <button className="btn-primary w-full" onClick={completeMockCard}>Complete test payment</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
