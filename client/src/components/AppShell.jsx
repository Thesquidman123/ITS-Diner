import { Bell, CreditCard, LogOut, MapPinned, MenuSquare, Moon, ShoppingBag, Sun, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoBadge from './LogoBadge';

function ImgWithFallback() {
  const [err, setErr] = useState(false);
  if (err) return <LogoBadge size={36} />;
  return <img src="/logo.png" alt="ITS Diner" className="h-9 w-auto" onError={() => setErr(true)} />;
}

export default function AppShell({ title, user, onLogout, notifications = [], children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme-preference') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = !user
    ? [
        { to: '/customer', label: 'Order', icon: ShoppingBag },
        { to: '/account', label: 'Account', icon: Bell },
        { to: '/auth', label: 'Sign in', icon: UserRound }
      ]
    : user.role === 'owner'
      ? [
          { to: '/owner', label: 'Owner', icon: MenuSquare },
          { to: '/route', label: 'Route', icon: MapPinned },
          { to: '/account', label: 'Account', icon: Bell }
        ]
      : user.role === 'driver' || user.role === 'staff'
        ? [
            { to: '/van', label: 'Van', icon: MenuSquare },
            { to: '/route', label: 'Route', icon: MapPinned },
            { to: '/account', label: 'Account', icon: Bell }
          ]
        : [
            { to: '/customer', label: 'Order', icon: ShoppingBag },
            ...(user.creditEnabled ? [{ to: '/credit', label: 'Tab', icon: CreditCard }] : []),
            { to: '/account', label: 'Account', icon: Bell }
          ];

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-10 border-b border-white/50 bg-white/70 backdrop-blur-xl fade-in">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <ImgWithFallback />
            <div>
              <div className="chip mb-0.5 inline-flex" style={{ background: '#F5B800', color: '#111', fontWeight: 800 }}>ITS Diner</div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary !rounded-full !px-3" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <div className="hidden rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-sm text-slate-600 sm:block">
              {user ? `${user.name} · ${user.role}` : 'Guest'}
            </div>
            {user ? (
              <button className="btn-secondary !rounded-full !px-3" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <Link className="btn-secondary !rounded-full !px-3" to="/auth">
                <UserRound className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
        <div className="mx-auto hidden max-w-6xl items-center justify-between px-4 pb-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 p-1 backdrop-blur">
            {navItems.map((item) => {
              const active = isActivePath(item.to);
              const Icon = item.icon;
              return (
                <Link key={item.to} className={`nav-pill ${active ? 'nav-pill-active' : 'hover:bg-slate-100'}`} to={item.to}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="text-sm text-slate-500">
            {user ? `Signed in as ${user.role}` : 'Browse as guest'}
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 fade-in-up">{children}</main>
      <nav className="sticky bottom-0 z-10 grid border-t border-white/70 bg-white/85 p-2 text-xs text-slate-600 backdrop-blur-xl md:hidden" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const active = isActivePath(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 transition-all duration-200 ${active ? 'bg-yellow-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:-translate-y-0.5 hover:bg-slate-100/80'}`}
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
