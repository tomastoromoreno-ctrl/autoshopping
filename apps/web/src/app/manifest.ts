import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AutoShopping',
    short_name: 'AutoShopping',
    description: 'Plataforma de tiendas online',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
