'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw } from 'lucide-react';
import { getSessionId } from '@/lib/session';
import { formatPrice } from '@/lib/format';

interface CartItem {
  cart_item_key: string;
  product_id: string;
  variant_id?: string;
  variant_name?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
}

export default function CartPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [shipping, setShipping] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    loadCart();
  }, [params.subdomain]);

  function loadCart() {
    const cartKey = `cart_${params.subdomain}`;
    const stored = localStorage.getItem(cartKey);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }

  function saveCart(updatedItems: CartItem[]) {
    setItems(updatedItems);
    const cartKey = `cart_${params.subdomain}`;
    localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('cart-updated'));
  }

  function updateQuantity(cartItemKey: string, delta: number) {
    const updated = items.map((item) => {
      if (item.cart_item_key === cartItemKey) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(updated);
  }

  function removeItem(cartItemKey: string) {
    const updated = items.filter((item) => item.cart_item_key !== cartItemKey);
    saveCart(updated);
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');

    try {
      const sessionId = getSessionId();
      const res = await fetch(`${apiUrl}/coupons/${params.subdomain}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, session_id: sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCouponDiscount(data.discount_amount || data.discount_percent || 0);
      } else {
        const err = await res.json().catch(() => ({ message: 'Cupón inválido' }));
        setCouponError(err.message || 'Cupón inválido');
        setCouponDiscount(0);
      }
    } catch {
      setCouponError('Error al validar cupón');
      setCouponDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = couponDiscount > 0 && couponDiscount < 1
    ? subtotal * couponDiscount
    : Math.min(couponDiscount, subtotal);
  const total = Math.max(0, subtotal - discount + shipping);

  return (
    <div className="container-tight py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">Carrito de compras</h1>
          <p className="mt-1 text-sm text-slate-500">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
        </div>
        <Link
          href={`/store/${params.subdomain}`}
          className="btn-secondary hidden sm:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 sm:p-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <ShoppingCart className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-slate-900">Tu carrito está vacío</h2>
          <p className="mt-2 text-slate-500">Agrega productos para empezar a comprar.</p>
          <Link
            href={`/store/${params.subdomain}`}
            className="btn-primary mt-8 inline-flex"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.cart_item_key}
                className="card p-4 sm:p-5 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/store/${params.subdomain}/product/${item.slug}`}
                      className="text-sm font-medium text-slate-900 hover:text-primary line-clamp-1 transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.variant_name && (
                      <p className="mt-0.5 text-xs text-slate-500">{item.variant_name}</p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      aria-label="Eliminar producto"
                      onClick={() => removeItem(item.cart_item_key)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center rounded-xl border border-gray-200">
                      <button
                        aria-label="Disminuir cantidad"
                        onClick={() => updateQuantity(item.cart_item_key, -1)}
                        disabled={item.quantity <= 1}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors rounded-l-xl"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex h-9 w-10 items-center justify-center text-sm font-medium border-x border-gray-200">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Aumentar cantidad"
                        onClick={() => updateQuantity(item.cart_item_key, 1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-gray-100 transition-colors rounded-r-xl"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile continue shopping link */}
            <Link
              href={`/store/${params.subdomain}`}
              className="btn-secondary w-full sm:hidden mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Seguir comprando
            </Link>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Resumen</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Envío</span>
                  <span className="font-medium text-slate-900">
                    {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Cupón de descuento</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ingresa tu cupón"
                    className="input-modern flex-1"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="btn-primary px-4 py-2"
                  >
                    {applyingCoupon ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 text-xs text-red-500">{couponError}</p>
                )}
                {couponDiscount > 0 && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">
                    Cupón aplicado: -{formatPrice(discount)}
                  </p>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  getSessionId();
                  router.push(`/store/${params.subdomain}/checkout`);
                }}
                className="btn-primary w-full mt-6"
              >
                Proceder al pago
              </button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Envío gratis en compras sobre $50.000</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Pago seguro garantizado</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <RotateCcw className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Devolución gratuita en 30 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
