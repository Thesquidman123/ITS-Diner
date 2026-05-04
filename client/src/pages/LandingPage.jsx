import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LogoBadge from '../components/LogoBadge';

function CountUp({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

function Checkerboard() {
  return (
    <div className="flex h-5 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className={`h-5 w-5 shrink-0 ${i % 2 === 0 ? 'bg-[#F5B800]' : 'bg-[#1a1a1a]'}`} />
      ))}
    </div>
  );
}

function SpeedLines({ color = '#F5B800' }) {
  return (
    <div className="flex items-center gap-1">
      {[14, 22, 14].map((w, i) => (
        <div key={i} style={{ width: w, height: 3, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#111', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sticky Nav ── */}
      <nav
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? 'rgba(17,17,17,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.5)' : 'none' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {!imgError ? (
              <img src="/logo.png" alt="ITS Diner" className="h-12 w-auto drop-shadow-lg" onError={() => setImgError(true)} />
            ) : (
              <LogoBadge size={48} />
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: '#F5B800', textTransform: 'uppercase', lineHeight: 1 }}>Retro</p>
              <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1 }}>ITS Diner</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }} className="transition hover:text-white">Sign in</Link>
            <Link
              to="/customer"
              style={{ background: '#F5B800', color: '#111', fontWeight: 900, fontSize: 14, borderRadius: 999, padding: '8px 20px', boxShadow: '0 4px 20px rgba(245,184,0,0.4)' }}
              className="transition-all hover:brightness-110 active:scale-95"
            >
              Order Now
            </Link>
          </div>
        </div>
        <Checkerboard />
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-16"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(245,184,0,0.18) 0%, transparent 65%), radial-gradient(ellipse at 20% 80%, rgba(245,184,0,0.1) 0%, transparent 60%), #111' }}>

        {/* Diagonal stripe background accent */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F5B800 0px, #F5B800 2px, transparent 2px, transparent 24px)' }} />

        <div className="relative z-10 mx-auto max-w-5xl text-center">

          {/* Logo */}
          <div className="mb-8 flex justify-center">
            {!imgError ? (
              <img
                src="/logo.png"
                alt="ITS Diner"
                className="w-56 drop-shadow-2xl sm:w-72 md:w-80 transition-transform hover:scale-105 duration-300"
                style={{ filter: 'drop-shadow(0 0 40px rgba(245,184,0,0.4))' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <LogoBadge size={260} className="drop-shadow-2xl" />
            )}
          </div>

          {/* Live badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
            style={{ border: '1.5px solid rgba(245,184,0,0.4)', background: 'rgba(245,184,0,0.1)', color: '#F5B800' }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: '#F5B800' }} />
            Now Open · Order in minutes
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 9vw, 6.5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>
            <span style={{ display: 'block', color: '#fff' }}>Real Food.</span>
            <span style={{ display: 'block', background: 'linear-gradient(90deg, #F5B800, #FFD84D, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real Fast.
            </span>
          </h1>

          <p style={{ maxWidth: 520, margin: '1.5rem auto 0', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.58)' }}>
            ITS Diner brings you freshly made burgers, loaded fries and more — straight from the van, straight to you.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/customer"
              style={{ background: '#F5B800', color: '#111', fontWeight: 900, fontSize: 18, borderRadius: 16, padding: '14px 36px', boxShadow: '0 8px 40px rgba(245,184,0,0.45)', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              className="transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95"
            >
              🍔 Start Your Order
            </Link>
            <Link
              to="/auth"
              style={{ border: '2px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 16, padding: '14px 36px' }}
              className="transition-all hover:border-white/40 hover:bg-white/5"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div style={{ width: 20, height: 32, borderRadius: 999, border: '2px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <div style={{ width: 2, height: 8, borderRadius: 2, background: '#F5B800' }} className="animate-ping" />
          </div>
        </div>
      </section>

      {/* ── Checkerboard divider ── */}
      <Checkerboard />

      {/* ── Stats Strip ── */}
      <section style={{ background: '#1a1a1a', padding: '40px 20px' }}>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { value: 2500, suffix: '+', label: 'Orders served' },
            { value: 98, suffix: '%', label: 'Happy customers' },
            { value: 12, suffix: ' min', label: 'Avg wait time' },
            { value: 15, suffix: '+', label: 'Menu items' },
          ].map(({ value, suffix, label }) => (
            <div key={label}>
              <p style={{ fontSize: 40, fontWeight: 900, color: '#F5B800', margin: 0 }}>
                <CountUp target={value} suffix={suffix} />
              </p>
              <p style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <Checkerboard />

      {/* ── Features ── */}
      <section style={{ padding: '80px 20px', background: '#111' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <SpeedLines />
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.3em', color: '#F5B800', textTransform: 'uppercase' }}>Why ITS Diner?</p>
              <SpeedLines />
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', margin: 0 }}>
              Built for people who love{' '}
              <span style={{ color: '#F5B800' }}>great food</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '⚡', title: 'Order in 30 seconds', desc: 'Tap, customise, checkout. No queues, no hassle. Your order goes straight to the kitchen.' },
              { icon: '🧾', title: 'Pay your way', desc: "Card, approved credit tab, or guest checkout. We've got an option for everyone." },
              { icon: '☕', title: 'Loyalty rewards', desc: 'Collect a stamp with every order. Hit 9 stamps and score a free item — on us.' },
              { icon: '🎟', title: 'Exclusive promo codes', desc: 'Watch for discount codes, BOGO deals and special offers — real savings on real food.' },
              { icon: '📍', title: 'Find us anywhere', desc: "Get area alerts when the van is near you. Subscribe to locations and we'll notify you." },
              { icon: '🕐', title: 'Schedule ahead', desc: "Know you want lunch at noon? Schedule your order in advance and it'll be ready when you arrive." },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{ background: '#1a1a1a', border: '1.5px solid rgba(245,184,0,0.15)', borderRadius: 20, padding: '24px', transition: 'all 0.2s' }}
                className="group hover:-translate-y-1 hover:border-[#F5B800]/40 hover:shadow-2xl"
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Checkerboard />

      {/* ── How it works ── */}
      <section style={{ padding: '80px 20px', background: '#1a1a1a' }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <SpeedLines />
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.3em', color: '#F5B800', textTransform: 'uppercase' }}>Simple as that</p>
              <SpeedLines />
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', margin: 0 }}>Three steps to great food</h2>
          </div>

          <div className="space-y-8">
            {[
              { num: '01', icon: '🍔', title: 'Choose your food', desc: 'Browse the menu, customise with extras like cheese or bacon, and build your perfect meal.' },
              { num: '02', icon: '💳', title: 'Checkout in seconds', desc: 'Pay by card or tab. Apply a promo code for instant savings. Done in under a minute.' },
              { num: '03', icon: '🎉', title: 'Collect & enjoy', desc: "Show your 3-digit reference code at the van window and collect your fresh order. That's it!" },
            ].map(({ num, icon, title, desc }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: '#111', borderRadius: 20, padding: 24, border: '1.5px solid rgba(245,184,0,0.12)' }}>
                <div style={{ width: 60, height: 60, minWidth: 60, borderRadius: 16, background: '#F5B800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 4px 24px rgba(245,184,0,0.35)' }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(245,184,0,0.5)', textTransform: 'uppercase', margin: '0 0 4px' }}>{num}</p>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Checkerboard />

      {/* ── Final CTA ── */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: 'radial-gradient(ellipse at center, rgba(245,184,0,0.2) 0%, transparent 70%), #111', position: 'relative', overflow: 'hidden' }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F5B800 0px, #F5B800 2px, transparent 2px, transparent 24px)' }} />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            {!imgError ? (
              <img src="/logo.png" alt="ITS Diner" className="w-36 opacity-90" onError={() => setImgError(true)} />
            ) : (
              <LogoBadge size={130} />
            )}
          </div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff', margin: '0 0 12px' }}>
            Hungry?<br />
            <span style={{ color: '#F5B800' }}>Let's fix that.</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join hundreds of happy customers. Order now, earn stamps, and enjoy the best food on wheels.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/customer"
              style={{ background: '#F5B800', color: '#111', fontWeight: 900, fontSize: 20, borderRadius: 16, padding: '16px 44px', boxShadow: '0 8px 48px rgba(245,184,0,0.5)' }}
              className="transition-all hover:brightness-110 hover:scale-105"
            >
              Order Now →
            </Link>
            <Link
              to="/auth"
              style={{ border: '2px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 20, borderRadius: 16, padding: '16px 44px' }}
              className="transition-all hover:border-white/40 hover:bg-white/5"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Checkerboard />
      <footer style={{ background: '#0d0d0d', padding: '32px 20px' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            {!imgError ? (
              <img src="/logo.png" alt="ITS Diner" className="h-10 w-auto" onError={() => setImgError(true)} />
            ) : (
              <LogoBadge size={40} />
            )}
            <span style={{ fontWeight: 900, color: '#fff', fontSize: 16 }}>ITS <span style={{ color: '#F5B800' }}>Diner</span></span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} ITS Diner. Real food, real fast.</p>
          <div className="flex gap-5">
            <Link to="/customer" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }} className="transition hover:text-white">Order</Link>
            <Link to="/auth" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }} className="transition hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
