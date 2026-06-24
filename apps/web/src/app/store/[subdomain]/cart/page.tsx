'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
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
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Carrito de compras</h1>
        <Link
          href={`/store/${params.subdomain}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="mt-4 text-lg font-medium text-slate-900">Tu carrito está vacío</h2>
          <p className="mt-1 text-sm text-slate-500">Agrega productos para empezar a comprar.</p>
          <Link
            href={`/store/${params.subdomain}`}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.cart_item_key}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl border bg-white p-3 sm:p-4 shadow-sm"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/store/${params.subdomain}/product/${item.slug}`}
                  className="text-sm font-medium text-slate-900 hover:text-primary line-clamp-1"
                >
                  {item.name}
                </Link>
                {item.variant_name && (
                  <p className="mt-0.5 text-xs text-slate-500">{item.variant_name}</p>
                )}
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  ${formatPrice(item.price * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto mt-2 sm:mt-0">
                <div className="flex items-center rounded-lg border">
                  <button
                    aria-label="Disminuir cantidad"
                    onClick={() => updateQuantity(item.cart_item_key, -1)}
                    disabled={item.quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex h-8 w-8 items-center justify-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Aumentar cantidad"
                    onClick={() => updateQuantity(item.cart_item_key, 1)}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  aria-label="Eliminar producto"
                  onClick={() => removeItem(item.cart_item_key)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-slate-900">Cupón de descuento</h3>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ingresa tu cupón"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {applyingCoupon ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponError && (
                <p className="mt-1 text-xs text-red-500">{couponError}</p>
              )}
              {couponDiscount > 0 && (
                <p className="mt-1 text-xs text-green-600">
                  Cupón aplicado: -${formatPrice(discount)}
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">${formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-${formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Envío</span>
                  <span className="font-medium text-slate-900">
                    {shipping === 0 ? 'Gratis' : `${formatPrice(shipping)}`}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  getSessionId();
                  router.push(`/store/${params.subdomain}/checkout`);
                }}
                className="mt-6 w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Proceder al pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
