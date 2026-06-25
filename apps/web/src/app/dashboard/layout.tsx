'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/dashboard/products', label: 'Productos', icon: '◈' },
  { href: '/dashboard/categories', label: 'Categorías', icon: '◎' },
  { href: '/dashboard/banners', label: 'Banners', icon: '🖼' },
  { href: '/dashboard/promotions', label: 'Promociones', icon: '★' },
  { href: '/dashboard/orders', label: 'Órdenes', icon: '☰' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { href: '/dashboard/blog', label: 'Blog', icon: '✎' },
  { href: '/dashboard/invoicing', label: 'Facturación SII', icon: '📄' },
  { href: '/dashboard/config', label: 'Configuración', icon: '⚙' },
  { href: '/dashboard/appearance', label: 'Apariencia', icon: '◐' },
  { href: '/dashboard/domain', label: 'Dominio', icon: '🌐' },
  { href: '/dashboard/users', label: 'Usuarios', icon: '♢' },
  { href: '/dashboard/permissions', label: 'Roles y Permisos', icon: '🔐' },
  { href: '/dashboard/legal', label: 'Documentos Legales', icon: '📋' },
  { href: '/dashboard/backups', label: 'Backups', icon: '💾' },
  { href: '/dashboard/developer', label: 'Desarrolladores', icon: '🛠' },
  { href: '/dashboard/international', label: 'Idiomas y Monedas', icon: '🌍' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; tenant_id: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.user_metadata?.role || payload.role;
      const tenantId = payload.user_metadata?.tenant_id || payload.tenant_id;

      if (role === 'super_admin') { router.push('/admin'); return; }
      if (!tenantId) { router.push('/onboarding'); return; }

      setUser({
        name: payload.user_metadata?.name || payload.email || 'Usuario',
        email: payload.email || '',
        role: role || 'store_owner',
        tenant_id: tenantId,
      });
    } catch { router.push('/auth/login'); return; }
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/auth/login');
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">AutoShopping</Link>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <Link href="/admin" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600">
            Panel Super Admin
          </Link>
        </div>
      </aside>
      <div className={`fixed inset-0 z-30 bg-black/50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b bg-white px-3 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Menú">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user.name}</span>
              <button onClick={handleLogout} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200">Salir</button>
            </div>
          )}
        </header>
        <main className="flex-1 p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
