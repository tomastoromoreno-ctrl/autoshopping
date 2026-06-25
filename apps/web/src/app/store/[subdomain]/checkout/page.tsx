'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Building2, Wallet, Truck, Shield, Check } from 'lucide-react';
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
          
          const provider = data.config?.payment_provider || 'mercadopago';
          const paymentMethods: PaymentMethod[] = [];
          if (provider === 'mercadopago') {
            paymentMethods.push({ id: 'mercadopago', name: 'Mercado Pago (Tarjeta de Crédito, Débito, Transferencia)', type: 'card' });
          } else if (provider === 'transbank') {
            paymentMethods.push({ id: 'transbank', name: 'Webpay Plus (Transbank)', type: 'card' });
          } else {
            paymentMethods.push({ id: 'mercadopago', name: 'Pago Seguro', type: 'card' });
          }

          const mappedConfig: StoreConfig = {
            id: data.id,
            name: data.name,
            shipping_enabled: data.config?.shipping_enabled,
            shipping_cost: data.config?.shipping_cost,
            payment_methods: paymentMethods,
          };

          setStoreConfig(mappedConfig);
          if (mappedConfig.payment_methods?.length) {
            setSelectedPayment(mappedConfig.payment_methods[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading store config:', err);
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

  const steps = [
    { label: 'Datos', active: true },
    { label: 'Envío', active: storeConfig?.shipping_enabled },
    { label: 'Pago', active: true },
  ];

  return (
    <div className="container-tight py-8 sm:py-12">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al carrito
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">Checkout</h1>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500">No hay productos en tu carrito.</p>
          <button
            onClick={() => router.push(`/store/${params.subdomain}`)}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Ir a la tienda
          </button>
        </div>
      ) : (
        <>
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-0 max-w-md mx-auto">
              {steps.filter(s => s.active).map((step, displayIndex, filteredArr) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      displayIndex === 0 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-slate-400'
                    }`}>
                      {displayIndex + 1}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      displayIndex === 0 ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {displayIndex < filteredArr.length - 1 && (
                    <div className="w-12 h-0.5 bg-gray-200 mx-3" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
            {/* Checkout Form - Left Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Contact Information */}
              <div className="card p-6">
                <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">Información del cliente</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nombre completo *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      aria-label="Nombre completo"
                      className="input-modern"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        aria-label="Email"
                        className="input-modern"
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Teléfono
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        aria-label="Teléfono"
                        className="input-modern"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {storeConfig?.shipping_enabled && (
                <div className="card p-6">
                  <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">Dirección de envío</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Dirección *
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        required
                        aria-label="Dirección"
                        className="input-modern"
                        placeholder="Calle, número, depto"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                          Ciudad *
                        </label>
                        <input
                          id="city"
                          type="text"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          required
                          aria-label="Ciudad"
                          className="input-modern"
                          placeholder="Santiago"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">
                          Región
                        </label>
                        <input
                          id="state"
                          type="text"
                          value={shippingState}
                          onChange={(e) => setShippingState(e.target.value)}
                          aria-label="Región"
                          className="input-modern"
                          placeholder="Metropolitana"
                        />
                      </div>
                      <div>
                        <label htmlFor="zip" className="block text-sm font-medium text-slate-700 mb-1.5">
                          Código postal
                        </label>
                        <input
                          id="zip"
                          type="text"
                          value={shippingZip}
                          onChange={(e) => setShippingZip(e.target.value)}
                          aria-label="Código postal"
                          className="input-modern"
                          placeholder="7500000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {storeConfig?.payment_methods && storeConfig.payment_methods.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">Método de pago</h2>
                  <div className="space-y-3">
                    {storeConfig.payment_methods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                          selectedPayment === method.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                        <div className={`p-2 rounded-lg ${
                          selectedPayment === method.id 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-gray-100 text-slate-500'
                        }`}>
                          {paymentIcons[method.type] || <CreditCard className="h-5 w-5" />}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{method.name}</span>
                        {selectedPayment === method.id && (
                          <Check className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button - Mobile */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full lg:hidden"
              >
                {submitting ? 'Procesando...' : `Pagar ${formatPrice(total)}`}
              </button>
            </div>

            {/* Order Summary - Right Column */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-24">
                <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Resumen del pedido</h3>
                
                {/* Product List */}
                <div className="space-y-4 mb-4">
                  {items.map((item) => (
                    <div key={item.cart_item_key} className="flex items-center gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500">x{item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {storeConfig?.shipping_enabled && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Envío</span>
                      <span className="font-medium">
                        {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button - Desktop */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full mt-6 hidden lg:inline-flex"
                >
                  {submitting ? 'Procesando...' : `Pagar ${formatPrice(total)}`}
                </button>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Envío seguro a todo Chile</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Pago 100% seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
