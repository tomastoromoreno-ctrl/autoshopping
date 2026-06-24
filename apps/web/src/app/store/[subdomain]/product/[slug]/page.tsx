'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Truck, Star } from 'lucide-react';
import { getSessionId } from '@/lib/session';
import { formatPrice } from '@/lib/format';
import ProductJsonLd from '@/components/JsonLd';
import ProductReviews from '@/components/ProductReviews';

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
  images?: string[];
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
  const [store, setStore] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetch(`${apiUrl}/stores/${params.subdomain}/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStore(data);
      })
      .catch(() => {});
  }, [params.subdomain, apiUrl]);

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
            if (found) {
              setProduct(found);
              updateSeoMeta(found);
            }
          }
          return;
        }

        const data = await res.json();
        const p = data.product || data.data || data;
        setProduct(p);
        updateSeoMeta(p);
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.subdomain, params.slug, apiUrl]);

  function updateSeoMeta(p: Product) {
    if (!p) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app';
    const productUrl = `${siteUrl}/store/${params.subdomain}/product/${p.slug}`;
    const imageUrl = p.images?.[0] || `${siteUrl}/placeholder.svg`;

    document.title = `${p.name} | Tienda`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`
      ) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', p.description || `${p.name} - $${p.price}`);
    setMeta('og:title', p.name);
    setMeta('og:description', p.description || `${p.name} - $${p.price}`);
    setMeta('og:image', imageUrl);
    setMeta('og:url', productUrl);
    setMeta('og:type', 'product');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', p.name);
    setMeta('twitter:description', p.description || `${p.name} - $${p.price}`);
    setMeta('twitter:image', imageUrl);
  }

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
        image: product.images?.[0] || '/placeholder.svg',
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-white">
        <h1 className="text-5xl font-heading font-bold text-slate-900">404</h1>
        <p className="mt-3 text-lg text-slate-500">Producto no encontrado</p>
        <button
          onClick={() => router.push(`/store/${params.subdomain}`)}
          className="mt-6 btn-primary"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice();
  const stock = getStock();
  const hasDiscount = product.compare_at_price && product.compare_at_price > effectivePrice;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - effectivePrice) / product.compare_at_price!) * 100)
    : 0;
  const outOfStock = stock <= 0;
  const lowStock = stock !== Infinity && stock > 0 && stock <= 5;

  return (
    <div className="min-h-screen bg-white">
      <ProductJsonLd
        subdomain={params.subdomain}
        product={product}
        storeName={store?.name || 'Tienda'}
      />

      <div className="container-tight py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => router.push(`/store/${params.subdomain}`)}
            className="transition-colors hover:text-slate-900"
          >
            Home
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-slate-400">{store?.name || 'Tienda'}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="truncate text-slate-700 font-medium">{product.name}</span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column: Images */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
              <img
                src={product.images?.[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                  -{discountPct}%
                </span>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                      idx === selectedImage
                        ? 'border-slate-900 ring-1 ring-slate-900/10'
                        : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Details */}
          <div className="space-y-6">
            {/* Product name */}
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-slate-900">
                {formatPrice(effectivePrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-slate-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Stock status */}
            {stock !== Infinity && (
              <div>
                {outOfStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Agotado
                  </span>
                ) : lowStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Solo quedan {stock} unidades
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    En stock ({stock} disponibles)
                  </span>
                )}
              </div>
            )}

            {/* Variant selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Variantes</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isDisabled = variant.stock !== undefined && variant.stock <= 0;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={isDisabled}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          selectedVariant?.id === variant.id
                            ? 'bg-primary text-white shadow-md'
                            : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        } ${isDisabled ? 'cursor-not-allowed opacity-40' : 'active:scale-[0.98]'}`}
                      >
                        {variant.name}
                        {variant.price ? ` - ${formatPrice(variant.price)}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                <button
                  aria-label="Disminuir cantidad"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-11 w-14 items-center justify-center text-sm font-semibold text-slate-900 border-x border-slate-200">
                  {quantity}
                </span>
                <button
                  aria-label="Aumentar cantidad"
                  onClick={() => setQuantity(Math.min(stock === Infinity ? 99 : stock, quantity + 1))}
                  disabled={quantity >= (stock === Infinity ? 99 : stock)}
                  className="flex h-11 w-11 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] ${
                  addedToCart
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
                } disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}
              >
                <ShoppingCart className="h-4 w-4" />
                {addedToCart ? 'Agregado' : outOfStock ? 'Agotado' : 'Agregar al carrito'}
              </button>
            </div>

            {/* Shipping info */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Truck className="h-4 w-4 text-slate-400" />
              <span>Envíos a todo el país</span>
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-slate-400">
                SKU: <span className="font-medium text-slate-500">{product.sku}</span>
              </p>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
