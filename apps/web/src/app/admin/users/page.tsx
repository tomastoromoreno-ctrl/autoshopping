'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_name: string;
  confirmed: boolean;
  created_at: string;
}

interface PaginatedResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get<PaginatedResponse>(`/admin/users?${params}`);
      setUsers(res.data);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="seller">Vendedor</option>
          <option value="customer">Cliente</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-500">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Tienda</th>
              <th className="px-4 py-3 font-medium">Confirmado</th>
              <th className="px-4 py-3 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900">{user.email}</td>
                <td className="px-4 py-3 text-slate-900">{user.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    user.role === 'super_admin' ? 'bg-red-50 text-red-600' :
                    user.role === 'admin' ? 'bg-blue-50 text-blue-600' :
                    user.role === 'seller' ? 'bg-purple-50 text-purple-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>{user.role}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{user.tenant_name || '—'}</td>
                <td className="px-4 py-3">
                  {user.confirmed ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No se encontraron usuarios</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
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
    </div>
  );
}
