'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '◉' },
  { href: '/admin/tenants', label: 'Tiendas', icon: '◈' },
  { href: '/admin/orders', label: 'Órdenes', icon: '☰' },
  { href: '/admin/users', label: 'Usuarios', icon: '♢' },
  { href: '/admin/settings', label: 'Configuración', icon: '⚙' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || payload.user_metadata?.role;
      if (role !== 'super_admin' && role !== 'superadmin') {
        router.push('/dashboard');
        return;
      }
      setUser({ name: payload.user_metadata?.name || payload.email || 'Super Admin', email: payload.email || '' });
    } catch {
      router.push('/auth/login');
      return;
    }
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/auth/login');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="text-lg font-bold text-blue-600">AutoShopping</Link>
        </div>
        <div className="px-6 py-2">
          <span className="inline-block rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Super Admin</span>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            ← Volver al dashboard
          </Link>
        </div>
      </aside>
      <div className={`fixed inset-0 z-30 bg-black/50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Super Admin</span>
              <button onClick={handleLogout} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200">Salir</button>
            </div>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
