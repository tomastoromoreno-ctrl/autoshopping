'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: any[];
  outOfStockProducts: any[];
  recentMovements: any[];
  activeAlerts: number;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  purchase: { label: 'Compra', color: 'bg-green-100 text-green-700' },
  sale: { label: 'Venta', color: 'bg-blue-100 text-blue-700' },
  adjustment: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-700' },
  return: { label: 'Devolución', color: 'bg-purple-100 text-purple-700' },
  transfer: { label: 'Transferencia', color: 'bg-indigo-100 text-indigo-700' },
  damage: { label: 'Daño', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Vencido', color: 'bg-orange-100 text-orange-700' },
};

export default function InventoryDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/inventory/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return <div className="py-10 text-center text-slate-500">Error al cargar inventario</div>;

  const stats = [
    { label: 'Productos', value: data.totalProducts, icon: '📦', bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Stock Total', value: data.totalStock.toLocaleString('es-CL'), icon: '📊', bg: 'bg-green-50', color: 'text-green-600' },
    { label: 'Stock Bajo', value: data.lowStockCount, icon: '⚠️', bg: 'bg-yellow-50', color: 'text-yellow-600' },
    { label: 'Sin Stock', value: data.outOfStockCount, icon: '🚫', bg: 'bg-red-50', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/inventory/stock" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Ver Stock
          </Link>
          <Link href="/dashboard/inventory/movements" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Movimientos
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-slate-100 p-5 ${stat.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Stock Bajo</h2>
            <Link href="/dashboard/inventory/stock?status=low_stock" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No hay productos con stock bajo</p>
          ) : (
            <div className="space-y-3">
              {data.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-50 p-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img src={p.images?.[0] || '/placeholder.svg'} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sku || 'Sin SKU'}</p>
                  </div>
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                    {p.stock} uds
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Movimientos Recientes</h2>
            <Link href="/dashboard/inventory/movements" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {data.recentMovements.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No hay movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {data.recentMovements.slice(0, 6).map((m: any) => {
                const typeInfo = typeLabels[m.type] || { label: m.type, color: 'bg-slate-100 text-slate-700' };
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-50 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{m.product?.name || 'Producto'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(m.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className={`text-sm font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/inventory/suppliers" className="rounded-xl border border-slate-100 bg-white p-5 transition-colors hover:bg-slate-50">
          <span className="text-2xl">🏭</span>
          <h3 className="mt-2 font-semibold">Proveedores</h3>
          <p className="text-sm text-slate-500">Gestionar contactos de proveedores</p>
        </Link>
        <Link href="/dashboard/inventory/purchase-orders" className="rounded-xl border border-slate-100 bg-white p-5 transition-colors hover:bg-slate-50">
          <span className="text-2xl">📋</span>
          <h3 className="mt-2 font-semibold">Órdenes de Compra</h3>
          <p className="text-sm text-slate-500">Crear y gestionar compras</p>
        </Link>
        <Link href="/dashboard/inventory/stock?status=out_of_stock" className="rounded-xl border border-slate-100 bg-white p-5 transition-colors hover:bg-slate-50">
          <span className="text-2xl">🔔</span>
          <h3 className="mt-2 font-semibold">Alertas</h3>
          <p className="text-sm text-slate-500">{data.activeAlerts} alertas activas</p>
        </Link>
      </div>
    </div>
  );
}
