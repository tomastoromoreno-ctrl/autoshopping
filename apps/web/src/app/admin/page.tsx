'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  tenantsByStatus: Record<string, number>;
  recentOrders: {
    id: string;
    tenant_name: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminStats>('/admin/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Tiendas', value: stats?.totalTenants ?? 0, color: 'bg-blue-500' },
    { label: 'Tiendas Activas', value: stats?.activeTenants ?? 0, color: 'bg-green-500' },
    { label: 'Total Usuarios', value: stats?.totalUsers ?? 0, color: 'bg-purple-500' },
    { label: 'Total Órdenes', value: stats?.totalOrders ?? 0, color: 'bg-orange-500' },
    { label: 'Ingresos Totales', value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, color: 'bg-teal-500' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    confirmed: 'text-blue-600 bg-blue-50',
    processing: 'text-indigo-600 bg-indigo-50',
    shipped: 'text-purple-600 bg-purple-50',
    delivered: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Panel de Administración</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Órdenes por estado</h2>
          <div className="mt-4 space-y-3">
            {stats?.ordersByStatus && Object.entries(stats.ordersByStatus).map(([status, count]) => {
              const total = Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0);
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-slate-700">{status}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!stats?.ordersByStatus || Object.keys(stats.ordersByStatus).length === 0) && (
              <p className="text-sm text-slate-400">Sin datos</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tiendas por estado</h2>
          <div className="mt-4 space-y-3">
            {stats?.tenantsByStatus && Object.entries(stats.tenantsByStatus).map(([status, count]) => {
              const total = Object.values(stats.tenantsByStatus).reduce((a, b) => a + b, 0);
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-slate-700">{status}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${status === 'active' ? 'bg-green-500' : status === 'suspended' ? 'bg-red-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!stats?.tenantsByStatus || Object.keys(stats.tenantsByStatus).length === 0) && (
              <p className="text-sm text-slate-400">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Órdenes recientes</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders ?? []).map((order) => (
                <tr key={order.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-900">{order.tenant_name}</td>
                  <td className="px-4 py-3 text-slate-900">{order.customer_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">${order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || 'text-slate-600 bg-slate-50'}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay órdenes recientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
