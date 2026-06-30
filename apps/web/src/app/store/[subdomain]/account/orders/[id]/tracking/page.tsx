'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { formatPrice } from '@/lib/format';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  updated_at?: string;
  customer_name: string;
  customer_email: string;
  shipping_courier?: string;
  tracking_number?: string;
  items: OrderItem[];
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Recibido', icon: Clock },
  { key: 'confirmed', label: 'Confirmado', icon: CheckCircle },
  { key: 'processing', label: 'En preparación', icon: Package },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: CheckCircle },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

function getTrackingLink(courier?: string, tracking?: string): string | null {
  if (!tracking) return null;
  const c = (courier || '').toLowerCase();
  if (c.includes('starken')) return `https://www.starken.cl/seguimiento/${tracking}`;
  if (c.includes('chilexpress')) return `https://www.chilexpress.cl/chilexpress/tracking?trackingnumber=${tracking}`;
  if (c.includes('correos')) return `https://www.correos.cl/seguimiento/#/sello/${tracking}`;
  return null;
}

function getEstimatedDelivery(createdAt: string): string {
  const created = new Date(createdAt);
  const estimated = new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000);
  return estimated.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const subdomain = params.subdomain as string;
  const orderId = params.id as string;
  const { token, loading: authLoading } = useCustomerAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !token) {
      router.push(`/store/${subdomain}/account/login`);
    }
  }, [token, authLoading, router, subdomain]);

  useEffect(() => {
    if (token && orderId) {
      fetchOrder();
    }
  }, [token, orderId]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/customers/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Pedido no encontrado');
      const data = await res.json();
      setOrder(data.order || data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedido');
    }
    setLoading(false);
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">{error || 'Pedido no encontrado'}</p>
          <Link href={`/store/${subdomain}/account`} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Volver a Mi Cuenta
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_INDEX[order.status] ?? -1;
  const isCancelled = order.status === 'cancelled';
  const trackingLink = getTrackingLink(order.shipping_courier, order.tracking_number);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          href={`/store/${subdomain}/account/orders/${orderId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al pedido
        </Link>

        <h1 className="text-xl font-bold text-slate-900 mb-1">Seguimiento del pedido #{order.order_number}</h1>
        <p className="text-sm text-slate-500 mb-8">
          Realizado el {new Date(order.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          {isCancelled ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Package className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-red-600">Pedido cancelado</p>
            </div>
          ) : (
            <div className="relative">
              {TIMELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const isLast = idx === TIMELINE_STEPS.length - 1;

                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    {/* Vertical connector line */}
                    {!isLast && (
                      <div className="absolute left-4 top-8 w-0.5 h-8 bg-slate-200" style={{ marginLeft: '0px' }} />
                    )}
                    {!isLast && isDone && (
                      <div className="absolute left-4 top-8 w-0.5 h-8 bg-blue-500" style={{ marginLeft: '0px' }} />
                    )}

                    {/* Circle icon */}
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200'
                          : isDone
                          ? 'border-blue-500 bg-blue-50 text-blue-500'
                          : 'border-slate-200 bg-slate-50 text-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Label */}
                    <div className="pb-8">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-600' : isDone ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            Estado actual
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Estimated Delivery */}
        {!isCancelled && currentStep < 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Entrega estimada</h3>
            </div>
            <p className="text-base font-medium text-slate-700">{getEstimatedDelivery(order.created_at)}</p>
          </div>
        )}

        {/* Tracking Number */}
        {order.tracking_number && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Datos de envío</h3>
            </div>
            <div className="space-y-2 text-sm">
              {order.shipping_courier && (
                <p className="text-slate-600">
                  Transportista:{' '}
                  <span className="font-medium text-slate-900">{order.shipping_courier}</span>
                </p>
              )}
              <div className="flex items-center gap-3">
                <p className="text-slate-600">
                  Tracking:{' '}
                  <span className="font-mono font-medium text-slate-900">{order.tracking_number}</span>
                </p>
                {trackingLink && (
                  <a
                    href={trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Seguir envío
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-500" />
            Productos del pedido
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.product_name}
                    {item.variant_name ? ` - ${item.variant_name}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} x {formatPrice(item.price)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900 ml-4">{formatPrice(item.total)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-sm font-bold text-slate-900">{formatPrice(order.total)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
