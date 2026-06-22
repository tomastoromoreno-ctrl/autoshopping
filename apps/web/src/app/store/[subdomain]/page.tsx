'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getSessionId } from '@/lib/session';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  images?: { url: string }[];
  stock?: number;
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    async function load() {
      try {
        const [storeRes, productsRes, categoriesRes] = await Promise.all([
          fetch(`${apiUrl}/stores/${params.subdomain}/public`),
          fetch(`${apiUrl}/products/${params.subdomain}/featured`).catch(() => null),
          fetch(`${apiUrl}/categories/${params.subdomain}`).catch(() => null),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
        }

        if (productsRes?.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : data.products || data.data || []);
        }

        if (categoriesRes?.ok) {
          const data = await categoriesRes.json();
          setCategories(Array.isArray(data) ? data : data.categories || data.data || []);
        }
      } catch (err) {
        console.error('Error loading store data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.subdomain, apiUrl]);

  function handleAddToCart(product: Product) {
    const sessionId = getSessionId();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-slate-600">Tienda no encontrada</p>
      </div>
    );
  }

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

      {categories.length > 0 && (
        <section className="border-b px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-nowrap sm:flex-wrap gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${params.subdomain}?categoria=${cat.slug}`}
                className="rounded-full border bg-white px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:border-primary hover:text-primary whitespace-nowrap flex-shrink-0"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="productos" className="px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Productos destacados</h2>
          {products.length === 0 ? (
            <p className="mt-8 text-center text-slate-500">No hay productos disponibles por el momento.</p>
          ) : (
            <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
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
