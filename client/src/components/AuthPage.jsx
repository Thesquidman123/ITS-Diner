import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      let signedInUser;
      if (mode === 'login') {
        signedInUser = await login(form.email, form.password);
      } else {
        signedInUser = await signup(form);
      }
      const destination = signedInUser?.role === 'owner'
        ? '/owner'
        : signedInUser?.role === 'driver' || signedInUser?.role === 'staff'
          ? '/van'
          : '/customer';
      navigate(destination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to continue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center">
      <div className="grid w-full gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="card fade-in-up border border-white/70 bg-gradient-to-br from-stone-900 to-stone-800 text-white">
          <p className="chip mb-3 inline-flex !border-yellow-400/40 !bg-yellow-400/20 !text-yellow-300">ITS Diner</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Fast sign in, faster ordering</h2>
          <p className="mt-3 text-sm text-white/90">Access owner, staff, driver, or customer tools with one account flow designed for mobile speed.</p>
          <div className="mt-5 space-y-2 text-sm text-white/90">
            <p>Demo password for all seeded users:</p>
            <p className="rounded-xl border border-white/30 bg-white/15 px-3 py-2 font-semibold tracking-wide">Password123!</p>
          </div>
        </section>

        <form className="card pop-in w-full space-y-4 border border-white/70" onSubmit={submit}>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">Account</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="mt-1 text-sm text-slate-500">{mode === 'login' ? 'Sign in to continue to your dashboard.' : 'Set up your profile in under a minute.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-1 text-sm">
          <button className={`rounded-xl px-3 py-2 font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70'}`} type="button" onClick={() => setMode('login')}>Sign in</button>
          <button className={`rounded-xl px-3 py-2 font-semibold transition ${mode === 'signup' ? 'bg-white text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70'}`} type="button" onClick={() => setMode('signup')}>Create account</button>
        </div>
        {mode === 'signup' && (
          <input className="input" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        )}
        {mode === 'signup' && (
          <input className="input" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        )}
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">{mode === 'login' ? 'New here? Switch to Create account.' : 'Already registered? Switch to Sign in.'}</p>
      </form>
      </div>
    </div>
  );
}
