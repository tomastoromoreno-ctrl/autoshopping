'use client';

import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/format';
import { ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

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
  subdomain?: string;
  onAddToCart?: (product: Product) => void;
  cardStyle?: 'standard' | 'compact' | 'horizontal';
}

export default function ProductCard({ product, subdomain, onAddToCart, cardStyle = 'standard' }: ProductCardProps) {
  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  const productLink = subdomain ? `/store/${subdomain}/product/${product.slug}` : '#';

  const getSrcSet = (url: string) => {
    if (url && url.includes('/images/') && (url.includes('/original') || url.includes('/original.'))) {
      // Find the last segment path
      const lastSlash = url.lastIndexOf('/');
      const baseUrl = url.substring(0, lastSlash);
      return `${baseUrl}/small.webp 400w, ${baseUrl}/medium.webp 800w, ${baseUrl}/large.webp 1600w`;
    }
    return undefined;
  };

  const srcSet = getSrcSet(imageUrl);

  if (cardStyle === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="product-card group rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden store-bg-card"
      >
        <Link href={productLink} className="block">
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            <img
              src={imageUrl}
              srcSet={srcSet}
              sizes="(max-width: 640px) 150px, 300px"
              loading="lazy"
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            {hasDiscount && (
              <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
                -{discountPercent}%
              </span>
            )}
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <span className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Agotado</span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Eye className="h-3.5 w-3.5" /> Ver producto
              </span>
            </div>
          </div>
        </Link>
        <div className="p-3">
          <Link href={productLink}>
            <h3 className="text-xs font-semibold store-text line-clamp-2 hover:text-primary transition-colors duration-150">{product.name}</h3>
          </Link>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm font-bold store-text">{formatPrice(product.price)}</span>
            {hasDiscount && <span className="text-xs text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>}
          </div>
          {onAddToCart && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onAddToCart(product)}
              disabled={outOfStock}
              className="store-btn mt-2 w-full rounded-xl py-2 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {outOfStock ? 'Agotado' : 'Agregar'}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  if (cardStyle === 'horizontal') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="product-card group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-card store-bg-card"
      >
        <Link href={productLink} className="flex-shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-gray-50">
            <img
              src={imageUrl}
              srcSet={srcSet}
              sizes="100px"
              loading="lazy"
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            {hasDiscount && (
              <span className="absolute left-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                -{discountPercent}%
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={productLink}>
            <h3 className="text-sm font-semibold store-text line-clamp-2 hover:text-primary transition-colors duration-150">{product.name}</h3>
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-bold store-text">{formatPrice(product.price)}</span>
            {hasDiscount && <span className="text-xs text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>}
          </div>
          {onAddToCart && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onAddToCart(product)}
              disabled={outOfStock}
              className="store-btn mt-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {outOfStock ? 'Agotado' : 'Agregar'}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Standard card
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="product-card group rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden store-bg-card"
    >
      <Link href={productLink} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            srcSet={srcSet}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 250px"
            loading="lazy"
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {outOfStock && (
            <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Agotado
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Eye className="h-4 w-4" /> Ver producto
            </span>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={productLink}>
          <h3 className="text-sm font-semibold store-text line-clamp-2 mb-2 hover:text-primary transition-colors duration-150">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold store-text">{formatPrice(product.price)}</span>
          {hasDiscount && <span className="text-sm text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>}
        </div>
        {onAddToCart && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onAddToCart(product)}
            disabled={outOfStock}
            className="store-btn mt-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? 'Agotado' : 'Agregar al carrito'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
