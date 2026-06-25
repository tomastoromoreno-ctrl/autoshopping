'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface RoleData {
  role: string;
  label: string;
  permissions: Record<string, boolean>;
}

const PERMISSION_LABELS: Record<string, string> = {
  'products.read': 'Ver productos',
  'products.write': 'Editar productos',
  'products.delete': 'Eliminar productos',
  'orders.read': 'Ver órdenes',
  'orders.write': 'Crear órdenes',
  'orders.update_status': 'Cambiar estado de órdenes',
  'categories.read': 'Ver categorías',
  'categories.write': 'Editar categorías',
  'analytics.read': 'Ver analytics',
  'invoicing.read': 'Ver facturación',
  'invoicing.generate': 'Generar documentos tributarios',
  'config.read': 'Ver configuración',
  'config.write': 'Editar configuración',
  'users.read': 'Ver usuarios',
  'users.write': 'Editar usuarios',
  'users.delete': 'Eliminar usuarios',
  'appearance.read': 'Ver apariencia',
  'appearance.write': 'Editar apariencia',
  'blog.read': 'Ver blog',
  'blog.write': 'Editar blog',
  'promotions.read': 'Ver promociones',
  'promotions.write': 'Editar promociones',
  'banners.read': 'Ver banners',
  'banners.write': 'Editar banners',
  'domain.read': 'Ver dominio',
  'domain.write': 'Editar dominio',
  'legal.read': 'Ver documentos legales',
  'legal.write': 'Editar documentos legales',
  'backups.read': 'Ver backups',
  'backups.write': 'Crear/restaurar backups',
};

const PERMISSION_GROUPS: Record<string, string[]> = {
  'Productos': ['products.read', 'products.write', 'products.delete'],
  'Órdenes': ['orders.read', 'orders.write', 'orders.update_status'],
  'Categorías': ['categories.read', 'categories.write'],
  'Analytics': ['analytics.read'],
  'Facturación': ['invoicing.read', 'invoicing.generate'],
  'Configuración': ['config.read', 'config.write'],
  'Usuarios': ['users.read', 'users.write', 'users.delete'],
  'Apariencia': ['appearance.read', 'appearance.write'],
  'Blog': ['blog.read', 'blog.write'],
  'Promociones': ['promotions.read', 'promotions.write'],
  'Banners': ['banners.read', 'banners.write'],
  'Dominio': ['domain.read', 'domain.write'],
  'Legal': ['legal.read', 'legal.write'],
  'Backups': ['backups.read', 'backups.write'],
};

export default function PermissionsPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('store_admin');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.get<{ roles: RoleData[] }>('/permissions/roles')
      .then((res) => setRoles(res.roles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const currentRole = roles.find((r) => r.role === selectedRole);

  const handleToggle = async (permission: string) => {
    if (!currentRole || selectedRole === 'store_owner') return;
    setSaving(true);
    setMessage(null);
    try {
      const newValue = !currentRole.permissions[permission];
      const res = await api.patch<{ roles: RoleData[] }>(`/permissions/roles/${selectedRole}`, {
        permissions: { [permission]: newValue },
      });
      setRoles(res.roles || []);
      setMessage({ type: 'success', text: 'Permiso actualizado' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restaurar todos los permisos a los valores predeterminados? Esta acción no se puede deshacer.')) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post<{ roles: RoleData[] }>('/permissions/roles/reset');
      setRoles(res.roles || []);
      setMessage({ type: 'success', text: 'Permisos restaurados a valores predeterminados' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Roles y Permisos</h1>
          <p className="mt-1 text-sm text-slate-500">Configura qué puede hacer cada rol en tu tienda</p>
        </div>
        <button onClick={handleReset} disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
          Restaurar predeterminados
        </button>
      </div>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Role Selector */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {roles.map((role) => (
          <button key={role.role} onClick={() => setSelectedRole(role.role)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedRole === role.role
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 border hover:bg-slate-50'
            }`}>
            {role.label}
          </button>
        ))}
      </div>

      {/* Owner info */}
      {selectedRole === 'store_owner' && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium">🔐 El dueño de la tienda tiene acceso total</p>
          <p className="mt-1 text-blue-600">Este rol no se puede modificar. Tiene acceso a todas las funcionalidades.</p>
        </div>
      )}

      {/* Permissions Matrix */}
      {currentRole && (
        <div className="mt-4 space-y-4">
          {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
            <div key={group} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="text-sm font-semibold text-slate-700">{group}</h3>
              </div>
              <div className="divide-y">
                {perms.map((perm) => (
                  <div key={perm} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-sm text-slate-900">{PERMISSION_LABELS[perm] || perm}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">{perm}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRole.permissions[perm] || false}
                        onChange={() => handleToggle(perm)}
                        disabled={saving || selectedRole === 'store_owner'}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
