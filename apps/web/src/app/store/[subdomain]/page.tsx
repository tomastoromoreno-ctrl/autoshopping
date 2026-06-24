'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import ProductFilters from '@/components/ProductFilters';
import { getSessionId } from '@/lib/session';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  images?: { url: string }[];
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
        image: product.images?.[0]?.url || '/placeholder.svg',
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (storeNotFound || (!loading && !store)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-slate-600">Tienda no encontrada</p>
      </div>
    );
  }

  if (!store) return null;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-white px-4 pb-10 sm:pb-16 pt-8 sm:pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl">
            {store.name}
          </h1>
          {store.description && (
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-slate-600">{store.description}</p>
          )}
        </div>
      </section>

      <section id="productos" className="px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Search + Filters header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 max-w-md">
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
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    !selectedCategory ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === cat.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600'
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
          {(searchQuery || selectedCategory || priceRange.min || priceRange.max) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Filtros activos:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory(null)} className="hover:text-blue-900">×</button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                  <button onClick={() => setPriceRange({ min: '', max: '' })} className="hover:text-blue-900">×</button>
                </span>
              )}
              <button onClick={handleClearFilters} className="text-xs text-red-500 hover:underline">
                Limpiar todo
              </button>
            </div>
          )}

          {/* Products grid */}
          {products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-medium text-slate-900">No se encontraron productos</p>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Prueba ajustando los filtros'}
              </p>
              {(searchQuery || selectedCategory || priceRange.min || priceRange.max) && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-sm font-medium text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/store/${params.subdomain}/product/${product.slug}`}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
