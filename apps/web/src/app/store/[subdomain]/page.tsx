'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import ProductFilters from '@/components/ProductFilters';
import BannerCarousel from '@/components/BannerCarousel';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import CategoryShowcase from '@/components/CategoryShowcase';
import { Package, Search, X, ChevronDown, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  images?: string[];
  stock?: number;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreData {
  id: string;
  name: string;
  logo?: string;
  primary_color?: string;
  description?: string;
  card_style?: 'standard' | 'compact' | 'horizontal';
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  btn_text?: string;
  bg_color?: string;
  text_color?: string;
}

interface Promotion {
  id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  starts_at: string;
  ends_at: string;
}

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name_asc', label: 'A - Z' },
];

export default function StoreHomePage({ params }: { params: { subdomain: string } }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showError, setShowError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchProducts = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('search', searchQuery);
      if (selectedCategory) queryParams.set('category_id', selectedCategory);
      if (priceRange.min) queryParams.set('min_price', priceRange.min);
      if (priceRange.max) queryParams.set('max_price', priceRange.max);
      if (sortBy) queryParams.set('sort', sortBy);
      queryParams.set('limit', '50');

      const res = await fetch(`${apiUrl}/products/${params.subdomain}?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || data.products || [];
        setProducts(items);
        setTotalCount(data.total || items.length);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, priceRange, sortBy, apiUrl, params.subdomain]);

  useEffect(() => {
    async function load() {
      try {
        const [storeRes, categoriesRes, bannersRes, featuredRes] = await Promise.all([
          fetch(`${apiUrl}/stores/${params.subdomain}/public`),
          fetch(`${apiUrl}/categories/${params.subdomain}`).catch(() => null),
          fetch(`${apiUrl}/stores/${params.subdomain}/banners`).catch(() => null),
          fetch(`${apiUrl}/products/${params.subdomain}/featured?limit=8`).catch(() => null),
        ]);

        let storeId: string | null = null;
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
          storeId = storeData.id;
        }

        if (categoriesRes?.ok) {
          const data = await categoriesRes.json();
          setCategories(Array.isArray(data) ? data : data.categories || data.data || []);
        }

        if (bannersRes?.ok) {
          const data = await bannersRes.json();
          setBanners(Array.isArray(data) ? data : data.banners || data.data || []);
        }

        if (featuredRes?.ok) {
          const data = await featuredRes.json();
          setFeatured(Array.isArray(data) ? data : data.data || data.products || []);
        }

        // Fetch active promotions
        if (storeId) {
          fetch(`${apiUrl}/promotions/${storeId}/active`)
            .then((r) => r.ok ? r.json() : [])
            .then((data) => { setPromotions(Array.isArray(data) ? data : data.promotions || data.data || []); })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Error loading store data:', err);
      }
    }

    load();
  }, [params.subdomain, apiUrl]);

  // Only show error state after 5s if store never loaded
  useEffect(() => {
    if (!loading && !store) {
      const timer = setTimeout(() => setShowError(true), 5000);
      return () => clearTimeout(timer);
    }
    if (store) setShowError(false);
  }, [loading, store]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePriceChange = useCallback((min: string, max: string) => {
    setPriceRange({ min, max });
  }, []);

  const handleApplyFilters = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
  }, []);

  function handleAddToCart(product: Product) {
    const cartKey = `cart_${params.subdomain}`;
    const existing = localStorage.getItem(cartKey);
    const cart = existing ? JSON.parse(existing) : [];

    const existingIdx = cart.findIndex((item: any) => item.product_id === product.id);
    if (existingIdx >= 0) {
      cart[existingIdx].quantity += 1;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '/placeholder.svg',
        quantity: 1,
        slug: product.slug,
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  }

  if (!store) {
    if (showError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 mb-6">
            <Package className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900">Tienda no disponible</h1>
          <p className="mt-2 text-lg text-slate-500">No se pudo cargar la tienda</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">Reintentar</button>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            <div className="flex gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                  <div className="aspect-square animate-pulse bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchQuery || selectedCategory || priceRange.min || priceRange.max;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Banner Carousel - Centered */}
      <section className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mx-auto max-w-4xl">
          <BannerCarousel banners={banners} storeName={store.name} />
        </div>
      </section>

      {/* 2. Category Showcase - Horizontal scroll */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mx-auto max-w-7xl">
          <CategoryShowcase
            categories={categories}
            subdomain={params.subdomain}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </section>

      {/* 3. Compact search + filter bar */}
      <section className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-7xl">
          {/* Desktop: search + sort + filter inline */}
            <div className="hidden lg:flex items-center gap-3">
            <div className="flex-1 max-w-xl">
              <SearchBar onSearch={handleSearch} placeholder={`Buscar en ${store.name}...`} subdomain={params.subdomain} apiUrl={apiUrl} />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="store-input appearance-none rounded-xl border bg-white px-4 py-2.5 pr-9 text-sm font-medium outline-none transition-all duration-200 hover:border-gray-300 cursor-pointer store-text"
                title="Ordenar productos"
                aria-label="Ordenar productos"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="store-input appearance-none rounded-xl border bg-white px-4 py-2.5 pr-9 text-sm font-medium outline-none transition-all duration-200 hover:border-gray-300 cursor-pointer store-text"
                title="Filtrar por categoría"
                aria-label="Filtrar por categoría"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {(priceRange.min || priceRange.max) && (
              <button
                onClick={() => setPriceRange({ min: '', max: '' })}
                className="store-btn-outline flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Precio
              </button>
            )}
          </div>

          {/* Mobile: category chips + search + filter button */}
          <div className="lg:hidden space-y-3">
            {/* Category chips horizontal scroll */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    !selectedCategory
                      ? 'store-chip-active'
                      : 'store-chip-inactive bg-white'
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? 'store-chip-active'
                        : 'store-chip-inactive bg-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Search + filter button row */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} placeholder={`Buscar en ${store.name}...`} subdomain={params.subdomain} apiUrl={apiUrl} />
              </div>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="store-btn-outline flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-sm"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {(priceRange.min || priceRange.max || sortBy !== 'newest') && (
                  <span className="h-2 w-2 rounded-full bg-primary-500" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="font-heading text-lg font-bold text-slate-900">Filtros</h2>
                  <button
                    aria-label="Cerrar filtros"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ordenar por</label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-white text-slate-900 px-4 py-3 pr-10 text-sm font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                          title="Ordenar productos (Móvil)"
                          aria-label="Ordenar productos"
                        >
                          {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rango de precio</h3>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                          <input
                            type="number"
                            placeholder="Mín"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 bg-white text-slate-900 pl-7 pr-3 py-3 text-sm font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 placeholder:text-slate-400"
                          />
                        </div>
                        <span className="text-slate-300 font-medium">—</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                          <input
                            type="number"
                            placeholder="Máx"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 bg-white text-slate-900 pl-7 pr-3 py-3 text-sm font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                  <button
                    onClick={() => { handleApplyFilters(); setMobileFiltersOpen(false); }}
                    className="store-btn w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                  >
                    Aplicar filtros
                  </button>
                  <button
                    onClick={() => { handleClearFilters(); setMobileFiltersOpen(false); }}
                    className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active filters display */}
      {hasActiveFilters && (
        <section className="px-4 sm:px-6 lg:px-8 pb-2">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtros:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 border border-primary-100">
                  &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-500 transition-all hover:bg-primary-200 hover:text-primary-700"
                    title="Eliminar filtro de búsqueda"
                    aria-label="Eliminar filtro de búsqueda"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 border border-primary-100">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-500 transition-all hover:bg-primary-200 hover:text-primary-700"
                    title="Eliminar filtro de categoría"
                    aria-label="Eliminar filtro de categoría"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 border border-primary-100">
                  ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                  <button
                    onClick={() => setPriceRange({ min: '', max: '' })}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-500 transition-all hover:bg-primary-200 hover:text-primary-700"
                    title="Eliminar filtro de precio"
                    aria-label="Eliminar filtro de precio"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="ml-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600 hover:underline"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Carousel */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FeaturedCarousel
            products={featured}
            subdomain={params.subdomain}
            onAddToCart={handleAddToCart}
            cardStyle={store.card_style}
          />
        </div>
      </section>

      {/* 4.5. Active Promotions */}
      {promotions.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
              </span>
              <h2 className="text-2xl font-heading font-bold store-text">Promociones activas</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((promo) => {
                const endsDate = new Date(promo.ends_at);
                const now = new Date();
                const hoursLeft = Math.max(0, Math.floor((endsDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
                const daysLeft = Math.floor(hoursLeft / 24);
                return (
                  <div key={promo.id} className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-5">
                    <div className="absolute top-3 right-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `$${promo.discount_value} OFF`}
                    </div>
                    <h3 className="text-lg font-heading font-bold text-slate-900 pr-20">{promo.name}</h3>
                    {promo.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{promo.description}</p>}
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      {promo.min_purchase && (
                        <span className="rounded-full bg-white/80 px-2.5 py-1 font-medium">Compra mínima: ${promo.min_purchase.toLocaleString('es-CL')}</span>
                      )}
                      {hoursLeft > 0 && (
                        <span className={`rounded-full px-2.5 py-1 font-medium ${hoursLeft < 24 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-white/80 text-slate-600'}`}>
                          {daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h restantes` : `${hoursLeft}h restantes`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. All Products heading */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold store-text">Todos los productos</h2>
            <span className="text-sm text-slate-500 font-medium">{totalCount} productos</span>
          </div>
        </div>
      </section>

      {/* 6. Product grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mx-auto max-w-7xl">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900">No se encontraron productos</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Prueba ajustando los filtros para ver más resultados'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:border-gray-300 active:scale-[0.98]"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/store/${params.subdomain}/product/${product.slug}`}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} cardStyle={store.card_style} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. Footer CTA */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">{store.name}</h3>
          <p className="text-sm text-slate-500 mb-6">Gracias por visitarnos</p>
          <Link
            href="#productos"
            className="store-btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
