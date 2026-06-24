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
  font_family?: string;
  bg_color?: string;
  btn_color?: string;
  btn_text_color?: string;
  text_color?: string;
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
    return <>{children}</>;
  }

  const storeBg = store.bg_color || '#ffffff';
  const storeBtn = store.btn_color || store.primary_color || '#2563eb';
  const storeBtnText = store.btn_text_color || '#ffffff';
  const storeFont = store.font_family || 'Inter';
  const storeTextColor = store.text_color || '#0f172a';

  const fontImport = storeFont !== 'Inter'
    ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(storeFont)}:wght@400;500;600;700;900&display=swap');`
    : '';

  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ '--store-primary': storeBtn, '--store-bg': storeBg, '--store-btn': storeBtn, '--store-btn-text': storeBtnText, '--store-text': storeTextColor } as React.CSSProperties}>
      <StoreJsonLd
        storeName={store.name}
        storeUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app'}/store/${params.subdomain}`}
        description={store.description}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        ${fontImport}
        :root {
          --store-btn: ${storeBtn};
          --store-btn-text: ${storeBtnText};
          --store-bg: ${storeBg};
          --store-text: ${storeTextColor};
        }
        body {
          background-color: ${storeBg} !important;
          color: ${storeTextColor} !important;
          font-family: '${storeFont}', 'Inter', sans-serif !important;
        }
        .store-btn { background-color: ${storeBtn} !important; color: ${storeBtnText} !important; }
        .store-btn:hover { opacity: 0.9; }
        .store-btn-outline { border-color: ${storeBtn} !important; color: ${storeBtn} !important; }
        .store-btn-outline:hover { background-color: ${storeBtn} !important; color: ${storeBtnText} !important; }
        .store-text { color: ${storeTextColor} !important; }
        .store-text-muted { color: ${storeTextColor} !important; opacity: 0.7; }
        .store-text-subtle { color: ${storeTextColor} !important; opacity: 0.5; }
        .store-bg { background-color: ${storeBg} !important; }
        .store-bg-card { background-color: ${storeBg} !important; border-color: ${storeTextColor}1a !important; }
        .store-link { color: ${storeBtn} !important; }
        .store-link:hover { opacity: 0.8; }
        .store-chip-active { background-color: ${storeBtn} !important; color: ${storeBtnText} !important; }
        .store-chip-inactive { border-color: ${storeTextColor}20 !important; color: ${storeTextColor} !important; }
        .store-chip-inactive:hover { border-color: ${storeTextColor}40 !important; }
        .store-input { border-color: ${storeTextColor}20 !important; }
        .store-input:focus { border-color: ${storeBtn} !important; box-shadow: 0 0 0 2px ${storeBtn}20 !important; }
      ` }} />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo - Left */}
          <Link
            href={`/store/${params.subdomain}`}
            className="flex items-center gap-2.5 min-w-0 transition-opacity duration-200 hover:opacity-80"
          >
            {(store.logo || store.logo_url) && (
              <img
                src={store.logo || store.logo_url}
                alt={store.name}
                className="h-8 w-8 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <span
              className="text-lg font-bold truncate sm:text-xl"
              style={{ color: storeBtn, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {store.name}
            </span>
          </Link>

          {/* Desktop Nav - Center */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href={`/store/${params.subdomain}`}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50 hover:text-slate-900"
            >
              Inicio
            </Link>
            <Link
              href={`/store/${params.subdomain}#productos`}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50 hover:text-slate-900"
            >
              Productos
            </Link>
          </nav>

          {/* Right - Cart + Mobile Menu */}
          <div className="flex items-center gap-1">
            <CartIcon storeSubdomain={params.subdomain} />
            <StoreMobileNav
              subdomain={params.subdomain}
              storeName={store.name}
              storeLogo={store.logo || store.logo_url}
            />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Link
              href={`/store/${params.subdomain}`}
              className="text-base font-bold transition-opacity duration-200 hover:opacity-80"
              style={{ color: storeBtn, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {store.name}
            </Link>
            {store.description && (
              <p className="mt-2 max-w-md text-sm text-slate-500">{store.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
              {(store.config?.sales_policy || store.config?.shipping_policy) && (
                <>
                  {store.config?.sales_policy && (
                    <Link href={`/store/${params.subdomain}/policies/sales`} className="transition-colors duration-200 hover:text-slate-600">
                      Políticas de Venta
                    </Link>
                  )}
                  {store.config?.sales_policy && store.config?.shipping_policy && (
                    <span className="text-slate-300">|</span>
                  )}
                  {store.config?.shipping_policy && (
                    <Link href={`/store/${params.subdomain}/policies/shipping`} className="transition-colors duration-200 hover:text-slate-600">
                      Políticas de Envío
                    </Link>
                  )}
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-300">
              &copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
