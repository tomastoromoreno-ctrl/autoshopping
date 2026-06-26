'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/80 backdrop-blur-xl border-b border-slate-800'
          : 'bg-transparent'
      }`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="AutoShopping Logo" className="h-8 w-8 rounded-lg object-contain bg-slate-900/50 p-0.5 border border-slate-800" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AutoShopping
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">
              Características
            </Link>
            <Link href="/pricing" className="text-sm text-slate-300 hover:text-white transition-colors">
              Precios
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <LocaleSwitcher />
            <Link
              href="/onboarding"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Crear tienda
            </Link>
          </nav>

          <button
            className="md:hidden text-slate-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl">
            <div className="space-y-2 px-4 py-4">
              <Link href="#features" className="block text-sm text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
                Características
              </Link>
              <Link href="/pricing" className="block text-sm text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
                Precios
              </Link>
              <Link href="/auth/login" className="block text-sm text-slate-300 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
                Iniciar sesión
              </Link>
              <Link href="/onboarding" className="block text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-4 py-2 text-center" onClick={() => setIsMenuOpen(false)}>
                Crear tienda
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="AutoShopping Logo" className="h-6 w-6 rounded-md object-contain bg-slate-900/50 p-0.5 border border-slate-800" />
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AutoShopping</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">La plataforma todo-en-uno para tu e-commerce.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Producto</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="#features" className="text-sm text-slate-400 hover:text-white">Características</Link></li>
                <li><Link href="#pricing" className="text-sm text-slate-400 hover:text-white">Precios</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Compañía</h4>
              <ul className="mt-3 space-y-2">
                <li><span className="text-sm text-slate-400">Sobre nosotros</span></li>
                <li><span className="text-sm text-slate-400">Blog</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Soporte</h4>
              <ul className="mt-3 space-y-2">
                <li><span className="text-sm text-slate-400">Centro de ayuda</span></li>
                <li><span className="text-sm text-slate-400">Contacto</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AutoShopping. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
