import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function RoutePage({ user }) {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (!user || !['owner', 'driver'].includes(user.role)) {
      return;
    }
    api.get('/routes').then((response) => setRoutes(response.data));
  }, [user?.id]);

  if (!user || !['owner', 'driver'].includes(user.role)) {
    return <div className="card"><p className="text-sm text-slate-500">Route controls are available to owner and driver roles.</p></div>;
  }

  return (
    <div className="space-y-5 fade-in-up">
      <section className="card border border-white/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600">Live operations</p>
            <h2 className="section-title">Route status board</h2>
          </div>
          <div className="soft-panel text-sm text-slate-600">
            Monitor active stops and service windows in real time.
          </div>
        </div>
      </section>
      {routes.map((route) => (
        <section key={route.id} className="card border border-white/70 stagger-item">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-600">Route status</p>
              <h2 className="section-title">{route.name}</h2>
            </div>
            <div className={`rounded-full px-3 py-1 text-sm font-semibold ${route.isLive ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
              {route.isLive ? `Active until ${new Date(route.activeUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Inactive'}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {route.stops.map((stop, index) => (
              <div key={stop.id} className={`stagger-item rounded-2xl border p-4 ${stop.isActive ? 'border-emerald-300 bg-emerald-50/80' : 'border-slate-200 bg-white/85'}`} style={{ '--delay': `${index * 40}ms` }}>
                <h3 className="font-semibold">{stop.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Window {stop.startsAt || 'Flexible'} · {stop.durationMinutes} mins</p>
                {stop.isActive ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Serving now</p> : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
