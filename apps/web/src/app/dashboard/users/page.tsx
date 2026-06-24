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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const load = () => {
    api.get<{ data: User[] }>('/users').then((res) => setUsers(res.data || [])).catch(() => {});
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

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Usuarios</h1>

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
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-500">{user.email}</td>
                <td className="px-4 py-3">
                  <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    aria-label="Rol del usuario"
                    className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-primary">
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="user">user</option>
                  </select>
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
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hay usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
