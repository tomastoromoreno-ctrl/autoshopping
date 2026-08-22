'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/lib/api';

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
  { href: '/dashboard/inventory', label: 'Inventario', icon: '📦', requiredPermission: 'inventory.read' },
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
  { href: '/dashboard/privacy', label: 'Protección Datos', icon: '🛡', requiredPermission: 'legal.read' },
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

  // God Mode & Suspension states
  const [isGodMode, setIsGodMode] = useState(false);
  const [godStoreName, setGodStoreName] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.user_metadata?.role || payload.role;
      const tenantId = payload.user_metadata?.tenant_id || payload.tenant_id;

      // Detectar Modo Dios
      if (payload.isGodMode) {
        setIsGodMode(true);
        setGodStoreName(payload.tenantName || 'Tienda');
        
        setUser({
          name: payload.email || 'Super Admin (Soporte)',
          email: payload.email || '',
          role: 'store_owner', // Permitir rol completo para soporte
          tenant_id: tenantId,
        });
        setChecking(false);
        return;
      }

      if (role === 'super_admin' || role === 'support_agent') { router.push('/superadmin'); return; }
      if (!tenantId) { router.push('/onboarding'); return; }

      setUser({
        name: payload.user_metadata?.name || payload.email || 'Usuario',
        email: payload.email || '',
        role: role || 'store_owner',
        tenant_id: tenantId,
      });

      // Verificar si la tienda está suspendida (solo para usuarios normales)
      api.get<{ subscription: any }>('/billing/subscription').then((res) => {
        if (res?.subscription?.status === 'suspended') {
          setIsSuspended(true);
          setSuspensionReason(res.subscription.suspension_reason || 'Incumplimiento en facturación');
        }
      }).catch(() => {});

      // Obtener avisos activos para el tenant
      api.get<any[]>(`/tenants/${tenantId}/active-notices`).then((res) => {
        if (Array.isArray(res)) setNotices(res);
      }).catch(() => {});

    } catch { router.push('/auth/login'); return; }
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('superadmin_access_token');
    localStorage.removeItem('superadmin_refresh_token');
    sessionStorage.removeItem('user_permissions');
    router.push('/auth/login');
  };

  const handleExitGodMode = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await api.post('/superadmin/god-mode/exit');
      }
    } catch {}

    const saAccess = localStorage.getItem('superadmin_access_token');
    const saRefresh = localStorage.getItem('superadmin_refresh_token');
    localStorage.removeItem('superadmin_access_token');
    localStorage.removeItem('superadmin_refresh_token');
    
    if (saAccess) {
      localStorage.setItem('access_token', saAccess);
    }
    if (saRefresh) {
      localStorage.setItem('refresh_token', saRefresh);
    }

    // Clear cached permissions to force recalculation back to SuperAdmin
    sessionStorage.removeItem('user_permissions');

    router.push('/superadmin');
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
  const isSuspendedRoute = pathname === '/dashboard/config/subscription';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Banner de Modo Dios */}
      {isGodMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 px-6 py-2.5 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-3 sm:gap-4 shadow-md sticky top-0 z-50">
          <span>⚡ Modo Dios — Estás administrando la tienda <strong className="underline decoration-wavy">{godStoreName}</strong> en representación de AutoShopping</span>
          <button
            onClick={handleExitGodMode}
            className="bg-slate-950 hover:bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold shadow-sm transition-all"
          >
            Salir Modo Dios
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isGodMode ? 'pt-11' : ''}`}>
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="text-lg font-bold text-blue-600">AutoShopping</Link>
          </div>
          <nav className="mt-4 space-y-1 px-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {!isSuspended ? (
              visibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <span>{item.icon}</span> {item.label}
                  </Link>
                );
              })
            ) : (
              <Link href="/dashboard/config/subscription"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors bg-red-50 text-red-600`}>
                <span>💳</span> Mi Suscripción
              </Link>
            )}
          </nav>
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

          {/* Active Notices Banners */}
          {notices.length > 0 && (
            <div className="flex flex-col gap-2 px-3 sm:px-6 mt-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`rounded-xl border p-4 shadow-sm text-sm font-semibold flex items-center justify-between transition-all ${
                    notice.type === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                    notice.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {notice.type === 'critical' ? '🚨' : notice.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span>{notice.message}</span>
                  </div>
                  {notice.type !== 'critical' && (
                    <button
                      onClick={() => setNotices(notices.filter(n => n.id !== notice.id))}
                      className="text-xs opacity-60 hover:opacity-100 font-bold animate-pulse"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Body Content - Block if suspended and not on subscription settings */}
          <main className="flex-1 p-3 sm:p-4 md:p-6">
            {isSuspended && !isSuspendedRoute ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto text-center space-y-6">
                <div className="text-6xl animate-bounce">🚫</div>
                <h1 className="text-3xl font-extrabold text-slate-800">Tu tienda se encuentra suspendida</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Lamentamos los inconvenientes. Tu tienda ha sido desactivada temporalmente por el siguiente motivo: <br/>
                  <strong className="text-slate-700 block mt-2 p-3 bg-red-50 border border-red-100 rounded-lg italic">"{suspensionReason}"</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <Link
                    href="/dashboard/config/subscription"
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm shadow-md transition-all"
                  >
                    Ver detalles de Facturación y Pago
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 px-6 py-3 text-sm font-bold transition-all"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
