'use client';

import { useEffect, useState } from 'react';

interface ProductJsonLdProps {
  subdomain: string;
  product: {
    name: string;
    description?: string;
    price: number;
    images?: string[];
    slug: string;
    sku?: string;
    stock?: number;
  };
  storeName: string;
}

export default function ProductJsonLd({ subdomain, product, storeName }: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app';
  const productUrl = `${siteUrl}/store/${subdomain}/product/${product.slug}`;
  const imageUrl = product.images?.[0] || `${siteUrl}/placeholder.svg`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} disponible en ${storeName}`,
    image: imageUrl,
    url: productUrl,
    sku: product.sku || undefined,
    brand: {
      '@type': 'Brand',
      name: storeName,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'CLP',
      price: product.price,
      availability: product.stock !== undefined
        ? product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: storeName,
      },
    },
    aggregateRating: undefined as any,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface StoreJsonLdProps {
  storeName: string;
  storeUrl: string;
  description?: string;
}

export function StoreJsonLd({ storeName, storeUrl, description }: StoreJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: storeName,
    url: storeUrl,
    description: description || `Tienda online ${storeName}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${storeUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
