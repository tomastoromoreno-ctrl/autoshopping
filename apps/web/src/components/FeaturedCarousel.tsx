'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  images?: string[];
  stock?: number;
}

interface FeaturedCarouselProps {
  products: Product[];
  title?: string;
  subdomain: string;
  onAddToCart?: (product: Product) => void;
}

export default function FeaturedCarousel({
  products,
  title = 'Destacados',
  subdomain,
  onAddToCart,
}: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -250 : 250;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="py-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-heading font-bold text-slate-900">{title}</h2>
      </div>

      <div className="group/carousel relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-100 bg-white p-2 shadow-lg opacity-0 transition-opacity group-hover/carousel:opacity-100 hover:bg-gray-50"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
        >
          {products.map((product) => {
            const imageUrl = product.images?.[0] || '/placeholder.svg';
            const hasDiscount =
              product.compare_at_price != null && product.compare_at_price > product.price;
            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.compare_at_price! - product.price) /
                    product.compare_at_price!) *
                    100,
                )
              : 0;
            const outOfStock = product.stock != null && product.stock <= 0;

            return (
              <div
                key={product.id}
                className="min-w-[200px] sm:min-w-[240px] max-w-[280px] flex-shrink-0"
              >
                <Link
                  href={`/store/${subdomain}/product/${product.slug}`}
                  className="block rounded-2xl border border-gray-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    {hasDiscount && (
                      <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                        -{discountPercent}%
                      </span>
                    )}
                    {outOfStock && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        Agotado
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {formatPrice(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={outOfStock}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Agregar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-100 bg-white p-2 shadow-lg opacity-0 transition-opacity group-hover/carousel:opacity-100 hover:bg-gray-50"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </button>
      </div>
    </section>
  );
}
