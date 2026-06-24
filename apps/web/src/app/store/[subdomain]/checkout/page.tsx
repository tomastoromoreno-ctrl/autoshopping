'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Building2, Wallet } from 'lucide-react';
import { getSessionId } from '@/lib/session';
import { formatPrice } from '@/lib/format';

interface CartItem {
  cart_item_key: string;
  product_id: string;
  variant_id?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'transfer' | 'wallet';
}

interface StoreConfig {
  id: string;
  name: string;
  payment_methods?: PaymentMethod[];
  shipping_enabled?: boolean;
  shipping_cost?: number;
}

export default function CheckoutPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    const cartKey = `cart_${params.subdomain}`;
    const stored = localStorage.getItem(cartKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      } catch {
        setItems([]);
      }
    }

    async function loadStore() {
      try {
        const res = await fetch(`${apiUrl}/stores/${params.subdomain}/public`);
        if (res.ok) {
          const data = await res.json();
          setStoreConfig(data);
          if (data.payment_methods?.length) {
            setSelectedPayment(data.payment_methods[0].id);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [params.subdomain, apiUrl]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = storeConfig?.shipping_enabled ? (storeConfig.shipping_cost || 0) : 0;
  const total = subtotal + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !customerEmail.trim() || !selectedPayment) {
      setError('Completa todos los campos requeridos.');
      return;
    }

    if (storeConfig?.shipping_enabled && (!shippingAddress.trim() || !shippingCity.trim())) {
      setError('Completa la dirección de envío.');
      return;
    }

    setSubmitting(true);

    try {
      const sessionId = getSessionId();
      const res = await fetch(`${apiUrl}/orders/${params.subdomain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          payment_method_id: selectedPayment,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping_address: storeConfig?.shipping_enabled
            ? {
                address: shippingAddress,
                city: shippingCity,
                state: shippingState,
                zip: shippingZip,
              }
            : undefined,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        localStorage.removeItem(`cart_${params.subdomain}`);
        window.dispatchEvent(new Event('cart-updated'));

        if (order.payment_url) {
          window.location.href = order.payment_url;
        } else if (order.id) {
          router.push(`/store/${params.subdomain}/orders`);
        }
      } else {
        const err = await res.json().catch(() => ({ message: 'Error al crear pedido' }));
        setError(err.message || 'Error al crear pedido');
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const paymentIcons: Record<string, React.ReactNode> = {
    card: <CreditCard className="h-5 w-5" />,
    transfer: <Building2 className="h-5 w-5" />,
    wallet: <Wallet className="h-5 w-5" />,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al carrito
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Checkout</h1>

      {items.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-slate-500">No hay productos en tu carrito.</p>
          <button
            onClick={() => router.push(`/store/${params.subdomain}`)}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Ir a la tienda
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Información del cliente</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nombre completo *</label>
                   <input
                     type="text"
                     value={customerName}
                     onChange={(e) => setCustomerName(e.target.value)}
                     required
                     aria-label="Nombre completo"
                     className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                   />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email *</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      aria-label="Email"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      aria-label="Teléfono"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </section>

            {storeConfig?.shipping_enabled && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Dirección de envío</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Dirección *</label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                      aria-label="Dirección"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Ciudad *</label>
                      <input
                        type="text"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        required
                        aria-label="Ciudad"
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Estado</label>
                      <input
                        type="text"
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        aria-label="Estado"
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Código postal</label>
                      <input
                        type="text"
                        value={shippingZip}
                        onChange={(e) => setShippingZip(e.target.value)}
                        aria-label="Código postal"
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {storeConfig?.payment_methods && storeConfig.payment_methods.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Método de pago</h2>
                <div className="mt-4 space-y-2">
                  {storeConfig.payment_methods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                        selectedPayment === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      {paymentIcons[method.type] || <CreditCard className="h-5 w-5" />}
                      <span className="text-sm font-medium text-slate-900">{method.name}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Resumen del pedido</h3>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.cart_item_key} className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">
                      ${formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${formatPrice(subtotal)}</span>
                </div>
                {storeConfig?.shipping_enabled && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Envío</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Gratis' : `${formatPrice(shipping)}`}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Realizar pedido'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
