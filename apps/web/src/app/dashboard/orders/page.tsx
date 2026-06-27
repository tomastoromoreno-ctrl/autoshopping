'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
  shipping_address?: any;
  shipping_provider?: string;
  tracking_number?: string;
  shipping_type?: string;
  shipping_branch?: string;
  payment_method?: string;
  merchant_notes?: string;
  internal_reference?: string;
  payment_status?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-indigo-600 bg-indigo-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  approved: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
  refunded: 'text-slate-600 bg-slate-100',
};

const flowStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const flowStatusIcons: Record<string, string> = {
  pending: '⏳',
  confirmed: '✓',
  processing: '⚙',
  shipped: '🚚',
  delivered: '✓',
};

const flowStatusButtonColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  processing: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
};

const allStatuses = ['all', ...Object.keys(statusLabels)];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trackInputs, setTrackInputs] = useState<Record<string, string>>({});
  const [providerInputs, setProviderInputs] = useState<Record<string, string>>({});
  const [activeLabelOrder, setActiveLabelOrder] = useState<Order | null>(null);
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});
  const [refInputs, setRefInputs] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<{ data: Order[] }>('/orders').then((res) => setOrders(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (expanded) {
      const order = orders.find((o) => o.id === expanded);
      if (order) {
        setNotesInputs((prev) => ({ ...prev, [order.id]: order.merchant_notes || '' }));
        setRefInputs((prev) => ({ ...prev, [order.id]: order.internal_reference || '' }));
        setTrackInputs((prev) => ({ ...prev, [order.id]: order.tracking_number || '' }));
        setProviderInputs((prev) => ({ ...prev, [order.id]: order.shipping_provider || '' }));
      }
    }
  }, [expanded, orders]);

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        tracking: trackInputs[orderId] || undefined,
        shipping_provider: providerInputs[orderId] || undefined,
      });
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const saveFulfillment = async (orderId: string, tracking: string, provider: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, {
        tracking,
        shipping_provider: provider || undefined,
      });
      alert('Datos de despacho guardados con éxito y cliente notificado.');
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const saveNotes = async (orderId: string) => {
    try {
      setSavingNotes(orderId);
      await api.patch(`/orders/${orderId}/details`, {
        merchant_notes: notesInputs[orderId] || '',
        internal_reference: refInputs[orderId] || '',
      });
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNotes(null);
    }
  };

  const getNextStatus = (current: string) => {
    const idx = flowStatuses.indexOf(current);
    if (idx === -1 || idx >= flowStatuses.length - 1) return null;
    return flowStatuses[idx + 1];
  };

  const formatShippingAddress = (addr: any) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    return `${addr.address || ''}${addr.city ? `, ${addr.city}` : ''}${addr.state ? `, ${addr.state}` : ''}`;
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Órdenes</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {s === 'all' ? 'Todas' : statusLabels[s] || s}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex flex-1 flex-wrap items-center gap-4">
                <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
                <span className="font-medium text-slate-900">{order.customer_name}</span>
                <span className="font-semibold text-slate-900">{formatPrice(order.total)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || 'text-slate-600 bg-slate-50'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
                <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('es-CL')}</span>
              </div>
              <svg
                className={`h-5 w-5 text-slate-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence initial={false}>
              {expanded === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100 px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-5">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Productos</h4>
                          {order.items && order.items.length > 0 ? (
                            <ul className="space-y-1.5">
                              {order.items.map((item, i) => (
                                <li key={i} className="flex justify-between text-sm text-slate-600 py-1 border-b border-slate-50 last:border-0">
                                  <span>{item.product_name} <span className="text-slate-400">x{item.quantity}</span></span>
                                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">Sin productos registrados</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Información del Cliente</h4>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>{order.customer_email}</p>
                            {order.customer_phone && <p>{order.customer_phone}</p>}
                            {order.shipping_address && (
                              <p>{formatShippingAddress(order.shipping_address)}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Despacho</h4>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>
                              <span className="text-slate-400">Tipo: </span>
                              <span className="font-medium text-slate-900">
                                {order.shipping_type === 'branch' ? 'Retiro en Sucursal' : 'Despacho a Domicilio'}
                              </span>
                            </p>
                            {order.shipping_type === 'branch' && order.shipping_branch && (
                              <p>
                                <span className="text-slate-400">Sucursal: </span>
                                <span className="font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                                  {order.shipping_branch}
                                </span>
                              </p>
                            )}
                            {order.shipping_provider && (
                              <p>
                                <span className="text-slate-400">Courier: </span>
                                <span className="font-semibold text-slate-900">{order.shipping_provider}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {order.customer_phone && (
                          <a
                            href={`https://wa.me/${order.customer_phone.replace(/\+/g, '').replace(/\s/g, '')}?text=Hola%20${encodeURIComponent(order.customer_name)}%2C%20te%20escribo%20desde%20la%20tienda%20sobre%20tu%20pedido%20%23${order.id.slice(0, 8)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-sm"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Contactar por WhatsApp
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveLabelOrder(order)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Imprimir Etiqueta
                        </button>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Acciones de Estado</h4>
                          <div className="flex flex-wrap gap-2">
                            {flowStatuses.map((s) => {
                              const isActive = order.status === s;
                              const isPast = flowStatuses.indexOf(s) < flowStatuses.indexOf(order.status);
                              return (
                                <button
                                  key={s}
                                  disabled={isActive || isPast || updatingStatus === order.id}
                                  onClick={() => handleStatusUpdate(order.id, s)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                    isActive
                                      ? 'ring-2 ring-offset-1 ring-blue-400 border-blue-400 ' + flowStatusButtonColors[s]
                                      : isPast
                                      ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                      : flowStatusButtonColors[s]
                                  } ${updatingStatus === order.id ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                  {isActive && '✓ '}{flowStatusIcons[s]} {statusLabels[s]}
                                </button>
                              );
                            })}
                            <button
                              disabled={order.status === 'cancelled' || updatingStatus === order.id}
                              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              className="rounded-full border px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border-red-300 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        </div>

                        {(order.status === 'processing' || order.status === 'shipped') && (
                          <div className="rounded-xl border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Datos de Despacho</h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Courier / Transportista</label>
                                <input
                                  type="text"
                                  value={providerInputs[order.id] ?? ''}
                                  onChange={(e) => setProviderInputs({ ...providerInputs, [order.id]: e.target.value })}
                                  placeholder="Ej: Starken, Chilexpress"
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Código de Seguimiento</label>
                                <input
                                  type="text"
                                  value={trackInputs[order.id] ?? ''}
                                  onChange={(e) => setTrackInputs({ ...trackInputs, [order.id]: e.target.value })}
                                  placeholder="Ej: ST1234567"
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => saveFulfillment(
                                  order.id,
                                  trackInputs[order.id] ?? order.tracking_number ?? '',
                                  providerInputs[order.id] ?? order.shipping_provider ?? ''
                                )}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Guardar y Notificar
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 p-4">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Notas del Mercader</h4>
                          <textarea
                            value={notesInputs[order.id] ?? ''}
                            onChange={(e) => setNotesInputs({ ...notesInputs, [order.id]: e.target.value })}
                            placeholder="Notas privadas sobre este pedido..."
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors resize-none"
                          />
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Referencia Interna</label>
                            <input
                              type="text"
                              value={refInputs[order.id] ?? ''}
                              onChange={(e) => setRefInputs({ ...refInputs, [order.id]: e.target.value })}
                              placeholder="Ej: REF-001"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                            />
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              disabled={savingNotes === order.id}
                              onClick={() => saveNotes(order.id)}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                              {savingNotes === order.id ? 'Guardando...' : 'Guardar Notas'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Info de Pago</h4>
                          <div className="space-y-1.5 text-sm">
                            {order.payment_method && (
                              <p className="text-slate-600">
                                <span className="text-slate-400">Método: </span>
                                <span className="font-medium text-slate-900">{order.payment_method}</span>
                              </p>
                            )}
                            {order.payment_status && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Estado: </span>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusColors[order.payment_status] || 'text-slate-600 bg-slate-50'}`}>
                                  {paymentStatusLabels[order.payment_status] || order.payment_status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            No hay órdenes con este estado
          </div>
        )}
      </div>

      {activeLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Etiqueta de Despacho</h3>
              <button
                type="button"
                onClick={() => setActiveLabelOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 border-2 border-slate-900 p-4 font-sans text-slate-900 bg-white">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <span className="text-xl font-black tracking-wider uppercase">
                  {activeLabelOrder.shipping_provider || 'DESPACHO'}
                </span>
                <span className="text-xs font-bold border border-slate-950 px-2 py-0.5">
                  CLP COLECTA
                </span>
              </div>

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
                  <div className="w-0.5 bg-black h-full" />
                  <div className="w-1 bg-black h-full" />
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
                        {activeLabelOrder.shipping_branch}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Ref: {formatShippingAddress(activeLabelOrder.shipping_address)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5">{formatShippingAddress(activeLabelOrder.shipping_address)}</p>
                  )}
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
                onClick={() => window.print()}
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
