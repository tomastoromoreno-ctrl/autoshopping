'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import ProductFilters from '@/components/ProductFilters';
import { Package, Search, X } from 'lucide-react';

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
}

export default function StoreHomePage({ params }: { params: { subdomain: string } }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeNotFound, setStoreNotFound] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');

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
        const [storeRes, categoriesRes] = await Promise.all([
          fetch(`${apiUrl}/stores/${params.subdomain}/public`),
          fetch(`${apiUrl}/categories/${params.subdomain}`).catch(() => null),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
        } else {
          setStoreNotFound(true);
        }

        if (categoriesRes?.ok) {
          const data = await categoriesRes.json();
          setCategories(Array.isArray(data) ? data : data.categories || data.data || []);
        }
      } catch (err) {
        console.error('Error loading store data:', err);
      }
    }

    load();
  }, [params.subdomain, apiUrl]);

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

  // Show spinner while still loading — never flash 404 prematurely
  if (loading && !store && !storeNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm font-medium text-slate-500">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (storeNotFound || (!loading && !store)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 mb-6">
          <Package className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-4xl font-heading font-bold text-slate-900">404</h1>
        <p className="mt-2 text-lg text-slate-500">Tienda no encontrada</p>
      </div>
    );
  }

  if (!store) return null;

  const hasActiveFilters = searchQuery || selectedCategory || priceRange.min || priceRange.max;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 via-white to-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          {store.logo && (
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white shadow-soft-lg sm:h-20 sm:w-20">
                <img
                  src={store.logo}
                  alt={store.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <h1 className="text-4xl font-heading font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {store.name}
          </h1>
          {store.description && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 sm:mt-5">
              {store.description}
            </p>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section id="productos" className="px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Search + Filters header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 max-w-xl">
                <SearchBar onSearch={handleSearch} placeholder={`Buscar en ${store.name}...`} />
              </div>
              <div className="hidden lg:block">
                <ProductFilters
                  categories={categories}
                  selectedCategory={selectedCategory}
                  priceRange={priceRange}
                  sortBy={sortBy}
                  onCategoryChange={setSelectedCategory}
                  onPriceChange={handlePriceChange}
                  onSortChange={setSortBy}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                  productCount={totalCount}
                />
              </div>
            </div>

            {/* Category chips (mobile) */}
            {categories.length > 0 && (
              <div className="mt-5 flex gap-2.5 overflow-x-auto pb-2 lg:hidden scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    !selectedCategory
                      ? 'bg-slate-900 text-white shadow-soft'
                      : 'border border-gray-200 bg-white text-slate-600 shadow-soft hover:border-gray-300 hover:shadow-soft-lg'
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-soft'
                        : 'border border-gray-200 bg-white text-slate-600 shadow-soft hover:border-gray-300 hover:shadow-soft-lg'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Mobile filter button */}
            <div className="mt-4 lg:hidden">
              <ProductFilters
                categories={categories}
                selectedCategory={selectedCategory}
                priceRange={priceRange}
                sortBy={sortBy}
                onCategoryChange={setSelectedCategory}
                onPriceChange={handlePriceChange}
                onSortChange={setSortBy}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                productCount={totalCount}
              />
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtros activos:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-medium text-primary-700 border border-primary-100">
                  &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-500 transition-all duration-200 hover:bg-primary-200 hover:text-primary-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-medium text-primary-700 border border-primary-100">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-500 transition-all duration-200 hover:bg-primary-200 hover:text-primary-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-medium text-primary-700 border border-primary-100">
                  ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                  <button
                    onClick={() => setPriceRange({ min: '', max: '' })}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-500 transition-all duration-200 hover:bg-primary-200 hover:text-primary-700"
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
          )}

          {/* Products grid */}
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/store/${params.subdomain}/product/${product.slug}`}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}