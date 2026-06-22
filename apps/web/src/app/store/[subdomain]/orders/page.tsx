'use client';

import { useState } from 'react';
import { Search, Package, Clock, ChevronRight } from 'lucide-react';

interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items?: OrderItem[];
  payment_status?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage({ params }: { params: { subdomain: string } }) {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`${apiUrl}/orders/${params.subdomain}?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || data.data || []);
      } else {
        setOrders([]);
        const err = await res.json().catch(() => ({ message: 'Error al buscar pedidos' }));
        setError(err.message || 'Error al buscar pedidos');
      }
    } catch {
      setOrders([]);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <Package className="mx-auto h-12 w-12 text-slate-400" />
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900">Mis pedidos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa tu email para consultar tus pedidos
        </p>
      </div>

      <form onSubmit={handleSearch} className="mt-8">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {searched && (
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500">{error}</p>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
              <Package className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No se encontraron pedidos para este email.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Se encontraron {orders.length} pedido{orders.length !== 1 ? 's' : ''}
              </p>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[order.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(order.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              {item.name}{' '}
                              <span className="text-slate-400">x{item.quantity}</span>
                            </span>
                            <span className="font-medium text-slate-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.payment_status && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Pago:</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
