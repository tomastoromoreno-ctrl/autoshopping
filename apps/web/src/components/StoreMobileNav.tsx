'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Home, Package, ShoppingCart, User, ClipboardList } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreMobileNavProps {
  subdomain: string;
  storeName?: string;
  storeLogo?: string;
  categories?: Category[];
}

export default function StoreMobileNav({ subdomain, storeName, storeLogo, categories = [] }: StoreMobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-xl p-2 transition-all duration-200 ease-out sm:hidden store-nav-link"
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
 
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out sm:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
 
        {/* Panel */}
        <div
          ref={panelRef}
          className={`absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col shadow-soft-lg transition-all duration-300 ease-out store-mobile-panel border-l store-border-l ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b store-border-b px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              {storeLogo && (
                <img src={storeLogo} alt={storeName || ''} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
              )}
              <span className="text-sm font-bold truncate font-heading store-text">
                {storeName || 'Menú'}
              </span>
            </div>
            <button
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ease-out store-nav-link"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
 
          {/* Nav Links */}
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <Link
              href={`/store/${subdomain}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
            >
              <Home className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: 'var(--store-text)', opacity: 0.6 }} />
              Inicio
            </Link>
            <Link
              href={`/store/${subdomain}#productos`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
            >
              <Package className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: 'var(--store-text)', opacity: 0.6 }} />
              Productos
            </Link>
            <Link
              href={`/store/${subdomain}/account`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
            >
              <User className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: 'var(--store-text)', opacity: 0.6 }} />
              Mi Cuenta
            </Link>
            <Link
              href={`/store/${subdomain}/orders`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
            >
              <ClipboardList className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: 'var(--store-text)', opacity: 0.6 }} />
              Mis Pedidos
            </Link>
            <Link
              href={`/store/${subdomain}/cart`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out store-nav-link"
            >
              <ShoppingCart className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: 'var(--store-text)', opacity: 0.6 }} />
              Carrito
            </Link>
            {categories && categories.length > 0 && (
              <div className="mt-4 border-t store-border-t pt-4">
                <span className="block text-xs font-semibold uppercase tracking-wider mb-2 pl-4 store-text-subtle">Categorías</span>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/store/${subdomain}?category_id=${cat.id}#productos`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 store-nav-link"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--store-text)] opacity-40" />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
