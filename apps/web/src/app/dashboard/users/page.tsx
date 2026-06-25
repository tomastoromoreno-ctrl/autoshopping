'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  confirmed: boolean;
}

const ROLES = [
  { value: 'store_owner', label: 'Dueño', color: 'bg-purple-100 text-purple-700' },
  { value: 'store_admin', label: 'Administrador', color: 'bg-blue-100 text-blue-700' },
  { value: 'store_manager', label: 'Gerente', color: 'bg-green-100 text-green-700' },
  { value: 'store_editor', label: 'Editor', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'store_viewer', label: 'Visualizador', color: 'bg-slate-100 text-slate-700' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const load = () => {
    api.get<User[]>('/users')
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.patch(`/users/${userId}`, { role });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await api.delete(`/users/${userId}`);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find((r) => r.value === role) || { value: role, label: role, color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona los miembros de tu equipo y sus roles</p>
        </div>
      </div>

      {/* Roles Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <span key={role.value} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
            {role.label}
          </span>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-500">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Confirmado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              return (
                <tr key={user.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      aria-label="Rol del usuario"
                      className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-blue-600">
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.confirmed ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {user.confirmed ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(user.id)}
                      className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hay usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">💡 Gestión de permisos</p>
        <p className="mt-1 text-blue-600">Para configurar qué puede hacer cada rol, ve a <a href="/dashboard/permissions" className="underline font-medium">Roles y Permisos</a>.</p>
      </div>
    </div>
  );
}
