'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tenant_name: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
  payment_method?: string;
  payment_status?: string;
  shipping_address?: string;
}

interface PaginatedResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set('status', statusFilter);
      if (tenantFilter) params.set('tenant', tenantFilter);
      const res = await api.get<PaginatedResponse>(`/admin/orders?${params}`);
      setOrders(res.data);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, tenantFilter]);

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    confirmed: 'text-blue-600 bg-blue-50',
    processing: 'text-indigo-600 bg-indigo-50',
    shipped: 'text-purple-600 bg-purple-50',
    delivered: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Todas las Órdenes</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="processing">Procesando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <input
          type="text"
          placeholder="Filtrar por tienda..."
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-500">
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Tienda</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <>
                <tr key={order.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-900">{order.tenant_name}</td>
                  <td className="px-4 py-3 text-slate-900">{order.customer_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">${order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || 'text-slate-600 bg-slate-50'}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`} className="bg-slate-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">Artículos</h4>
                          {order.items && order.items.length > 0 ? (
                            <table className="mt-2 w-full text-sm">
                              <thead>
                                <tr className="text-xs text-slate-500"><th className="pr-2 text-left">Producto</th><th className="px-2 text-left">Cant</th><th className="pl-2 text-left">Precio</th></tr>
                              </thead>
                              <tbody>
                                {order.items.map((item) => (
                                  <tr key={item.id} className="text-slate-700">
                                    <td className="pr-2 py-1">{item.product_name}</td>
                                    <td className="px-2 py-1">{item.quantity}</td>
                                    <td className="pl-2 py-1">${item.price.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="mt-1 text-sm text-slate-400">Sin detalles</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">Información de pago</h4>
                          <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <p>Método: {order.payment_method || 'N/A'}</p>
                            <p>Estado pago: {order.payment_status || 'N/A'}</p>
                            {order.shipping_address && <p>Dirección: {order.shipping_address}</p>}
                            <p>Email: {order.customer_email}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {orders.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No se encontraron órdenes</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Página {page} de {totalPages} ({total} registros)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
