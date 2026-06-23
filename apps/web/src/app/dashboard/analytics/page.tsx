'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  uniqueCustomers: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<any>(`/dashboard/analytics?days=${days}`).then(setAnalytics).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  const maxRevenue = Math.max(...(analytics?.revenueByDay || []).map((r) => r.revenue), 1);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Analytics</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ingresos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">${(analytics?.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pedidos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{analytics?.totalOrders || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Clientes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{analytics?.uniqueCustomers || 0}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Ingresos por día</h2>
          <div className="mt-4 flex items-end gap-1 h-40">
            {(analytics?.revenueByDay || []).slice(-14).map((day) => (
              <div key={day.date} className="flex flex-col items-center flex-1">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: 4 }} />
                <span className="mt-1 text-[9px] text-slate-400 truncate w-full text-center">{day.date.slice(5)}</span>
              </div>
            ))}
            {(!analytics?.revenueByDay || analytics.revenueByDay.length === 0) && (
              <p className="text-sm text-slate-400">Sin datos de ingresos</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Pedidos por estado</h2>
          <div className="mt-4 space-y-3">
            {analytics?.ordersByStatus && Object.entries(analytics.ordersByStatus).map(([status, count]) => {
              const total = Object.values(analytics.ordersByStatus).reduce((a, b) => a + b, 0);
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
                    <span className="text-slate-500">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!analytics?.ordersByStatus || Object.keys(analytics.ordersByStatus).length === 0) && (
              <p className="text-sm text-slate-400">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Productos más vendidos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium text-right">Vendidos</th>
                <th className="pb-2 font-medium text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.topProducts || []).map((p, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2 font-medium text-slate-900">{p.name}</td>
                  <td className="py-2 text-right text-slate-600">{p.quantity}</td>
                  <td className="py-2 text-right font-medium text-slate-900">${p.revenue.toLocaleString()}</td>
                </tr>
              ))}
              {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
