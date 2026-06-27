'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  store_owner: { label: 'Dueño', color: 'bg-purple-100 text-purple-700' },
  store_admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  store_manager: { label: 'Gerente', color: 'bg-green-100 text-green-700' },
  store_editor: { label: 'Editor', color: 'bg-yellow-100 text-yellow-700' },
  store_viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-700' },
};

// Each nav item is tied to one or more permissions. If the user has ANY of them, the item is shown.
// Items with no requiredPermission are always visible.
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/dashboard/products', label: 'Productos', icon: '◈', requiredPermission: 'products.read' },
  { href: '/dashboard/categories', label: 'Categorías', icon: '◎', requiredPermission: 'categories.read' },
  { href: '/dashboard/banners', label: 'Banners', icon: '🖼', requiredPermission: 'banners.read' },
  { href: '/dashboard/promotions', label: 'Promociones', icon: '★', requiredPermission: 'promotions.read' },
  { href: '/dashboard/orders', label: 'Órdenes', icon: '☰', requiredPermission: 'orders.read' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊', requiredPermission: 'analytics.read' },
  { href: '/dashboard/blog', label: 'Blog', icon: '✎', requiredPermission: 'blog.read' },
  { href: '/dashboard/invoicing', label: 'Facturación SII', icon: '📄', requiredPermission: 'invoicing.read' },
  { href: '/dashboard/config', label: 'Configuración', icon: '⚙', requiredPermission: 'config.read' },
  { href: '/dashboard/shipping', label: 'Hub de Envíos', icon: '🚚', requiredPermission: 'config.read' },
  { href: '/dashboard/appearance', label: 'Apariencia', icon: '◐', requiredPermission: 'appearance.read' },
  { href: '/dashboard/domain', label: 'Dominio', icon: '🌐', requiredPermission: 'domain.read' },
  { href: '/dashboard/users', label: 'Usuarios', icon: '♢', requiredPermission: 'users.read' },
  { href: '/dashboard/permissions', label: 'Roles y Permisos', icon: '🔐', requiredPermission: 'users.write' },
  { href: '/dashboard/legal', label: 'Documentos Legales', icon: '📋', requiredPermission: 'legal.read' },
  { href: '/dashboard/backups', label: 'Backups', icon: '💾', requiredPermission: 'backups.read' },
  { href: '/dashboard/developer', label: 'Desarrolladores', icon: '🛠', requiredPermission: 'config.read' },
  { href: '/dashboard/international', label: 'Idiomas y Monedas', icon: '🌍', requiredPermission: 'config.read' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; tenant_id: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const { hasPermission, loading: permissionsLoading, role: permRole } = usePermissions();

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
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_permissions');
    router.push('/auth/login');
  };

  if (checking || permissionsLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  // Filter navigation items based on user permissions
  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  const roleInfo = user ? ROLE_LABELS[user.role] : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">AutoShopping</Link>
        </div>
        <nav className="mt-4 space-y-1 px-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        {user?.role === 'super_admin' && (
          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <Link href="/admin" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600">
              Panel Super Admin
            </Link>
          </div>
        )}
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
              {roleInfo && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              )}
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
