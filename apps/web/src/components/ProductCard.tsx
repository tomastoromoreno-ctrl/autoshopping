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
  cardStyle?: 'standard' | 'compact' | 'horizontal';
}

export default function ProductCard({ product, onAddToCart, cardStyle = 'standard' }: ProductCardProps) {
  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  if (cardStyle === 'compact') {
    return (
      <div className="product-card group rounded-2xl border border-gray-100 bg-white shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover store-bg-card">
        <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          {hasDiscount && (
            <span className="badge absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              -{discountPercent}%
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
              <span className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Agotado
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-xs font-semibold store-text line-clamp-2">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-bold store-text">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cardStyle === 'horizontal') {
    return (
      <div className="product-card group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover store-bg-card">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          {hasDiscount && (
            <span className="badge absolute left-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold store-text line-clamp-2">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-bold store-text">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              disabled={outOfStock}
              className="store-btn mt-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              {outOfStock ? 'Agotado' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="product-card group rounded-2xl border border-gray-100 bg-white shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover store-bg-card">
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        {hasDiscount && (
          <span className="badge absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute bottom-2 right-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            Agotado
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold store-text line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold store-text">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
        {onAddToCart && (
          <button
            onClick={() => onAddToCart(product)}
            disabled={outOfStock}
            className="store-btn mt-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {outOfStock ? 'Agotado' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </div>
  );
}
