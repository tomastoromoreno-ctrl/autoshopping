'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
  payment_method?: string;
  shipping_address?: string;
}

const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-indigo-600 bg-indigo-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    api.get<{ data: Order[] }>('/orders').then((res) => setOrders(res.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Órdenes</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>
            {s === 'all' ? 'Todas' : s}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="rounded-xl border bg-white shadow-sm">
            <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left">
              <div className="flex flex-1 flex-wrap items-center gap-4">
                <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
                <span className="font-medium text-slate-900">{order.customer_name}</span>
                <span className="font-semibold text-slate-900">${order.total.toLocaleString()}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || 'text-slate-600 bg-slate-50'}`}>{order.status}</span>
                <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <svg className={`h-5 w-5 text-slate-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === order.id && (
              <div className="border-t px-5 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Productos</h4>
                    {order.items && order.items.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between text-sm text-slate-600">
                            <span>{item.product_name} x{item.quantity}</span>
                            <span>${(item.price * item.quantity).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">Sin detalles</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Información</h4>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {order.payment_method && <p>Pago: {order.payment_method}</p>}
                      <p>Email: {order.customer_email}</p>
                      {order.shipping_address && <p>Dirección: {order.shipping_address}</p>}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-500">Actualizar estado</label>
                      <select onChange={(e) => handleStatusUpdate(order.id, e.target.value)} value={order.status}
                        className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-primary">
                        {statuses.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-400">No hay órdenes</div>
        )}
      </div>
    </div>
  );
}
