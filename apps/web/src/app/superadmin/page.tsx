'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SubscriptionDetail {
  plan_name: string;
  price: number;
  billing_cycle: string;
  status: string;
  next_billing_date: string;
  grace_period_ends_at?: string;
  suspension_reason?: string;
  manual_override: boolean;
}

interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  status: string;
  created_at: string;
  owner_email: string;
  plan: string;
  subscription_status: string;
  next_billing_date: string;
  subscription_detail: SubscriptionDetail;
}

interface Metrics {
  totalTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  activeTenants: number;
  mrr: number;
  newSignups: number;
  // Legacy stats
  totalUsers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  recentOrders?: {
    id: string;
    tenant_name: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }[];
  ordersByStatus?: Record<string, number>;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState<'god' | 'access' | 'sub' | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);

  // God Mode state
  const [godReason, setGodReason] = useState('Technical Support');

  // Access Management state
  const [accessSubTab, setAccessSubTab] = useState<'status' | 'password' | 'logout' | 'reset'>('status');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendMessage, setSuspendMessage] = useState('');
  const [tempLink, setTempLink] = useState('');
  const [resetConfirmName, setResetConfirmName] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Subscription state
  const [subPlan, setSubPlan] = useState('');
  const [subPrice, setSubPrice] = useState(0);
  const [subCycle, setSubCycle] = useState('monthly');
  const [subStatus, setSubStatus] = useState('');
  const [subNextBilling, setNextBilling] = useState('');
  const [subGracePeriod, setSubGracePeriod] = useState('');
  const [subManualOverride, setSubManualOverride] = useState(false);
  const [manualPayAmount, setManualPayAmount] = useState(26900);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);

  // Notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  const [operatorRole, setOperatorRole] = useState('support_agent');

  useEffect(() => {
    // Detect operator role
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.user_metadata?.role || payload.role;
        setOperatorRole(role);
      } catch {}
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, planFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const metricsRes = await api.get<Metrics>('/superadmin/stats');
      setMetrics(metricsRes);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);

      const tenantsRes = await api.get<{ data: TenantRow[]; total: number }>(`/superadmin/tenants?${params}`);
      setTenants(tenantsRes.data);
      setTotal(tenantsRes.total);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openGodMode = (tenant: TenantRow) => {
    setSelectedTenant(tenant);
    setGodReason('Technical Support');
    setActiveModal('god');
  };

  const handleEnterGodMode = async () => {
    if (!selectedTenant) return;
    try {
      const res = await api.post<{ token: string }>('/superadmin/god-mode/enter', {
        storeId: selectedTenant.id,
        reason: godReason,
      });

      if (res.token) {
        // Save current super admin tokens
        const curAccess = localStorage.getItem('access_token');
        const curRefresh = localStorage.getItem('refresh_token');
        if (curAccess) localStorage.setItem('superadmin_access_token', curAccess);
        if (curRefresh) localStorage.setItem('superadmin_refresh_token', curRefresh);

        // Put God Mode token in place
        localStorage.setItem('access_token', res.token);
        
        // Redirect to client dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Error al iniciar Modo Dios');
    }
  };

  const openAccess = async (tenant: TenantRow) => {
    setSelectedTenant(tenant);
    setSuspendReason(tenant.subscription_detail?.suspension_reason || '');
    setSuspendMessage('');
    setTempLink('');
    setResetConfirmName('');
    setResetConfirmText('');
    setAccessSubTab('status');
    setActiveModal('access');
    
    // Load notes
    try {
      const notesRes = await api.get<any[]>(`/superadmin/tenants/${tenant.id}/notes`);
      setNotes(notesRes);
    } catch {}
  };

  const handleSaveNote = async () => {
    if (!selectedTenant || !newNote.trim()) return;
    try {
      const note = await api.post<any>(`/superadmin/tenants/${selectedTenant.id}/notes`, { content: newNote });
      setNotes([note, ...notes]);
      setNewNote('');
    } catch {}
  };

  const handleToggleStatus = async (newStatus: 'active' | 'suspended') => {
    if (!selectedTenant) return;
    try {
      await api.post(`/superadmin/tenants/${selectedTenant.id}/status`, {
        status: newStatus,
        reason: suspendReason || 'Cambio manual del administrador',
        customMessage: suspendMessage,
      });
      fetchData();
      setActiveModal(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (type: 'email' | 'link') => {
    if (!selectedTenant) return;
    try {
      const res = await api.post<any>(`/superadmin/tenants/${selectedTenant.id}/password-reset`, { actionType: type });
      if (type === 'email') {
        alert(res.message);
      } else {
        setTempLink(res.tempLink);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleForceLogout = async () => {
    if (!selectedTenant) return;
    try {
      await api.post(`/superadmin/tenants/${selectedTenant.id}/force-logout`);
      alert('Sesiones cerradas forzosamente.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetStore = async () => {
    if (!selectedTenant) return;
    if (resetConfirmName !== selectedTenant.name || resetConfirmText !== 'CONFIRM RESET') {
      alert('Las confirmaciones escritas no coinciden.');
      return;
    }
    try {
      await api.post(`/superadmin/tenants/${selectedTenant.id}/reset`);
      alert('Tienda reiniciada a cero exitosamente.');
      fetchData();
      setActiveModal(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openSubscription = async (tenant: TenantRow) => {
    setSelectedTenant(tenant);
    setSubPlan(tenant.subscription_detail.plan_name);
    setSubPrice(tenant.subscription_detail.price);
    setSubCycle(tenant.subscription_detail.billing_cycle);
    setSubStatus(tenant.subscription_detail.status);
    setNextBilling(tenant.subscription_detail.next_billing_date ? tenant.subscription_detail.next_billing_date.split('T')[0] : '');
    setSubGracePeriod(tenant.subscription_detail.grace_period_ends_at ? tenant.subscription_detail.grace_period_ends_at.split('T')[0] : '');
    setSubManualOverride(tenant.subscription_detail.manual_override);
    setManualPayAmount(tenant.subscription_detail.price || 26900);
    setActiveModal('sub');

    try {
      const subDetail = await api.get<any>(`/superadmin/tenants/${tenant.id}/subscription`);
      setPaymentsList(subDetail.payments || []);
    } catch {}
  };

  const handleUpdateSubscription = async () => {
    if (!selectedTenant) return;
    try {
      await api.patch(`/superadmin/tenants/${selectedTenant.id}/subscription`, {
        plan_name: subPlan,
        price: Number(subPrice),
        billing_cycle: subCycle,
        status: subStatus,
        next_billing_date: subNextBilling ? new Date(subNextBilling).toISOString() : undefined,
        grace_period_ends_at: subGracePeriod ? new Date(subGracePeriod).toISOString() : null,
        manual_override: subManualOverride,
      });
      fetchData();
      setActiveModal(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedTenant) return;
    try {
      await api.post(`/superadmin/tenants/${selectedTenant.id}/subscription/mark-paid`, { amount: manualPayAmount });
      fetchData();
      setActiveModal(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isSuperAdmin = operatorRole === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">SuperAdmin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Monitorea y administra de forma global todas las tiendas clientes de AutoGastos.</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">MRR Total</p>
          <p className="mt-2 text-2xl font-black text-amber-500">${(metrics?.mrr ?? 0).toLocaleString('es-CL')}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10">💵</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ventas Totales</p>
          <p className="mt-2 text-2xl font-black text-emerald-400">${(metrics?.totalRevenue ?? 0).toLocaleString('es-CL')}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10">💰</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tiendas Activas</p>
          <p className="mt-2 text-2xl font-black text-cyan-400">{metrics?.activeTenants ?? 0}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10">🏬</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Usuarios</p>
          <p className="mt-2 text-2xl font-black text-indigo-400">{metrics?.totalUsers ?? 0}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10">👥</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Órdenes</p>
          <p className="mt-2 text-2xl font-black text-orange-400">{metrics?.totalOrders ?? 0}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10">📦</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Suspendidas</p>
          <p className="mt-2 text-2xl font-black text-rose-500">{metrics?.suspendedTenants ?? 0}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10">🚫</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar tienda por nombre o subdominio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-100 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 text-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="suspended">Suspendidas</option>
            </select>

            <select
              aria-label="Plan"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 text-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
            >
              <option value="">Todos los planes</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 text-sm transition-all shadow-md">
              Filtrar
            </button>
            {(search || statusFilter || planFilter) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setStatusFilter(''); setPlanFilter(''); setPage(1); }}
                className="rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 px-4 py-2.5 text-sm"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Stores Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
              <th className="px-6 py-4">Tienda</th>
              <th className="px-6 py-4">Subdominio</th>
              <th className="px-6 py-4">Propietario</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Vencimiento</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-semibold">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-2" />
                  Cargando información de tiendas...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-semibold">
                  No se encontraron tiendas con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              tenants.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-800/35 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-100">{row.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-amber-500/80">{row.subdomain}</td>
                  <td className="px-6 py-4 text-xs">{row.owner_email}</td>
                  <td className="px-6 py-4">
                    <span className="uppercase text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                      {row.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                      row.status === 'active' && row.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      row.status === 'active' && row.subscription_status === 'trial' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                      row.subscription_status === 'overdue' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {row.status === 'suspended' ? 'SUSPENDIDA' : row.subscription_status === 'trial' ? 'EN PRUEBA' : row.subscription_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {row.next_billing_date ? new Date(row.next_billing_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openGodMode(row)}
                        className="rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs transition-all"
                      >
                        ⚡ God Mode
                      </button>
                      <button
                        onClick={() => openAccess(row)}
                        className="rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 px-3 py-1.5 text-xs transition-colors"
                      >
                        Accesos
                      </button>
                      <button
                        onClick={() => openSubscription(row)}
                        className="rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 px-3 py-1.5 text-xs transition-colors"
                      >
                        Plan / Facturación
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 text-xs font-bold border border-slate-700 disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-400">Página {page} de {Math.ceil(total / limit)}</span>
          <button
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(p => p + 1)}
            className="rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 text-xs font-bold border border-slate-700 disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Integrated Legacy Stats & Recent Activity Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders by Status Progress Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">📊 Órdenes por Estado (Global)</h3>
          <div className="space-y-3">
            {metrics?.ordersByStatus && Object.entries(metrics.ordersByStatus).map(([status, count]) => {
              const statusLabels: Record<string, string> = {
                pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
                shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
              };
              const statusColors: Record<string, string> = {
                pending: 'bg-amber-500', confirmed: 'bg-blue-500', processing: 'bg-indigo-500',
                shipped: 'bg-purple-500', delivered: 'bg-emerald-500', cancelled: 'bg-rose-500',
              };
              const total = Object.values(metrics.ordersByStatus || {}).reduce((a, b) => a + b, 0);
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">{statusLabels[status] || status}</span>
                    <span className="text-slate-200">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[status] || 'bg-slate-500'} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!metrics?.ordersByStatus || Object.keys(metrics.ordersByStatus).length === 0) && (
              <p className="text-sm text-slate-500 italic text-center py-6">Sin información de órdenes.</p>
            )}
          </div>
        </div>

        {/* Recent Orders List Box */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">📦 Órdenes Recientes en Tiendas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Tienda</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.recentOrders && metrics.recentOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    processing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  };
                  const statusLabels: Record<string, string> = {
                    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
                    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
                  };
                  return (
                    <tr key={order.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">#{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-200">{order.tenant_name}</td>
                      <td className="px-4 py-2.5">{order.customer_name}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-100">${order.total.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusColors[order.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {(!metrics?.recentOrders || metrics.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">No hay órdenes recientes registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MODAL GOD MODE ─── */}
      {activeModal === 'god' && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">⚡ Entrar en Modo Dios</h2>
            <p className="text-xs text-slate-400">Estás por ingresar al panel de control de <strong>{selectedTenant.name}</strong> sin contraseña.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Motivo del Acceso</label>
              <select
                value={godReason}
                onChange={(e) => setGodReason(e.target.value)}
                title="Motivo de acceso en Modo Dios"
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              >
                <option value="Technical Support">Soporte Técnico</option>
                <option value="Client Request">Solicitud del Cliente</option>
                <option value="Billing Issue">Problema de Facturación</option>
                <option value="Audit">Auditoría de Seguridad</option>
                <option value="Other">Otro Motivo</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 px-4 py-2 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnterGodMode}
                className="rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2 text-xs"
              >
                Ingresar a la Tienda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ACCESS MANAGEMENT ─── */}
      {activeModal === 'access' && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-xl font-black text-slate-100">Administrar Accesos: {selectedTenant.name}</h2>
                <p className="text-xs text-slate-500 mt-1">Configuración de seguridad, contraseñas, estado y notas internas.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-100 text-xl font-bold">×</button>
            </div>

            {/* Layout Body */}
            <div className="flex-1 flex min-h-0 overflow-y-auto">
              {/* Left sidebar inside modal */}
              <div className="w-48 border-r border-slate-800 bg-slate-900/30 p-4 space-y-1">
                <button onClick={() => setAccessSubTab('status')} className={`w-full text-left rounded-lg px-3 py-2 text-xs font-bold transition-all ${accessSubTab === 'status' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}>Estado de Tienda</button>
                <button onClick={() => setAccessSubTab('password')} className={`w-full text-left rounded-lg px-3 py-2 text-xs font-bold transition-all ${accessSubTab === 'password' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}>Restablecer Clave</button>
                <button onClick={() => setAccessSubTab('logout')} className={`w-full text-left rounded-lg px-3 py-2 text-xs font-bold transition-all ${accessSubTab === 'logout' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}>Cierre de Sesión</button>
                <button onClick={() => setAccessSubTab('reset')} className={`w-full text-left rounded-lg px-3 py-2 text-xs font-bold transition-all ${accessSubTab === 'reset' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}>Reiniciar a Cero</button>
              </div>

              {/* Right Side form */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* SUBTAB: STATUS */}
                {accessSubTab === 'status' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-100">Estado Operativo</h3>
                    <p className="text-xs text-slate-400">Suspender la tienda bloquea inmediatamente el acceso a sus dueños e inhabilita las ventas.</p>
                    
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Motivo de Suspensión (Interno)</label>
                        <input
                          type="text"
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          placeholder="Ej: Impago de suscripción mensual"
                          className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Mensaje Personalizado para el Cliente (Aparece en pantalla)</label>
                        <textarea
                          value={suspendMessage}
                          onChange={(e) => setSuspendMessage(e.target.value)}
                          placeholder="Escribe el mensaje que verá el cliente al intentar ingresar..."
                          rows={3}
                          className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        {selectedTenant.status === 'suspended' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus('active')}
                            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2 text-xs"
                          >
                            Reactivar Tienda
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus('suspended')}
                            className="rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2 text-xs"
                          >
                            Suspender Tienda
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB: PASSWORD RESET */}
                {accessSubTab === 'password' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-100">Restablecer Contraseña</h3>
                    <p className="text-xs text-slate-400">Puedes enviar un correo automatizado de cambio de contraseña o generar un link temporal de acceso.</p>
                    
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-4">
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleResetPassword('email')}
                          className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 text-xs font-bold border border-slate-700"
                        >
                          📧 Enviar Email de Restablecimiento
                        </button>
                        <button
                          onClick={() => handleResetPassword('link')}
                          className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 text-xs font-bold"
                        >
                          🔗 Generar Enlace Acceso Temporal (1 hr)
                        </button>
                      </div>

                      {tempLink && (
                        <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <p className="text-slate-400 mb-2">Comparte este enlace manualmente con el cliente:</p>
                          <input
                            type="text"
                            readOnly
                            value={tempLink}
                            onClick={(e) => (e.target as any).select()}
                            title="Enlace de acceso temporal"
                            placeholder="Enlace de acceso temporal"
                            className="w-full font-mono bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-amber-400 select-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB: FORCE LOGOUT */}
                {accessSubTab === 'logout' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-100">Cerrar Sesión Forzosamente</h3>
                    <p className="text-xs text-slate-400">Invalida inmediatamente todos los tokens y sesiones de los colaboradores de esta tienda.</p>
                    
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950">
                      <button
                        onClick={handleForceLogout}
                        className="rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 text-xs font-bold shadow-lg"
                      >
                        Cerrar Todas las Sesiones Activas
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBTAB: RESET STORE */}
                {accessSubTab === 'reset' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-100 text-rose-500">Reiniciar Tienda a Cero</h3>
                    <div className="p-4 rounded-xl border border-rose-900/30 bg-rose-950/20 text-rose-400 text-xs leading-relaxed">
                      ⚠️ <strong>ATENCIÓN:</strong> Esta es una acción altamente destructiva e irreversible. Eliminará todos los productos, variantes, categorías, órdenes, carritos y configuraciones vinculadas a esta tienda. El cliente perderá absolutamente todo su historial de ventas.
                    </div>

                    {isSuperAdmin ? (
                      <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Escribe el nombre de la tienda para confirmar: <span className="text-slate-200">({selectedTenant.name})</span></label>
                          <input
                            type="text"
                            value={resetConfirmName}
                            onChange={(e) => setResetConfirmName(e.target.value)}
                            placeholder="Nombre de la tienda"
                            className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Escribe "CONFIRM RESET" en mayúsculas</label>
                          <input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            placeholder="CONFIRM RESET"
                            className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                          />
                        </div>
                        <button
                          onClick={handleResetStore}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 text-xs font-bold"
                        >
                          Confirmar Reinicio Absoluto
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-400">
                        🚫 Solo los usuarios con rol <strong>Super Admin</strong> están facultados para reiniciar tiendas a cero.
                      </div>
                    )}
                  </div>
                )}

                {/* Internal Notes Section (Always visible at the bottom of form) */}
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Notas de Soporte (Solo visibles para operadores)</h3>
                  
                  {/* Note input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Añade una nota de soporte..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleSaveNote}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 text-xs font-bold border border-slate-700"
                    >
                      Añadir
                    </button>
                  </div>

                  {/* Notes list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {notes.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No hay notas de soporte para esta tienda.</p>
                    ) : (
                      notes.map((n) => (
                        <div key={n.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <strong>{n.operator?.name || 'Operador'} ({n.operator?.email})</strong>
                            <span>{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SUBSCRIPTION MANAGEMENT ─── */}
      {activeModal === 'sub' && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-xl font-black text-slate-100">Suscripción y Facturación: {selectedTenant.name}</h2>
                <p className="text-xs text-slate-500 mt-1">Configuración del plan del cliente y registro de pagos.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-100 text-xl font-bold">×</button>
            </div>

            {/* Layout Body */}
            <div className="flex-1 flex overflow-y-auto">
              
              {/* Left Column: Config Panel */}
              <div className="flex-1 p-6 border-r border-slate-800 space-y-6 overflow-y-auto">
                <h3 className="text-base font-bold text-slate-200">Parámetros del Plan</h3>
                
                {isSuperAdmin ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre del Plan</label>
                        <select
                          value={subPlan}
                          onChange={(e) => setSubPlan(e.target.value)}
                          title="Nombre del plan"
                          className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        >
                          <option value="trial">Trial</option>
                          <option value="starter">Starter</option>
                          <option value="growth">Growth</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Precio Mensual ($ CLP)</label>
                        <input
                          type="number"
                          value={subPrice}
                          onChange={(e) => setSubPrice(Number(e.target.value))}
                          title="Precio del plan"
                          placeholder="Precio del plan"
                          className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Estado de Cobro</label>
                        <select
                          value={subStatus}
                          onChange={(e) => setSubStatus(e.target.value)}
                          title="Estado de suscripción"
                          className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        >
                          <option value="trial">En prueba (Trial)</option>
                          <option value="active">Activo (Pagado)</option>
                          <option value="overdue">Atrasado (Overdue)</option>
                          <option value="suspended">Suspendido</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Ciclo Facturación</label>
                        <select
                          value={subCycle}
                          onChange={(e) => setSubCycle(e.target.value)}
                          title="Ciclo de facturación"
                          className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        >
                          <option value="monthly">Mensual</option>
                          <option value="annual">Anual</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Próximo Cobro</label>
                        <input
                          type="date"
                          value={subNextBilling}
                          onChange={(e) => setNextBilling(e.target.value)}
                          title="Fecha de próximo cobro"
                          placeholder="Próximo cobro"
                          className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Fin Período de Gracia</label>
                        <input
                          type="date"
                          value={subGracePeriod}
                          onChange={(e) => setSubGracePeriod(e.target.value)}
                          title="Fin del período de gracia"
                          placeholder="Fin del período de gracia"
                          className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        id="manualOverride"
                        type="checkbox"
                        checked={subManualOverride}
                        onChange={(e) => setSubManualOverride(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="manualOverride" className="text-xs text-slate-400">Habilitar Anulación Manual (Evita auto-suspensión automática)</label>
                    </div>

                    <button
                      onClick={handleUpdateSubscription}
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 text-xs mt-2"
                    >
                      Guardar Cambios de Suscripción
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-400 leading-relaxed space-y-3">
                    <p>🔒 <strong>Acceso Restringido:</strong> Solo los usuarios con rol <strong>Super Admin</strong> pueden cambiar planes, precios, ciclos o anular suspensiones manualmente.</p>
                    <div className="space-y-1 font-mono text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                      <div>Plan: {subPlan.toUpperCase()}</div>
                      <div>Precio: ${subPrice.toLocaleString('es-CL')}</div>
                      <div>Ciclo: {subCycle}</div>
                      <div>Estado: {subStatus.toUpperCase()}</div>
                      <div>Próximo cobro: {subNextBilling}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Payments and manual registration */}
              <div className="w-96 p-6 space-y-6 bg-slate-900/30 overflow-y-auto">
                <h3 className="text-base font-bold text-slate-200">Regularizar Pago Manual</h3>
                <p className="text-xs text-slate-400">Si el cliente pagó vía transferencia bancaria directa, registra el pago aquí para reactivar la tienda de forma inmediata.</p>
                
                {isSuperAdmin ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Monto Recibido ($ CLP)</label>
                      <input
                        type="number"
                        value={manualPayAmount}
                        onChange={(e) => setManualPayAmount(Number(e.target.value))}
                        title="Monto del pago manual"
                        placeholder="Monto del pago manual"
                        className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={handleMarkPaid}
                      className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 text-xs transition-all shadow-md"
                    >
                      ✓ Registrar Pago y Desbloquear
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-400">
                    🚫 Solo usuarios con rol <strong>Super Admin</strong> pueden marcar transferencias como recibidas.
                  </div>
                )}

                {/* Payment History List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Pagos</h4>
                  <div className="space-y-2">
                    {paymentsList.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-200">${p.amount.toLocaleString('es-CL')} CLP</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{new Date(p.date).toLocaleDateString()}</div>
                        </div>
                        <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-bold uppercase text-[9px]">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
