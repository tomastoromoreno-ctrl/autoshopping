import { ReactNode } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import CartIcon from '@/components/CartIcon';
import StoreMobileNav from '@/components/StoreMobileNav';
import WhatsAppButton from '@/components/WhatsAppButton';
import { StoreJsonLd } from '@/components/JsonLd';
import StoreSelector from '@/components/StoreSelector';

interface StoreLayoutProps {
  children: ReactNode;
  params: { subdomain: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
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

  let categories: Category[] = [];
  try {
    const res = await fetch(`${apiUrl}/categories/${params.subdomain}`, { cache: 'no-store' });
    if (res.ok) categories = await res.json();
  } catch (err) {
    console.error('Error fetching categories in layout:', err);
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="sticky top-0 z-40 h-16 border-b border-gray-100 bg-white/80 backdrop-blur-xl" />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
              <div className="flex gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                    <div className="aspect-square animate-pulse bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Premium Themes Overrides
  let finalBg = store.bg_color || '#ffffff';
  let finalBtn = store.btn_color || store.primary_color || '#2563eb';
  let finalBtnText = store.btn_text_color || '#ffffff';
  let finalFont = store.font_family || 'Inter';
  let finalTextColor = store.text_color || '#0f172a';
  let additionalStyles = '';

  const templateId = (store as any).template_id || 'classic';

  if (templateId === 'minimalist') {
    finalBg = '#f8fafc';
    finalBtn = '#0f172a';
    finalBtnText = '#ffffff';
    finalFont = 'Outfit';
    finalTextColor = '#334155';
    additionalStyles = `
      .store-btn { border-radius: 6px !important; }
      .store-btn-outline { border-radius: 6px !important; }
      .store-input { border-radius: 6px !important; }
    `;
  } else if (templateId === 'streetwear') {
    finalBg = '#ffffff';
    finalBtn = '#facc15'; // bright yellow
    finalBtnText = '#000000';
    finalFont = 'Montserrat';
    finalTextColor = '#000000';
    additionalStyles = `
      .store-btn { border: 3px solid #000000 !important; border-radius: 0px !important; box-shadow: 4px 4px 0px #000000 !important; font-weight: 900 !important; text-transform: uppercase !important; }
      .store-btn:hover { background-color: #ffffff !important; color: #000000 !important; }
      .store-btn-outline { border: 3px solid #000000 !important; border-radius: 0px !important; box-shadow: 4px 4px 0px #000000 !important; font-weight: 900 !important; }
      .store-btn-outline:hover { background-color: #facc15 !important; color: #000000 !important; }
      .store-bg-card { border: 3px solid #000000 !important; border-radius: 0px !important; box-shadow: 4px 4px 0px #000000 !important; }
      .store-input { border: 3px solid #000000 !important; border-radius: 0px !important; }
      .store-chip-active { border: 3px solid #000000 !important; border-radius: 0px !important; box-shadow: 2px 2px 0px #000000 !important; }
      .store-chip-inactive { border: 3px solid #000000 !important; border-radius: 0px !important; }
    `;
  } else if (templateId === 'luxury') {
    finalBg = '#fcfaf7';
    finalBtn = '#1e3a1e'; // deep forest green
    finalBtnText = '#fcfaf7';
    finalFont = 'Playfair Display';
    finalTextColor = '#1a0f00';
    additionalStyles = `
      body { letter-spacing: 0.05em !important; }
      .store-brand { color: #b59410 !important; font-family: 'Playfair Display', serif !important; }
      .store-btn { border-radius: 0px !important; letter-spacing: 0.1em !important; border: 1px solid #1e3a1e !important; text-transform: uppercase !important; font-size: 11px !important; }
      .store-btn-outline { border-radius: 0px !important; border: 1px solid #1e3a1e !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; font-size: 11px !important; }
      .store-bg-card { border-radius: 0px !important; border: 1px solid #e5d8c5 !important; }
    `;
  } else if (templateId === 'cyberpunk') {
    finalBg = '#0b0416';
    finalBtn = '#ff007f'; // neon pink
    finalBtnText = '#ffffff';
    finalFont = 'Outfit';
    finalTextColor = '#e2d9f3';
    additionalStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      body { font-family: 'Orbitron', sans-serif !important; background-image: radial-gradient(circle at 50% 50%, #160a2c 0%, #0b0416 100%) !important; }
      .store-brand { color: #00f3ff !important; font-family: 'Orbitron', sans-serif !important; text-shadow: 0 0 10px rgba(0,243,255,0.4) !important; }
      .store-btn { border-radius: 4px !important; text-transform: uppercase !important; font-weight: bold !important; box-shadow: 0 0 12px rgba(255,0,127,0.5) !important; border: 1px solid #ff007f !important; }
      .store-btn:hover { background-color: #0b0416 !important; color: #ff007f !important; box-shadow: 0 0 16px rgba(255,0,127,0.8) !important; }
      .store-btn-outline { border-radius: 4px !important; border: 1px solid #00f3ff !important; color: #00f3ff !important; box-shadow: 0 0 12px rgba(0,243,255,0.4) !important; }
      .store-btn-outline:hover { background-color: #00f3ff !important; color: #0b0416 !important; }
      .store-bg-card { border-radius: 4px !important; border: 1px solid #2d1f4d !important; background-color: rgba(18,10,36,0.7) !important; backdrop-filter: blur(10px) !important; }
      .store-input { border: 1px solid #2d1f4d !important; background-color: #120a24 !important; color: #ffffff !important; }
      .store-header { background-color: rgba(11,4,22,0.85) !important; border-color: #2d1f4d !important; backdrop-filter: blur(10px) !important; }
    `;
  } else if (templateId === 'playful') {
    finalBg = '#fffaf0';
    finalBtn = '#ff6b6b';
    finalBtnText = '#ffffff';
    finalFont = 'Poppins';
    finalTextColor = '#4a2c2c';
    additionalStyles = `
      .store-btn { border-radius: 9999px !important; font-weight: 700 !important; }
      .store-btn-outline { border-radius: 9999px !important; font-weight: 700 !important; }
      .store-bg-card { border-radius: 24px !important; border-width: 2px !important; }
      .store-input { border-radius: 9999px !important; }
      .store-chip-active { border-radius: 9999px !important; }
      .store-chip-inactive { border-radius: 9999px !important; }
    `;
  } else if (templateId === 'retro') {
    finalBg = '#f4ede4';
    finalBtn = '#a0522d';
    finalBtnText = '#f4ede4';
    finalFont = 'Montserrat';
    finalTextColor = '#2e251b';
    additionalStyles = `
      body { background-image: radial-gradient(#d3c6b6 1px, transparent 1px) !important; background-size: 16px 16px !important; }
      .store-btn { border-radius: 2px !important; font-family: monospace !important; border: 1px solid #2e251b !important; }
      .store-btn-outline { border-radius: 2px !important; font-family: monospace !important; border: 1px solid #2e251b !important; }
      .store-bg-card { border-radius: 2px !important; border: 1px solid #2e251b !important; background-color: #fcfbf9 !important; }
      .store-input { border-radius: 2px !important; border: 1px solid #2e251b !important; }
    `;
  } else if (templateId === 'tech') {
    finalBg = '#0c0c0d';
    finalBtn = '#3b82f6';
    finalBtnText = '#ffffff';
    finalFont = 'Inter';
    finalTextColor = '#d1d5db';
    additionalStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap');
      body { font-family: 'Fira Code', monospace !important; }
      .store-btn { border-radius: 0px !important; font-family: 'Fira Code', monospace !important; border: 1px solid #3b82f6 !important; }
      .store-btn-outline { border-radius: 0px !important; font-family: 'Fira Code', monospace !important; border: 1px solid #374151 !important; }
      .store-bg-card { border-radius: 0px !important; border: 1px solid #1f2937 !important; background-color: #121214 !important; }
      .store-input { border-radius: 0px !important; border: 1px solid #1f2937 !important; background-color: #09090b !important; }
      .store-header { background-color: #0c0c0d !important; border-color: #1f2937 !important; }
    `;
  } else if (templateId === 'organic') {
    finalBg = '#f5f4ee';
    finalBtn = '#2d4b3c';
    finalBtnText = '#f5f4ee';
    finalFont = 'Outfit';
    finalTextColor = '#2c3531';
    additionalStyles = `
      .store-btn { border-radius: 12px !important; }
      .store-btn-outline { border-radius: 12px !important; }
      .store-bg-card { border-radius: 16px !important; border-color: #d8d6cb !important; }
      .store-input { border-radius: 12px !important; }
    `;
  } else if (templateId === 'sunset') {
    finalBg = '#200b2c';
    finalBtn = '#f97316';
    finalBtnText = '#ffffff';
    finalFont = 'Poppins';
    finalTextColor = '#fdf4ff';
    additionalStyles = `
      body { background-image: linear-gradient(to bottom, #200b2c, #4c1d95) !important; background-attachment: fixed !important; }
      .store-brand { background: linear-gradient(to right, #f97316, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .store-btn { border-radius: 8px !important; background-image: linear-gradient(to right, #f97316, #db2777) !important; border: none !important; }
      .store-btn-outline { border-radius: 8px !important; border: 1px solid #ec4899 !important; color: #ec4899 !important; }
      .store-bg-card { border-radius: 12px !important; border: 1px solid #4c1d95 !important; background-color: rgba(32,11,44,0.6) !important; backdrop-filter: blur(12px) !important; }
      .store-header { background-color: rgba(32,11,44,0.8) !important; border-color: #4c1d95 !important; }
    `;
  }

  const fontImport = finalFont !== 'Inter'
    ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(finalFont)}:wght@400;500;600;700;900&display=swap');`
    : '';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <StoreJsonLd
        storeName={store.name}
        storeUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://web-autoshopping.vercel.app'}/store/${params.subdomain}`}
        description={store.description}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        ${fontImport}
        :root {
          --store-btn: ${finalBtn};
          --store-btn-text: ${finalBtnText};
          --store-bg: ${finalBg};
          --store-text: ${finalTextColor};
        }
        body {
          background-color: ${finalBg} !important;
          color: ${finalTextColor} !important;
          font-family: '${finalFont}', 'Inter', sans-serif !important;
        }
        .store-brand {
          color: ${finalBtn} !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .store-btn { background-color: ${finalBtn} !important; color: ${finalBtnText} !important; }
        .store-btn:hover { opacity: 0.9; }
        .store-btn-outline { border-color: ${finalBtn} !important; color: ${finalBtn} !important; }
        .store-btn-outline:hover { background-color: ${finalBtn} !important; color: ${finalBtnText} !important; }
        .store-text { color: ${finalTextColor} !important; }
        .store-text-muted { color: ${finalTextColor} !important; opacity: 0.7; }
        .store-text-subtle { color: ${finalTextColor} !important; opacity: 0.5; }
        .store-bg { background-color: ${finalBg} !important; }
        .store-bg-card { background-color: ${finalBg} !important; border-color: ${finalTextColor}1a !important; }
        .store-link { color: ${finalBtn} !important; }
        .store-link:hover { opacity: 0.8; }
        .store-chip-active { background-color: ${finalBtn} !important; color: ${finalBtnText} !important; }
        .store-chip-inactive { border-color: ${finalTextColor}20 !important; color: ${finalTextColor} !important; }
        .store-chip-inactive:hover { border-color: ${finalTextColor}40 !important; }
        .store-input { border-color: ${finalTextColor}20 !important; }
        .store-input:focus { border-color: ${finalBtn} !important; box-shadow: 0 0 0 2px ${finalBtn}20 !important; }
        
        .store-header {
          background-color: color-mix(in srgb, ${finalBg} 80%, transparent) !important;
          border-color: color-mix(in srgb, ${finalTextColor} 10%, transparent) !important;
          color: ${finalTextColor} !important;
        }
        .store-nav-link {
          color: ${finalTextColor} !important;
          opacity: 0.75;
          transition: all 0.2s ease-out;
        }
        .store-nav-link:hover {
          opacity: 1;
          background-color: color-mix(in srgb, ${finalTextColor} 8%, transparent) !important;
          color: ${finalTextColor} !important;
        }
        .store-dropdown {
          background-color: ${finalBg} !important;
          border-color: color-mix(in srgb, ${finalTextColor} 10%, transparent) !important;
          color: ${finalTextColor} !important;
        }
        .store-dropdown-link {
          color: ${finalTextColor} !important;
          opacity: 0.8;
          transition: all 0.15s ease;
        }
        .store-dropdown-link:hover {
          opacity: 1;
          background-color: color-mix(in srgb, ${finalTextColor} 8%, transparent) !important;
          color: ${finalTextColor} !important;
        }
        .store-border-t { border-top: 1px solid color-mix(in srgb, ${finalTextColor} 10%, transparent) !important; }
        .store-border-b { border-bottom: 1px solid color-mix(in srgb, ${finalTextColor} 10%, transparent) !important; }
        .store-border-l { border-left: 1px solid color-mix(in srgb, ${finalTextColor} 10%, transparent) !important; }
        .store-border-r { border-right: 1px solid color-mix(in srgb, ${finalTextColor} 10%, transparent) !important; }
        .store-mobile-panel {
          background-color: ${finalBg} !important;
          color: ${finalTextColor} !important;
        }

        ${additionalStyles}
      ` }} />

      {/* Store Header */}
      {store.header_style === 'centered' ? (
        <header className="sticky top-0 z-40 w-full border-b store-border-b store-header backdrop-blur-xl">
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
              <span className="text-lg font-bold truncate sm:text-xl store-brand">
                {store.name}
              </span>
            </Link>
          </div>
          <div className="border-t store-border-t">
            <div className="mx-auto flex max-w-7xl justify-center gap-1 px-4 py-1">
              <Link
                href={`/store/${params.subdomain}`}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
              >
                Inicio
              </Link>
              <Link
                href={`/store/${params.subdomain}#productos`}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
              >
                Productos
              </Link>
              {categories.length > 0 && (
                <div className="relative group">
                  <button className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out inline-flex items-center gap-1 store-nav-link">
                    Categorías
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180 text-[var(--store-text)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-48 rounded-xl border p-1.5 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out z-50 store-dropdown">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/store/${params.subdomain}?category_id=${cat.id}#productos`}
                        className="block rounded-lg px-3 py-2 text-sm transition-colors text-left store-dropdown-link"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <Link
                href={`/store/${params.subdomain}/orders`}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
              >
                Mis Pedidos
              </Link>
              <Link
                href={`/store/${params.subdomain}/account`}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
              >
                Mi Cuenta
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 w-full border-b store-border-b store-header backdrop-blur-xl">
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
              <span className="text-lg font-bold truncate sm:text-xl store-brand">
                {store.name}
              </span>
            </Link>

            {store.header_style !== 'minimal' && (
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href={`/store/${params.subdomain}`}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
                >
                  Inicio
                </Link>
                <Link
                  href={`/store/${params.subdomain}#productos`}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
                >
                  Productos
                </Link>
                {categories.length > 0 && (
                  <div className="relative group">
                    <button className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out inline-flex items-center gap-1 store-nav-link">
                      Categorías
                      <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180 text-[var(--store-text)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-1 w-48 rounded-xl border p-1.5 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out z-50 store-dropdown">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/store/${params.subdomain}?category_id=${cat.id}#productos`}
                          className="block rounded-lg px-3 py-2 text-sm transition-colors text-left store-dropdown-link"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <Link
                  href={`/store/${params.subdomain}/orders`}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Mis Pedidos
                </Link>
                <Link
                  href={`/store/${params.subdomain}/account`}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi Cuenta
                </Link>
              </nav>
            )}

            <div className="flex items-center gap-3">
              <StoreSelector
                languages={(store as any).languages || []}
                currencies={(store as any).currencies || []}
              />
              <Link
                href={`/store/${params.subdomain}/orders`}
                className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Mis Pedidos
              </Link>
              <Link
                href={`/store/${params.subdomain}/account`}
                className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi Cuenta
              </Link>
              <CartIcon storeSubdomain={params.subdomain} />
              <StoreMobileNav
                subdomain={params.subdomain}
                storeName={store.name}
                storeLogo={store.logo || store.logo_url}
                categories={categories}
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
                  style={{ color: finalBtn, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
                  <Link href={`/store/${params.subdomain}/privacy`} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    Política de Privacidad
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Síguenos</h3>
                <div className="flex items-center gap-3">
                  {store.social_instagram && (
                    <a href={store.social_instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200" title="Instagram" aria-label="Instagram">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {store.social_facebook && (
                    <a href={store.social_facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200" title="Facebook" aria-label="Facebook">
                      <span className="text-sm font-bold">f</span>
                    </a>
                  )}
                  {store.social_whatsapp && (
                    <a href={`https://wa.me/${store.social_whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200" title="WhatsApp" aria-label="WhatsApp">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  {store.social_twitter && (
                    <a href={store.social_twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200" title="Twitter" aria-label="Twitter">
                      <span className="text-sm font-bold">X</span>
                    </a>
                  )}
                  {store.social_tiktok && (
                    <a href={store.social_tiktok} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200" title="TikTok" aria-label="TikTok">
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
                >
                  {store.name}
                </Link>
                {store.description && (
                  <p className="mt-3 text-sm text-slate-400">{store.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  {store.social_instagram && (
                    <a href={store.social_instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" title="Instagram" aria-label="Instagram">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {store.social_facebook && (
                    <a href={store.social_facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" title="Facebook" aria-label="Facebook">
                      <span className="text-sm font-bold">f</span>
                    </a>
                  )}
                  {store.social_whatsapp && (
                    <a href={`https://wa.me/${store.social_whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" title="WhatsApp" aria-label="WhatsApp">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  {store.social_twitter && (
                    <a href={store.social_twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" title="Twitter" aria-label="Twitter">
                      <span className="text-sm font-bold">X</span>
                    </a>
                  )}
                  {store.social_tiktok && (
                    <a href={store.social_tiktok} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" title="TikTok" aria-label="TikTok">
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
            <div className="mt-8 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <span>&copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</span>
              <Link href={`/store/${params.subdomain}/privacy`} className="hover:text-white transition-colors">
                Política de Privacidad
              </Link>
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
                style={{ color: finalBtn, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {store.name}
              </Link>
              {store.description && (
                <p className="mt-2 max-w-md text-sm text-slate-500">{store.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <Link href={`/store/${params.subdomain}/privacy`} className="transition-colors duration-200 hover:text-slate-600">
                  Política de Privacidad
                </Link>
                {store.config?.sales_policy && (
                  <>
                    <span className="text-slate-300">|</span>
                    <Link href={`/store/${params.subdomain}/policies/sales`} className="transition-colors duration-200 hover:text-slate-600">
                      Políticas de Venta
                    </Link>
                  </>
                )}
                {store.config?.shipping_policy && (
                  <>
                    <span className="text-slate-300">|</span>
                    <Link href={`/store/${params.subdomain}/policies/shipping`} className="transition-colors duration-200 hover:text-slate-600">
                      Políticas de Envío
                    </Link>
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
