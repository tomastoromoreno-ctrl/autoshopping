'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SystemStats {
  totalTenants: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface DbInfo {
  project: string;
  status: string;
  host: string;
  version: string;
}

export default function AdminSettingsPage() {
  const [appName, setAppName] = useState('AutoShopping');
  const [supportEmail, setSupportEmail] = useState('soporte@autoshopping.com');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);

  useEffect(() => {
    api.get<{ app_name: string; support_email: string }>('/admin/settings').then((res) => {
      setAppName(res.app_name);
      setSupportEmail(res.support_email);
    }).catch(() => {});
    api.get<SystemStats>('/admin/stats').then(setStats).catch(() => {});
    api.get<DbInfo>('/admin/db-info').then(setDbInfo).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/admin/settings', { app_name: appName, support_email: supportEmail });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const statCards = [
    { label: 'Total de tiendas creadas', value: stats?.totalTenants ?? 0 },
    { label: 'Total de usuarios registrados', value: stats?.totalUsers ?? 0 },
    { label: 'Total de órdenes procesadas', value: stats?.totalOrders ?? 0 },
    { label: 'Ingresos totales', value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}` },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Configuración Global</h1>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Configuración General</h2>
        <form onSubmit={handleSave} className="mt-4 max-w-lg space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre de la aplicación</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email de soporte</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-sm text-green-600">Cambios guardados</span>}
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Estadísticas del Sistema</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Base de Datos</h2>
        <div className="mt-4 max-w-lg rounded-xl border bg-white p-6 shadow-sm">
          {dbInfo ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Proyecto</span><span className="text-slate-900">{dbInfo.project}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Estado</span>
                <span className={`font-medium ${dbInfo.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{dbInfo.status}</span>
              </div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Host</span><span className="font-mono text-xs text-slate-900">{dbInfo.host}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Versión</span><span className="text-slate-900">{dbInfo.version}</span></div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No se pudo obtener información de la base de datos</p>
          )}
        </div>
      </div>
    </div>
  );
}
