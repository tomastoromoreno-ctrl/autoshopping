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

import { createClient } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; tenant_id: string | null } | null>(null);
  const [tenant, setTenant] = useState<{ name: string; subdomain: string; logo_url?: string; logo?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // God Mode & Suspension states
  const [isGodMode, setIsGodMode] = useState(false);
  const [godStoreName, setGodStoreName] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    async function loadIdentity() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          let tenantId = authUser.user_metadata?.tenant_id;
          let role = authUser.user_metadata?.role || 'store_owner';
          let name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Tomas Prueba';

          if (!tenantId) {
            const { data: profile } = await supabase
              .from('users')
              .select('tenant_id, role, name')
              .eq('id', authUser.id)
              .maybeSingle();
            if (profile) {
              if (profile.tenant_id) tenantId = profile.tenant_id;
              if (profile.role) role = profile.role;
              if (profile.name) name = profile.name;
            }
          }

          setUser({
            name,
            email: authUser.email || '',
            role: role || 'store_owner',
            tenant_id: tenantId || null,
          });

          if (tenantId) {
            const { data: tData } = await supabase
              .from('tenants')
              .select('name, subdomain, logo_url, logo')
              .eq('id', tenantId)
              .maybeSingle();

            if (tData) {
              setTenant(tData);
            }
          }
          setChecking(false);
          return;
        }
      } catch (err) {
        console.error('Error loading identity from Supabase:', err);
      }

      // JWT fallback
      const token = localStorage.getItem('access_token');
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.user_metadata?.role || payload.role;
        const tenantId = payload.user_metadata?.tenant_id || payload.tenant_id;

        if (payload.isGodMode) {
          setIsGodMode(true);
          setGodStoreName(payload.tenantName || 'Tienda');
          setUser({
            name: payload.email || 'Super Admin (Soporte)',
            email: payload.email || '',
            role: 'store_owner',
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

        api.get<{ subscription: any }>('/billing/subscription').then((res) => {
          if (res?.subscription?.status === 'suspended') {
            setIsSuspended(true);
            setSuspensionReason(res.subscription.suspension_reason || 'Incumplimiento en facturación');
          }
        }).catch(() => {});

        api.get<any[]>(`/tenants/${tenantId}/active-notices`).then((res) => {
          if (Array.isArray(res)) setNotices(res);
        }).catch(() => {});
      } catch {
        // Safe fallback
      }
      setChecking(false);
    }

    loadIdentity();
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
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

    sessionStorage.removeItem('user_permissions');
    router.push('/superadmin');
  };

  if (checking || permissionsLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  // Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOpenProfile = () => {
    setEditName(user?.name || '');
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        await supabase.auth.updateUser({
          data: { name: editName.trim() }
        });

        await supabase
          .from('users')
          .update({ name: editName.trim() })
          .eq('id', authUser.id);
      }

      setUser((prev) => prev ? { ...prev, name: editName.trim() } : null);
      setShowProfileModal(false);
      alert('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      alert('Error al actualizar perfil: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setSavingProfile(false);
    }
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  const roleInfo = user ? ROLE_LABELS[user.role] || ROLE_LABELS.store_owner : null;
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
          {/* Header Identidad de Marca de la Tienda */}
          <div className="flex flex-col border-b bg-slate-900 text-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              {tenant?.logo_url || tenant?.logo ? (
                <img
                  src={tenant.logo_url || tenant.logo}
                  alt={tenant.name}
                  className="h-10 w-10 rounded-xl object-cover bg-white p-0.5 border border-slate-700 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
                  {(tenant?.name || 'A')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-white truncate tracking-tight">
                  {tenant?.name || 'AutoShopping'}
                </h2>
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {tenant?.subdomain ? `${tenant.subdomain}.autoshopping` : 'Tu Tienda Online'}
                </p>
              </div>
            </div>

            {tenant?.subdomain && (
              <a
                href={`/store/${tenant.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm shadow-sm"
              >
                <span>Visitar Tienda Pública</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>

          <nav className="mt-3 space-y-1 px-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {!isSuspended ? (
              visibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
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
          <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b bg-white px-3 sm:px-6 shadow-xs">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Menú">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                {tenant?.name || 'Mi Tienda'}
              </h1>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              {tenant?.subdomain && (
                <a
                  href={`/store/${tenant.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all shadow-xs"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ver Tienda</span>
                  <span className="text-[10px]">↗</span>
                </a>
              )}

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={handleOpenProfile}
                className="flex items-center gap-2.5 hover:bg-slate-100 p-1.5 rounded-xl transition-all cursor-pointer group"
                title="Haz clic para editar tu perfil"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm border border-white group-hover:scale-105 transition-transform">
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-none group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    {user?.name}
                    <span className="text-[10px] text-slate-400">✏️</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono leading-tight mt-0.5">{user?.email}</span>
                </div>
                {roleInfo && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Salir
              </button>
            </div>
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

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">👤</div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Perfil</h3>
                  <p className="text-xs text-slate-500">Actualiza tu nombre e información personal.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej: Tomas Toro"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed opacity-80"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all"
                >
                  {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
