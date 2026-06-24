'use client';

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

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <div className="group rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-slate-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        {hasDiscount && (
          <span className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 rounded-full bg-red-500 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="p-2.5 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2">{product.name}</h3>
        <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
          <span className="text-sm sm:text-lg font-bold text-slate-900">
            ${formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] sm:text-sm text-slate-500 line-through">
              ${formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
        {onAddToCart && (
          <button
            onClick={() => onAddToCart(product)}
            disabled={outOfStock}
            className="mt-2 sm:mt-3 w-full rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {outOfStock ? 'Agotado' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </div>
  );
}
