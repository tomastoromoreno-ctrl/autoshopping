'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Truck, Star, Flame, Eye, Clock, Shield, CreditCard, Package } from 'lucide-react';
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
  view_count?: number;
  sales_count?: number;
  category_id?: string;
  variants?: ProductVariant[];
  has_buy_now?: boolean;
  technical_specs?: Record<string, any>;
  has_shipping_info?: boolean;
  vertical_gallery?: boolean;
  has_zoom?: boolean;
}

interface ProductStats {
  view_count: number;
  sales_count: number;
  stock: number | null;
  recent_viewers: number;
  recent_sales: number;
}

interface PrevNext {
  prev: { id: string; name: string; slug: string; price: number; compare_at_price?: number; images?: string[] } | null;
  next: { id: string; name: string; slug: string; price: number; compare_at_price?: number; images?: string[] } | null;
}

interface StoreConfig {
  shipping_enabled?: boolean;
  shipping_cost?: number;
  free_shipping_min?: number;
  sales_policy?: string;
  shipping_policy?: string;
  whatsapp_number?: string;
  whatsapp_message?: string;
}

export default function ProductDetailPage({
  params,
}: {
  params: { subdomain: string; slug: string };
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<{ name: string; config?: StoreConfig } | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [prevNext, setPrevNext] = useState<PrevNext>({ prev: null, next: null });
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'policies'>('description');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);
  const addToCartRef = useRef<HTMLDivElement>(null);

  // Esc and Arrow keys event listener for lightbox/zoom
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') {
        setSelectedImage((prev) => (product?.images ? (prev === 0 ? product.images.length - 1 : prev - 1) : prev));
      }
      if (e.key === 'ArrowRight') {
        setSelectedImage((prev) => (product?.images ? (prev === product.images.length - 1 ? 0 : prev + 1) : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, product?.images]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Load store config
  useEffect(() => {
    fetch(`${apiUrl}/stores/${params.subdomain}/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStore(data); })
      .catch(() => {});
  }, [params.subdomain, apiUrl]);

  // Load product
  useEffect(() => {
    async function loadProduct() {
      try {
        // Always fetch the product list and find by slug
        const listRes = await fetch(`${apiUrl}/products/${params.subdomain}`).catch(() => null);
        let p: Product | null = null;

        if (listRes?.ok) {
          const data = await listRes.json();
          const items: any[] = Array.isArray(data) ? data : data.products || data.data || [];
          p = items.find((item: any) => item.slug === params.slug || item.id === params.slug) || null;
        }

        if (p) {
          setProduct(p);
          updateSeoMeta(p);

          // Track view
          fetch(`${apiUrl}/products/${p.id}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitor_id: getVisitorId() }),
          }).catch(() => {});

          // Load stats
          fetch(`${apiUrl}/products/${p.id}/stats`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { if (data) setStats(data); setVisitorCount(data?.recent_viewers || 0); })
            .catch(() => {});

          // Load prev/next
          fetch(`${apiUrl}/products/${p.id}/prev-next`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { if (data) setPrevNext(data); })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.subdomain, params.slug, apiUrl]);

  // Simulate visitor fluctuation (realistic +/1 every few seconds)
  useEffect(() => {
    if (!stats) return;
    const interval = setInterval(() => {
      setVisitorCount((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return Math.max(1, Math.min(next, (stats.recent_viewers || 5) + 5));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [stats]);

  // Sticky add-to-cart on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function getVisitorId() {
    if (typeof window === 'undefined') return 'ssr';
    let id = localStorage.getItem('visitor_id');
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('visitor_id', id);
    }
    return id;
  }

  function updateSeoMeta(p: Product) {
    if (!p) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app';
    const productUrl = `${siteUrl}/store/${params.subdomain}/product/${p.slug}`;
    const imageUrl = p.images?.[0] || `${siteUrl}/placeholder.svg`;
    document.title = `${p.name} | Tienda`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); if (name.startsWith('og:')) el.setAttribute('property', name); else el.setAttribute('name', name); document.head.appendChild(el); }
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
    const cartKey = `cart_${params.subdomain}`;
    const existing = localStorage.getItem(cartKey);
    const cart = existing ? JSON.parse(existing) : [];
    const variantId = selectedVariant?.id;
    const cartItemKey = variantId ? `${product.id}_${variantId}` : product.id;
    const existingIdx = cart.findIndex((item: any) => item.cart_item_key === cartItemKey);
    if (existingIdx >= 0) { cart[existingIdx].quantity += quantity; }
    else { cart.push({ cart_item_key: cartItemKey, product_id: product.id, variant_id: variantId, variant_name: selectedVariant?.name, name: product.name, price: getEffectivePrice(), image: product.images?.[0] || '/placeholder.svg', quantity, slug: product.slug }); }
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleBuyNow() {
    if (!product) return;
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
        slug: product.slug 
      }); 
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    router.push(`/store/${params.subdomain}/checkout`);
  }

  function getShippingEstimationText(): string {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    if (day === 0) {
      return "Recíbelo entre el martes y miércoles";
    } else if (day === 6) {
      return "Recíbelo entre el lunes y martes";
    } else if (day === 5) {
      if (hour >= 13) {
        return "Recíbelo entre el martes y miércoles";
      } else {
        return "Recíbelo entre el lunes y martes";
      }
    } else {
      if (hour >= 13) {
        const minDeliveryDay = new Date(now);
        minDeliveryDay.setDate(now.getDate() + 2);
        const maxDeliveryDay = new Date(now);
        maxDeliveryDay.setDate(now.getDate() + 3);
        let minIndex = minDeliveryDay.getDay();
        if (minIndex === 6) {
          minDeliveryDay.setDate(minDeliveryDay.getDate() + 2);
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 2);
        } else if (minIndex === 0) {
          minDeliveryDay.setDate(minDeliveryDay.getDate() + 1);
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 1);
        }
        let maxIndex = maxDeliveryDay.getDay();
        if (maxIndex === 6) {
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 2);
        } else if (maxIndex === 0) {
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 1);
        }
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
        return `Recíbelo entre el ${minDeliveryDay.toLocaleDateString('es-CL', options)} y el ${maxDeliveryDay.toLocaleDateString('es-CL', options)}`;
      } else {
        const minDeliveryDay = new Date(now);
        minDeliveryDay.setDate(now.getDate() + 1);
        const maxDeliveryDay = new Date(now);
        maxDeliveryDay.setDate(now.getDate() + 2);
        let minIndex = minDeliveryDay.getDay();
        if (minIndex === 6) {
          minDeliveryDay.setDate(minDeliveryDay.getDate() + 2);
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 2);
        } else if (minIndex === 0) {
          minDeliveryDay.setDate(minDeliveryDay.getDate() + 1);
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 1);
        }
        let maxIndex = maxDeliveryDay.getDay();
        if (maxIndex === 6) {
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 2);
        } else if (maxIndex === 0) {
          maxDeliveryDay.setDate(maxDeliveryDay.getDate() + 1);
        }
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
        return `Recíbelo entre el ${minDeliveryDay.toLocaleDateString('es-CL', options)} y el ${maxDeliveryDay.toLocaleDateString('es-CL', options)}`;
      }
    }
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
        <button onClick={() => router.push(`/store/${params.subdomain}`)} className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">Volver a la tienda</button>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice();
  const stock = getStock();
  const hasDiscount = product.compare_at_price && product.compare_at_price > effectivePrice;
  const discountPct = hasDiscount ? Math.round(((product.compare_at_price! - effectivePrice) / product.compare_at_price!) * 100) : 0;
  const outOfStock = stock <= 0;
  const lowStock = stock !== Infinity && stock > 0 && stock <= 5;
  const freeShippingMin = store?.config?.free_shipping_min || 0;
  const currentTotal = effectivePrice * quantity;
  const shippingProgress = freeShippingMin > 0 ? Math.min((currentTotal / freeShippingMin) * 100, 100) : 0;
  const amountForFreeShipping = freeShippingMin > 0 ? Math.max(freeShippingMin - currentTotal, 0) : 0;

  const progressStyles = `
    .stock-progress-bar-width { width: ${Math.min((stock / 50) * 100, 100)}% !important; }
    .shipping-progress-bar-width { width: ${shippingProgress}% !important; }
  `;

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: progressStyles }} />
      <ProductJsonLd subdomain={params.subdomain} product={product} storeName={store?.name || 'Tienda'} />

      <div className="container-tight py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => router.push(`/store/${params.subdomain}`)} className="transition-colors hover:text-slate-900">Inicio</button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="truncate text-slate-700 font-medium">{product.name}</span>
        </nav>

        {/* Prev/Next navigation */}
        {(prevNext.prev || prevNext.next) && (
          <div className="mb-4 flex items-center justify-between">
            {prevNext.prev ? (
              <button onClick={() => router.push(`/store/${params.subdomain}/product/${prevNext.prev!.slug}`)} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline truncate max-w-[150px]">{prevNext.prev!.name}</span>
                <span className="sm:hidden">Anterior</span>
              </button>
            ) : <div />}
            {prevNext.next ? (
              <button onClick={() => router.push(`/store/${params.subdomain}/product/${prevNext.next!.slug}`)} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <span className="hidden sm:inline truncate max-w-[150px]">{prevNext.next!.name}</span>
                <span className="sm:hidden">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : <div />}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Images */}
          <div className={`lg:sticky lg:top-24 lg:self-start ${product.vertical_gallery ? 'lg:flex lg:flex-row-reverse lg:gap-4 lg:space-y-0' : 'space-y-4'}`}>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 flex-1">
              <img 
                src={product.images?.[selectedImage] || '/placeholder.svg'} 
                alt={product.name} 
                className={`h-full w-full object-cover transition-transform duration-300 ${product.has_zoom !== false ? 'cursor-zoom-in hover:scale-105' : ''}`}
                onClick={() => {
                  if (product.has_zoom !== false) {
                    setIsLightboxOpen(true);
                  }
                }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} 
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-lg">-{discountPct}%</span>
              )}
              {lowStock && !outOfStock && (
                <span className="absolute top-4 right-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg animate-pulse">¡Últimas unidades!</span>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className={`flex gap-3 overflow-x-auto pb-1 ${product.vertical_gallery ? 'lg:flex-col lg:overflow-y-auto lg:max-h-[500px] lg:pb-0 lg:w-20' : ''}`}>
                {product.images.map((imgUrl, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${idx === selectedImage ? 'border-slate-900 ring-1 ring-slate-900/10' : 'border-transparent hover:border-slate-200'}`}>
                    <img src={imgUrl} alt={product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-5">
            {/* Product name */}
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">{product.name}</h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-slate-900">{formatPrice(effectivePrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">Ahorra {formatPrice(product.compare_at_price! - effectivePrice)}</span>
                </>
              )}
            </div>

            {/* Flash sold - real data */}
            {stats && stats.recent_sales > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm text-orange-700">
                <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                <span><strong>{stats.recent_sales}</strong> vendido{stats.recent_sales !== 1 ? 's' : ''} en las últimas 48 horas</span>
              </div>
            )}

            {/* Visitor counter - real data */}
            {visitorCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Eye className="h-4 w-4 text-slate-400" />
                <span><strong className="text-slate-700">{visitorCount}</strong> persona{visitorCount !== 1 ? 's' : ''} viendo este producto ahora</span>
              </div>
            )}

            {/* Stock countdown - real data */}
            {stock !== Infinity && !outOfStock && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Stock disponible</span>
                  <span className={`font-semibold ${lowStock ? 'text-red-600' : 'text-slate-900'}`}>{stock} unidades</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-500 stock-progress-bar-width ${lowStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </div>
                {lowStock && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> ¡Apúrate! Solo quedan {stock} unidades
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-slate-600 leading-relaxed text-sm">{product.description}</p>
            )}

            {/* Variant selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Variantes</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isDisabled = variant.stock !== undefined && variant.stock <= 0;
                    return (
                      <button key={variant.id} onClick={() => setSelectedVariant(variant)} disabled={isDisabled} className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${selectedVariant?.id === variant.id ? 'bg-primary text-white shadow-md' : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'} ${isDisabled ? 'cursor-not-allowed opacity-40' : 'active:scale-[0.98]'}`}>
                        {variant.name}{variant.price ? ` - ${formatPrice(variant.price)}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ficha Técnica Rápida */}
            {product.technical_specs && Object.keys(product.technical_specs).length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Especificaciones Técnicas</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(product.technical_specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">{key}</span>
                      <span className="text-slate-800 font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart / Buy Now */}
            <div ref={addToCartRef} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                  <button aria-label="Disminuir" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="flex h-11 w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Minus className="h-4 w-4" /></button>
                  <span className="flex h-11 w-14 items-center justify-center text-sm font-semibold text-slate-900 border-x border-slate-200">{quantity}</span>
                  <button aria-label="Aumentar" onClick={() => setQuantity(Math.min(stock === Infinity ? 99 : stock, quantity + 1))} disabled={quantity >= (stock === Infinity ? 99 : stock)} className="flex h-11 w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={handleAddToCart} disabled={outOfStock} className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] ${addedToCart ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'} disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}>
                  <ShoppingCart className="h-4 w-4" />
                  {addedToCart ? '¡Agregado!' : outOfStock ? 'Agotado' : 'Agregar al carrito'}
                </button>
              </div>

              {product.has_buy_now !== false && !outOfStock && (
                <button 
                  onClick={handleBuyNow} 
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4" />
                  Comprar Ahora (Express Checkout)
                </button>
              )}
            </div>

            {/* Free shipping progress bar */}
            {freeShippingMin > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-slate-500" />
                  {amountForFreeShipping > 0 ? (
                    <span className="text-slate-600">Agrega <strong className="text-primary">{formatPrice(amountForFreeShipping)}</strong> más para envío gratis</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">¡Tienes envío gratis!</span>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 shipping-progress-bar-width" />
                </div>
              </div>
            )}

            {/* Shipping info / Dynamic estimation */}
            {product.has_shipping_info !== false ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-sm text-blue-800">
                <div className="flex items-center gap-2 font-semibold">
                  <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Despacho a RM y V Región</span>
                </div>
                <p className="mt-1 text-xs text-blue-600 font-medium">
                  {getShippingEstimationText()}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Truck className="h-4 w-4 text-slate-400" />
                <span>Envíos a todo el país</span>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-medium text-slate-600">Compra segura</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span className="text-[10px] font-medium text-slate-600">Pago seguro</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <Package className="h-5 w-5 text-purple-500" />
                <span className="text-[10px] font-medium text-slate-600">Garantía incluida</span>
              </div>
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-slate-400">SKU: <span className="font-medium text-slate-500">{product.sku}</span></p>
            )}
          </div>
        </div>

        {/* Tabs: Description / Policies */}
        <div className="mt-12 border-t border-slate-100 pt-8">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-6 max-w-md">
            {([['description', 'Descripción'], ['policies', 'Políticas']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
            ))}
          </div>

          {activeTab === 'description' && product.description && (
            <div className="prose prose-sm max-w-none text-slate-600">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6 text-sm text-slate-600">
              {store?.config?.sales_policy && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Políticas de Venta</h3>
                  <p className="whitespace-pre-wrap">{store.config.sales_policy}</p>
                </div>
              )}
              {store?.config?.shipping_policy && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Políticas de Envío</h3>
                  <p className="whitespace-pre-wrap">{store.config.shipping_policy}</p>
                </div>
              )}
              {!store?.config?.sales_policy && !store?.config?.shipping_policy && (
                <p className="text-slate-400">No hay políticas configuradas para esta tienda.</p>
              )}
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div className="mt-12 border-t border-slate-100 pt-8">
          <ProductReviews productId={product.id} />
        </div>
      </div>

      {/* Sticky add-to-cart bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-300">
          <div className="container-tight flex items-center gap-4 py-3">
            <img src={product.images?.[0] || '/placeholder.svg'} alt="" className="h-12 w-12 rounded-lg object-cover hidden sm:block" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">{formatPrice(effectivePrice)}</span>
                {hasDiscount && <span className="text-sm text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>}
              </div>
            </div>
            <button onClick={handleAddToCart} disabled={outOfStock} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all ${addedToCart ? 'bg-emerald-600' : 'bg-primary hover:bg-primary/90'} disabled:opacity-50`}>
              <ShoppingCart className="h-4 w-4" />
              {addedToCart ? '¡Listo!' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {isLightboxOpen && product.images && product.images.length > 0 && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 transition-all duration-300">
          {/* Close Button */}
          <button 
            onClick={() => setIsLightboxOpen(false)} 
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="text-xl px-2">✕</span>
          </button>

          {/* Main Image container with Prev/Next buttons */}
          <div className="relative flex items-center justify-center max-w-4xl w-full aspect-square md:aspect-[4/3] max-h-[70vh]">
            {/* Prev Button */}
            {product.images.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev === 0 ? product.images!.length - 1 : prev - 1));
                }} 
                className="absolute left-4 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/75 transition-all cursor-pointer"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <img 
              src={product.images[selectedImage]} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()} 
            />

            {/* Next Button */}
            {product.images.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev === product.images!.length - 1 ? 0 : prev + 1));
                }} 
                className="absolute right-4 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/75 transition-all cursor-pointer"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Lightbox Thumbnails */}
          {product.images.length > 1 && (
            <div className="mt-6 flex gap-2 overflow-x-auto max-w-full pb-2">
              {product.images.map((imgUrl, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImage(idx)} 
                  aria-label={`Ver imagen ${idx + 1}`}
                  title={`Ver imagen ${idx + 1}`}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${idx === selectedImage ? 'border-white' : 'border-transparent opacity-55 hover:opacity-100'}`}
                >
                  <img src={imgUrl} alt={`Miniatura ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
