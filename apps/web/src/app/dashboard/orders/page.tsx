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
  shipping_address?: any;
  shipping_provider?: string;
  tracking_number?: string;
  customer_phone?: string;
  shipping_type?: string;
  shipping_branch?: string;
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
  const [trackInputs, setTrackInputs] = useState<Record<string, string>>({});
  const [activeLabelOrder, setActiveLabelOrder] = useState<Order | null>(null);

  const load = () => {
    api.get<{ data: Order[] }>('/orders').then((res) => setOrders(res.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const trackingVal = trackInputs[orderId] || '';
      await api.patch(`/orders/${orderId}/status`, { 
        status: newStatus,
        tracking: trackingVal || undefined
      });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const saveTracking = async (orderId: string, tracking: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { tracking });
      alert('Número de seguimiento guardado.');
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
                    <div className="mt-2 space-y-1 text-sm text-slate-600 font-normal">
                      {order.payment_method && <p>Pago: {order.payment_method}</p>}
                      <p>Email: {order.customer_email}</p>
                      {order.customer_phone && <p>Teléfono: {order.customer_phone}</p>}
                      {order.shipping_address && (
                        <p>Dirección: {typeof order.shipping_address === 'string' ? order.shipping_address : `${order.shipping_address.address}, ${order.shipping_address.city}, ${order.shipping_address.state}`}</p>
                      )}
                      {order.shipping_type && (
                        <p>Despacho: <span className="font-semibold text-slate-900">{order.shipping_type === 'branch' ? 'Retiro en Sucursal' : 'Despacho a Domicilio'}</span></p>
                      )}
                      {order.shipping_type === 'branch' && order.shipping_branch && (
                        <p>Sucursal: <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{order.shipping_branch}</span></p>
                      )}
                      {order.shipping_provider && <p>Courier: <span className="font-semibold text-primary">{order.shipping_provider}</span></p>}
                      {order.tracking_number && <p>Seguimiento: <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{order.tracking_number}</span></p>}
                      
                      {order.customer_phone && (
                        <div className="pt-2">
                          <a
                            href={`https://wa.me/${order.customer_phone.replace(/\+/g, '').replace(/\s/g, '')}?text=Hola%20${encodeURIComponent(order.customer_name)}%2C%20te%20escribo%20desde%20la%20tienda%20sobre%20tu%20pedido%20%23${order.id.slice(0, 8)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                          >
                            💬 Contactar por WhatsApp
                          </a>
                        </div>
                      )}
                    </div>

                    {order.shipping_provider && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setActiveLabelOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          🖨 Imprimir Etiqueta
                        </button>
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-slate-500">Actualizar estado</label>
                        <select onChange={(e) => handleStatusUpdate(order.id, e.target.value)} value={order.status}
                          aria-label="Actualizar estado"
                          className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-primary">
                          {statuses.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {(order.status === 'processing' || order.status === 'shipped') && (
                        <div>
                          <label className="text-xs font-medium text-slate-500">Número de Seguimiento</label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={trackInputs[order.id] ?? order.tracking_number ?? ''}
                              onChange={(e) => setTrackInputs({ ...trackInputs, [order.id]: e.target.value })}
                              aria-label="Número de seguimiento"
                              placeholder="Ej: ST1234567"
                              className="w-full rounded-lg border px-3 py-1 text-sm outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => saveTracking(order.id, trackInputs[order.id] || '')}
                              className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
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

      {/* Modal de Etiqueta de Despacho */}
      {activeLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Etiqueta de Despacho</h3>
              <button
                type="button"
                onClick={() => setActiveLabelOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            {/* Contenido de la Etiqueta */}
            <div className="mt-6 border-2 border-slate-900 p-4 font-sans text-slate-900 bg-white">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <span className="text-xl font-black tracking-wider uppercase">
                  {activeLabelOrder.shipping_provider || 'DESPACHO'}
                </span>
                <span className="text-xs font-bold border border-slate-950 px-2 py-0.5">
                  CLP COLECTA
                </span>
              </div>

              {/* Código de barras simulado */}
              <div className="flex flex-col items-center py-4 border-b-2 border-slate-900">
                <div className="flex h-12 gap-0.5 items-end justify-center w-full max-w-xs bg-slate-100 p-2">
                  <div className="w-1 bg-black h-full" />
                  <div className="w-0.5 bg-black h-full" />
                  <div className="w-2 bg-black h-full" />
                  <div className="w-0.5 bg-black h-full" />
                  <div className="w-1 bg-black h-full" />
                  <div className="w-1.5 bg-black h-full" />
                  <div className="w-0.5 bg-black h-full" />
                  <div className="w-2 bg-black h-full" />
                  <div className="w-1 bg-black h-full" />
                  <div className="w-0.5 bg-black h-full" />
                  <div className="w-1.5 bg-black h-full" />
                  <div className="w-2 bg-black h-full" />
                </div>
                <span className="mt-1 font-mono text-xs tracking-widest font-bold">
                  {activeLabelOrder.tracking_number || `ORD-${activeLabelOrder.id.slice(0, 8).toUpperCase()}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-b-2 border-slate-900 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Destinatario</p>
                  <p className="font-bold text-sm mt-1">{activeLabelOrder.customer_name}</p>
                  {activeLabelOrder.shipping_type === 'branch' ? (
                    <>
                      <p className="mt-1 font-bold text-blue-900 bg-blue-50 px-1 py-0.5 rounded inline-block text-[10px] uppercase border border-blue-200">
                        RETIRO EN SUCURSAL
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        📍 {activeLabelOrder.shipping_branch}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Ref: {typeof activeLabelOrder.shipping_address === 'string'
                          ? activeLabelOrder.shipping_address
                          : activeLabelOrder.shipping_address?.address}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-0.5">
                        {typeof activeLabelOrder.shipping_address === 'string'
                          ? activeLabelOrder.shipping_address
                          : activeLabelOrder.shipping_address?.address}
                      </p>
                    </>
                  )}
                  <p className="font-bold">
                    {typeof activeLabelOrder.shipping_address === 'string'
                      ? ''
                      : `${activeLabelOrder.shipping_address?.city}, ${activeLabelOrder.shipping_address?.state}`}
                  </p>
                  {activeLabelOrder.customer_phone && <p className="mt-0.5">Tel: {activeLabelOrder.customer_phone}</p>}
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Remitente</p>
                  <p className="font-bold mt-1">Mi Tienda Autoshopping</p>
                  <p className="mt-0.5">Av. Providencia 1234, Of. 50</p>
                  <p className="font-bold">Santiago, Metropolitana</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-bold">
                <span>Orden: #{activeLabelOrder.id.slice(0, 8)}</span>
                <span>Peso Est: 1.5 Kg</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setActiveLabelOrder(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
