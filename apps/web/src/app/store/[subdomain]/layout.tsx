import { ReactNode } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import CartIcon from '@/components/CartIcon';
import StoreMobileNav from '@/components/StoreMobileNav';
import WhatsAppButton from '@/components/WhatsAppButton';
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
  header_style?: 'classic' | 'centered' | 'minimal';
  footer_style?: 'minimal' | 'columns' | 'full';
  card_style?: 'standard' | 'compact' | 'horizontal';
  social_instagram?: string;
  social_facebook?: string;
  social_whatsapp?: string;
  social_twitter?: string;
  social_tiktok?: string;
  config?: {
    sales_policy?: string;
    shipping_policy?: string;
    whatsapp_number?: string;
    whatsapp_message?: string;
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
      {store.header_style === 'centered' ? (
        <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-4">
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
          </div>
          <div className="border-t border-gray-50">
            <div className="mx-auto flex max-w-7xl justify-center gap-1 px-4 py-1">
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
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

            {store.header_style !== 'minimal' && (
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
            )}

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
      )}

      <main className="flex-1">{children}</main>

      {/* WhatsApp floating button */}
      {store.config?.whatsapp_number && (
        <WhatsAppButton
          phoneNumber={store.config.whatsapp_number}
          message={store.config.whatsapp_message}
        />
      )}

      {/* Footer */}
      {store.footer_style === 'columns' ? (
        <footer className="border-t border-gray-100 bg-slate-50/80">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Link
                  href={`/store/${params.subdomain}`}
                  className="text-lg font-bold transition-opacity duration-200 hover:opacity-80"
                  style={{ color: storeBtn, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {store.name}
                </Link>
                {store.description && (
                  <p className="mt-3 text-sm text-slate-500">{store.description}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Enlaces</h3>
                <div className="flex flex-col gap-2">
                  <Link href={`/store/${params.subdomain}`} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    Inicio
                  </Link>
                  <Link href={`/store/${params.subdomain}#productos`} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    Productos
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Síguenos</h3>
                <div className="flex items-center gap-3">
                  {store.social_instagram && (
                    <a href={store.social_instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {store.social_facebook && (
                    <a href={store.social_facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                      <span className="text-sm font-bold">f</span>
                    </a>
                  )}
                  {store.social_whatsapp && (
                    <a href={`https://wa.me/${store.social_whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  {store.social_twitter && (
                    <a href={store.social_twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                      <span className="text-sm font-bold">X</span>
                    </a>
                  )}
                  {store.social_tiktok && (
                    <a href={store.social_tiktok} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-5.58-2.78V2.5h3.45a4.83 4.83 0 004.25 4.19z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      ) : store.footer_style === 'full' ? (
        <footer className="border-t border-gray-100 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Link
                  href={`/store/${params.subdomain}`}
                  className="text-lg font-bold transition-opacity duration-200 hover:opacity-80"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {store.name}
                </Link>
                {store.description && (
                  <p className="mt-3 text-sm text-slate-400">{store.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  {store.social_instagram && (
                    <a href={store.social_instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {store.social_facebook && (
                    <a href={store.social_facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                      <span className="text-sm font-bold">f</span>
                    </a>
                  )}
                  {store.social_whatsapp && (
                    <a href={`https://wa.me/${store.social_whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  {store.social_twitter && (
                    <a href={store.social_twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                      <span className="text-sm font-bold">X</span>
                    </a>
                  )}
                  {store.social_tiktok && (
                    <a href={store.social_tiktok} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-5.58-2.78V2.5h3.45a4.83 4.83 0 004.25 4.19z"/></svg>
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-sm font-semibold mb-3">Suscríbete</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Tu email"
                    className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-white/40"
                  />
                  <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                    Suscribir
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      ) : (
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
      )}
    </div>
  );
}
