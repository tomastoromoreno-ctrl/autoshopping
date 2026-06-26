'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '@/lib/api';

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  uniqueCustomers: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#6366f1', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};

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

  const statCards = [
    { label: 'Ingresos', value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, change: '+18%', up: true, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Pedidos', value: analytics?.totalOrders || 0, icon: ShoppingCart, change: '+12%', up: true, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Clientes', value: analytics?.uniqueCustomers || 0, icon: Users, change: '+24%', up: true, gradient: 'from-indigo-500 to-indigo-600' },
    { label: 'Ticket Promedio', value: `$${analytics?.totalOrders ? Math.round((analytics.totalRevenue || 0) / analytics.totalOrders).toLocaleString() : 0}`, icon: TrendingUp, change: '+5%', up: true, gradient: 'from-purple-500 to-purple-600' },
  ];

  const statusData = Object.entries(analytics?.ordersByStatus || {}).map(([name, value]) => ({ name: statusLabels[name] || name, value }));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500">Métricas de rendimiento de tu tienda</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-600 bg-white shadow-sm">
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
        </select>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }} whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm cursor-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}><Icon className="h-4 w-4" /></div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${card.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{card.change}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue line chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Ingresos por día</h2>
          <p className="text-xs text-slate-400 mb-4">Evolución de ingresos en el período seleccionado</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.revenueByDay || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [`$${(value ?? 0).toLocaleString()}`, 'Ingresos']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
            {(!analytics?.revenueByDay || analytics.revenueByDay.length === 0) && (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">Sin datos de ingresos</div>
            )}
          </div>
        </motion.div>

        {/* Orders by status pie chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Pedidos por estado</h2>
          <p className="text-xs text-slate-400 mb-4">Distribución de pedidos según su estado actual</p>
          <div className="h-72 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={statusColors[entry.name.toLowerCase()] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">Sin datos de pedidos</p>
            )}
          </div>
        </motion.div>

        {/* Top products bar chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Productos más vendidos</h2>
          <p className="text-xs text-slate-400 mb-4">Top productos por cantidad vendida</p>
          {(analytics?.topProducts && analytics.topProducts.length > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={180} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    formatter={(value: any) => [value ?? 0, 'Vendidos']} />
                  <Bar dataKey="quantity" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">Sin datos de productos</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
