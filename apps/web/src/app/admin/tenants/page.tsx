'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  status: string;
  users_count: number;
  orders_count: number;
  created_at: string;
  email?: string;
  plan?: string;
}

interface OwnerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_name?: string;
}

interface PaginatedResponse {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', subdomain: '', ownerId: '' });
  const [availableUsers, setAvailableUsers] = useState<OwnerUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [domainSuffix, setDomainSuffix] = useState('.localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomainSuffix(`.${window.location.host}`);
    }
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<PaginatedResponse>(`/admin/tenants?${params}`);
      setTenants(res.data);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get<{ data: OwnerUser[] }>('/admin/users?limit=100');
      const filtered = res.data.filter(u => u.role !== 'super_admin' && !u.tenant_name);
      setAvailableUsers(filtered);
    } catch {}
    setLoadingUsers(false);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({ name: '', subdomain: '', ownerId: '' });
    setCreateError('');
    setShowCreateModal(true);
    fetchAvailableUsers();
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.subdomain || !createForm.ownerId) {
      setCreateError('Todos los campos son obligatorios.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/admin/tenants', createForm);
      setShowCreateModal(false);
      fetchTenants();
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear la tienda.');
    }
    setCreating(false);
  };

  const toggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/tenants/${tenant.id}/status`, { status: newStatus });
      fetchTenants();
    } catch {}
  };

  const deleteTenant = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tienda? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/admin/tenants/${id}`);
      setSelectedTenant(null);
      fetchTenants();
    } catch {}
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestión de Tiendas</h1>
        <button
          onClick={handleOpenCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Crear Tienda
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre o subdominio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Buscar</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); setTimeout(fetchTenants, 0); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Limpiar</button>
          )}
        </form>
        <select
          aria-label="Filtrar por estado"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="suspended">Suspendidas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-500">
              <th className="px-4 py-3 font-medium">Subdominio</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Usuarios</th>
              <th className="px-4 py-3 font-medium">Órdenes</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{tenant.subdomain}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{tenant.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    tenant.status === 'active' ? 'bg-green-50 text-green-600' :
                    tenant.status === 'suspended' ? 'bg-red-50 text-red-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>{tenant.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{tenant.users_count}</td>
                <td className="px-4 py-3 text-slate-700">{tenant.orders_count}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(tenant.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedTenant(tenant)} className="rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">Ver</button>
                    <button onClick={() => toggleStatus(tenant)} className={`rounded px-2.5 py-1 text-xs font-medium ${
                      tenant.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}>{tenant.status === 'active' ? 'Suspender' : 'Activar'}</button>
                    <button onClick={() => deleteTenant(tenant.id)} className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No se encontraron tiendas</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Página {page} de {totalPages} ({total} registros)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
          </div>
        </div>
      )}

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedTenant(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{selectedTenant.name}</h3>
              <button onClick={() => setSelectedTenant(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">ID</span><span className="font-mono text-slate-900">{selectedTenant.id}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Subdominio</span><span className="text-slate-900">{selectedTenant.subdomain}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Estado</span><span className={`font-medium capitalize ${selectedTenant.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{selectedTenant.status}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Usuarios</span><span className="text-slate-900">{selectedTenant.users_count}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Órdenes</span><span className="text-slate-900">{selectedTenant.orders_count}</span></div>
              {selectedTenant.email && <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Email</span><span className="text-slate-900">{selectedTenant.email}</span></div>}
              {selectedTenant.plan && <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Plan</span><span className="text-slate-900">{selectedTenant.plan}</span></div>}
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Creado</span><span className="text-slate-900">{new Date(selectedTenant.created_at).toLocaleString()}</span></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSelectedTenant(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cerrar</button>
              <button onClick={() => { deleteTenant(selectedTenant.id); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Crear Nueva Tienda</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateTenant} className="mt-4 space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {createError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre de la Tienda</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mi Deportes Shop"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Subdominio</label>
                <div className="flex mt-1 rounded-lg border border-slate-300 overflow-hidden focus-within:border-blue-500">
                  <input
                    type="text"
                    required
                    placeholder="ej. mideportes"
                    value={createForm.subdomain}
                    onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                  />
                  <span className="bg-slate-50 px-3 py-2 text-sm text-slate-500 border-l font-mono">{domainSuffix}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Usuario Propietario (Dueño)</label>
                <select
                  required
                  aria-label="Seleccionar usuario propietario"
                  value={createForm.ownerId}
                  onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Selecciona un usuario...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name ? `${user.name} (${user.email})` : user.email}
                    </option>
                  ))}
                </select>
                {loadingUsers && (
                  <p className="mt-1 text-xs text-slate-400">Cargando usuarios disponibles...</p>
                )}
                {!loadingUsers && availableUsers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No hay usuarios disponibles sin tienda asignada. Registra uno primero.</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating || loadingUsers}
                >
                  {creating ? 'Creando...' : 'Crear Tienda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
