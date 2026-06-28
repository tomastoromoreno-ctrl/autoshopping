'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CreditCard, MapPin, ExternalLink, Loader2 } from 'lucide-react';
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
  subtotal: number;
  shipping_cost: number;
  discount: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_region?: string;
  shipping_commune?: string;
  shipping_courier?: string;
  tracking_number?: string;
  tracking_url?: string;
  payment_method?: string;
  payment_status?: string;
  items: OrderItem[];
  notes?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'En preparación', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Reembolsado', color: 'bg-slate-100 text-slate-700' },
};

function getTrackingLink(courier?: string, tracking?: string): string | null {
  if (!tracking) return null;
  const c = (courier || '').toLowerCase();
  if (c.includes('starken')) return `https://www.starken.cl/seguimiento/${tracking}`;
  if (c.includes('chilexpress')) return `https://www.chilexpress.cl/chilexpress/tracking?trackingnumber=${tracking}`;
  if (c.includes('correos')) return `https://www.correos.cl/seguimiento/#/sello/${tracking}`;
  return null;
}

export default function OrderDetailPage() {
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

  const status = STATUS_MAP[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700' };
  const trackingLink = getTrackingLink(order.shipping_courier, order.tracking_number);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          href={`/store/${subdomain}/account`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis Pedidos
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Pedido #{order.order_number}</h1>
            <span className={`self-start px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {new Date(order.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 text-sm">Envío</h3>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-medium text-slate-900">{order.customer_name}</p>
              {order.shipping_address && <p>{order.shipping_address}</p>}
              {order.shipping_commune && <p>{order.shipping_commune}</p>}
              {order.shipping_region && <p>{order.shipping_region}</p>}
              {order.customer_phone && <p className="text-slate-500">{order.customer_phone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 text-sm">Rastreo</h3>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              {order.shipping_courier && <p>Transportista: <span className="font-medium text-slate-900">{order.shipping_courier}</span></p>}
              {order.tracking_number && (
                <p>
                  Tracking:{' '}
                  {trackingLink ? (
                    <a href={trackingLink} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                      {order.tracking_number}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-medium text-slate-900">{order.tracking_number}</span>
                  )}
                </p>
              )}
              {!order.shipping_courier && !order.tracking_number && (
                <p className="text-slate-400">Sin información de rastreo</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            Productos
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
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900 ml-4">{formatPrice(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Pago</h3>
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            {order.payment_method && <p>Método: <span className="font-medium text-slate-900">{order.payment_method}</span></p>}
            {order.payment_status && <p>Estado: <span className="font-medium text-slate-900">{order.payment_status}</span></p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Resumen</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Envío</span>
              <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Gratis'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
