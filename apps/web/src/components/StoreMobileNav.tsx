'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StoreMobileNavProps {
  subdomain: string;
}

export default function StoreMobileNav({ subdomain }: StoreMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-bold text-slate-900">Menú</span>
              <button
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 space-y-1">
              <Link
                href={`/store/${subdomain}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Inicio
              </Link>
              <Link
                href={`/store/${subdomain}#productos`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Productos
              </Link>
              <Link
                href={`/store/${subdomain}/cart`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Carrito
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
