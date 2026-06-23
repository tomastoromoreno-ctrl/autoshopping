import { ReactNode } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import CartIcon from '@/components/CartIcon';
import StoreMobileNav from '@/components/StoreMobileNav';
import { StoreJsonLd } from '@/components/JsonLd';

interface StoreLayoutProps {
  children: ReactNode;
  params: { subdomain: string };
}

interface StoreData {
  id: string;
  name: string;
  logo?: string;
  logo_url?: string;
  primary_color?: string;
  description?: string;
  slogan?: string;
  config?: {
    sales_policy?: string;
    shipping_policy?: string;
  };
}

export async function generateMetadata({ params }: StoreLayoutProps): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  let store: StoreData | null = null;
  try {
    const res = await fetch(`${apiUrl}/stores/${params.subdomain}/public`, { cache: 'no-store' });
    if (res.ok) store = await res.json();
  } catch {}

  if (!store) {
    return {
      title: 'Tienda no encontrada | AutoShopping',
    };
  }

  const title = store.slogan ? `${store.name} | ${store.slogan}` : store.name;
  const favicon = store.logo_url || store.logo || '/favicon.ico';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app';
  const storeUrl = `${siteUrl}/store/${params.subdomain}`;
  const imageUrl = store.logo_url || store.logo || `${siteUrl}/og-store.png`;

  return {
    title,
    description: store.description || `Bienvenido a ${store.name} - Tienda online en AutoShopping`,
    icons: { icon: favicon },
    openGraph: {
      title,
      description: store.description || `Bienvenido a ${store.name}`,
      url: storeUrl,
      siteName: store.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: store.name,
        },
      ],
      locale: 'es_CL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: store.description || `Bienvenido a ${store.name}`,
      images: [imageUrl],
    },
    alternates: {
      canonical: storeUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  let store: StoreData | null = null;
  try {
    const res = await fetch(`${apiUrl}/stores/${params.subdomain}/public`, { cache: 'no-store' });
    if (res.ok) store = await res.json();
  } catch {}

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-slate-600">Tienda no encontrada</p>
        <Link href="/" className="mt-4 text-sm font-medium text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ '--store-primary': store.primary_color || '#3b82f6' } as React.CSSProperties}>
      <StoreJsonLd
        storeName={store.name}
        storeUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app'}/store/${params.subdomain}`}
        description={store.description}
      />
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/store/${params.subdomain}`} className="flex items-center gap-2 min-w-0">
            {(store.logo || store.logo_url) && (
              <img src={store.logo || store.logo_url} alt={store.name} className="h-7 w-7 sm:h-8 sm:w-8 rounded object-cover flex-shrink-0" />
            )}
            <span className="text-lg sm:text-xl font-bold truncate" style={{ color: store.primary_color || '#3b82f6' }}>
              {store.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4 md:gap-6">
            <Link
              href={`/store/${params.subdomain}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Inicio
            </Link>
            <Link
              href={`/store/${params.subdomain}#productos`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Productos
            </Link>
            <CartIcon storeSubdomain={params.subdomain} />
          </nav>

          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-2">
            <CartIcon storeSubdomain={params.subdomain} />
            <StoreMobileNav subdomain={params.subdomain} />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium" style={{ color: store.primary_color || '#3b82f6' }}>
            {store.name}
          </p>
          {store.description && (
            <p className="mt-1 text-xs text-slate-500">{store.description}</p>
          )}
          <p className="mt-3 sm:mt-4 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
          </p>
          {(store.config?.sales_policy || store.config?.shipping_policy) && (
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs text-slate-500">
              {store.config?.sales_policy && (
                <Link href={`/store/${params.subdomain}/policies/sales`} className="hover:underline hover:text-slate-900">
                  Políticas de Venta
                </Link>
              )}
              {store.config?.shipping_policy && (
                <Link href={`/store/${params.subdomain}/policies/shipping`} className="hover:underline hover:text-slate-900">
                  Políticas de Envío
                </Link>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
