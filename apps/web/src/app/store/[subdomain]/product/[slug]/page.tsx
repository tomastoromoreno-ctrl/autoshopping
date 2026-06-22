'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Minus, Plus, Truck } from 'lucide-react';
import { getSessionId } from '@/lib/session';

interface ProductImage {
  url: string;
  alt?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  stock?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  images?: ProductImage[];
  stock?: number;
  sku?: string;
  variants?: ProductVariant[];
}

export default function ProductDetailPage({
  params,
}: {
  params: { subdomain: string; slug: string };
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(
          `${apiUrl}/products/${params.subdomain}?slug=${params.slug}`
        ).catch(() => null);

        if (!res || !res.ok) {
          const listRes = await fetch(`${apiUrl}/products/${params.subdomain}`).catch(() => null);
          if (listRes?.ok) {
            const data = await listRes.json();
            const items = Array.isArray(data) ? data : data.products || data.data || [];
            const found = items.find(
              (p: any) => p.slug === params.slug || p.id === params.slug
            );
            if (found) setProduct(found);
          }
          return;
        }

        const data = await res.json();
        setProduct(data.product || data.data || data);
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.subdomain, params.slug, apiUrl]);

  function getEffectivePrice(): number {
    if (selectedVariant?.price) return selectedVariant.price;
    return product?.price || 0;
  }

  function getStock(): number {
    if (selectedVariant?.stock !== undefined) return selectedVariant.stock;
    return product?.stock ?? Infinity;
  }

  function handleAddToCart() {
    if (!product) return;

    const sessionId = getSessionId();
    const cartKey = `cart_${params.subdomain}`;
    const existing = localStorage.getItem(cartKey);
    const cart = existing ? JSON.parse(existing) : [];

    const variantId = selectedVariant?.id;
    const cartItemKey = variantId ? `${product.id}_${variantId}` : product.id;

    const existingIdx = cart.findIndex((item: any) => item.cart_item_key === cartItemKey);
    if (existingIdx >= 0) {
      cart[existingIdx].quantity += quantity;
    } else {
      cart.push({
        cart_item_key: cartItemKey,
        product_id: product.id,
        variant_id: variantId,
        variant_name: selectedVariant?.name,
        name: product.name,
        price: getEffectivePrice(),
        image: product.images?.[0]?.url || '/placeholder.svg',
        quantity,
        slug: product.slug,
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-slate-600">Producto no encontrado</p>
        <button
          onClick={() => router.push(`/store/${params.subdomain}`)}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice();
  const stock = getStock();
  const hasDiscount = product.compare_at_price && product.compare_at_price > effectivePrice;
  const outOfStock = stock <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
            <img
              src={product.images?.[selectedImage]?.url || '/placeholder.svg'}
              alt={product.images?.[selectedImage]?.alt || product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === selectedImage ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 lg:text-3xl">{product.name}</h1>

          <div className="mt-3 sm:mt-4 flex items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              ${effectivePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-slate-500 line-through">
                ${Number(product.compare_at_price).toFixed(2)}
              </span>
            )}
          </div>

          {stock !== Infinity && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              {outOfStock ? (
                <span className="text-red-500">Agotado</span>
              ) : stock <= 5 ? (
                <span className="text-amber-600">Solo quedan {stock} unidades</span>
              ) : (
                <span className="text-green-600">En stock ({stock} disponibles)</span>
              )}
            </div>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-900">Variantes</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedVariant?.id === variant.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    } ${variant.stock !== undefined && variant.stock <= 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                    disabled={variant.stock !== undefined && variant.stock <= 0}
                  >
                    {variant.name}
                    {variant.price ? ` - $${variant.price.toFixed(2)}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(stock === Infinity ? 99 : stock, quantity + 1))}
                disabled={quantity >= (stock === Infinity ? 99 : stock)}
                className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex-1 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors ${
                addedToCart
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-primary hover:bg-primary/90'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {addedToCart ? 'Agregado!' : outOfStock ? 'Agotado' : 'Agregar al carrito'}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Truck className="h-4 w-4" />
            <span>Envíos a todo el país</span>
          </div>

          {product.description && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold text-slate-900">Descripción</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
