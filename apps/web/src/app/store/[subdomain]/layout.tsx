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
  const storeBtn = store.btn_color || store.primary_color || '#3b82f6';
  const storeBtnText = store.btn_text_color || '#ffffff';
  const storeFont = store.font_family || 'Inter';
  const storeTextColor = store.text_color || '#1e293b';

  // Dynamic Google Font Import
  const fontImport = storeFont !== 'Inter'
    ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(storeFont)}:wght@400;500;600;700;900&display=swap');`
    : '';

  return (
    <div className="flex min-h-screen flex-col" style={{ '--store-primary': storeBtn } as React.CSSProperties}>
      <StoreJsonLd
        storeName={store.name}
        storeUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app'}/store/${params.subdomain}`}
        description={store.description}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        ${fontImport}
        body {
          background-color: ${storeBg} !important;
          color: ${storeTextColor} !important;
          font-family: '${storeFont}', sans-serif !important;
        }
        /* Override primary button and text backgrounds of Tailwind */
        .bg-primary {
          background-color: ${storeBtn} !important;
        }
        .text-primary {
          color: ${storeBtn} !important;
        }
        .hover\\:bg-primary\\/90:hover {
          background-color: ${storeBtn} !important;
          opacity: 0.9;
        }
        /* Override text color on primary bg */
        .bg-primary.text-white {
          color: ${storeBtnText} !important;
        }
        .bg-primary.text-slate-900 {
          color: ${storeBtnText} !important;
        }
        button.bg-primary {
          color: ${storeBtnText} !important;
        }
        a.bg-primary {
          color: ${storeBtnText} !important;
        }

        /* General page text color overrides (excluding inputs, buttons, white cards/containers, header/footer) */
        main h1, main h2, main h3, main h4, main h5, main h6, main p, main span:not(.text-white):not(.bg-primary *):not(.bg-red-500 *) {
          color: ${storeTextColor};
        }

        /* Overrides for text slate classes directly on page background */
        main .text-slate-900:not(.bg-white *):not(.bg-slate-100 *):not(.bg-slate-50 *):not(button *):not(a *):not(input):not(select),
        main .text-slate-800:not(.bg-white *):not(.bg-slate-100 *):not(.bg-slate-50 *):not(button *):not(a *):not(input):not(select),
        main .text-slate-700:not(.bg-white *):not(.bg-slate-100 *):not(.bg-slate-50 *):not(button *):not(a *):not(input):not(select) {
          color: ${storeTextColor} !important;
        }

        main .text-slate-600:not(.bg-white *):not(.bg-slate-100 *):not(.bg-slate-50 *):not(button *):not(a *):not(input):not(select) {
          color: ${storeTextColor} !important;
          opacity: 0.85;
        }

        main .text-slate-500:not(.bg-white *):not(.bg-slate-100 *):not(.bg-slate-50 *):not(button *):not(a *):not(input):not(select) {
          color: ${storeTextColor} !important;
          opacity: 0.7;
        }

        main .text-slate-400:not(.bg-white *):not(.bg-slate-100 *):not(.bg-slate-50 *):not(button *):not(a *):not(input):not(select) {
          color: ${storeTextColor} !important;
          opacity: 0.6;
        }

        /* Product Cards theme styling (matching the dashboard preview) */
        .group.rounded-xl.border.bg-white {
          background-color: ${storeBg} !important;
          border-color: ${storeTextColor}1a !important;
        }
        .group.rounded-xl.border.bg-white h3,
        .group.rounded-xl.border.bg-white span:not(.bg-red-500 *):not(.bg-primary *) {
          color: ${storeTextColor} !important;
        }
        .group.rounded-xl.border.bg-white span.line-through {
          color: ${storeTextColor} !important;
          opacity: 0.6;
        }
      ` }} />
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
