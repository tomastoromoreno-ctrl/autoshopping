'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Backup {
  id: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  file_url: string | null;
  file_size_bytes: number | null;
  includes: string[];
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface BackupConfig {
  auto_backup_enabled: boolean;
  frequency: string;
  retention_days: number;
  include_images: boolean;
  last_backup_at: string | null;
  next_backup_at: string | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [backupsRes, configRes] = await Promise.all([
        api.get<Backup[]>('/backups'),
        api.get<BackupConfig>('/backups/config'),
      ]);
      setBackups(Array.isArray(backupsRes) ? backupsRes : []);
      setConfig(configRes);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    setMessage(null);
    try {
      await api.post<any>('/backups/create');
      await loadAll();
      setMessage({ type: 'success', text: 'Backup creado exitosamente' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backupId: string) => {
    try {
      const data = await api.get<any>(`/backups/${backupId}/download`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    setMessage(null);
    try {
      const res = await api.patch<BackupConfig>('/backups/config', {
        auto_backup_enabled: config.auto_backup_enabled,
        frequency: config.frequency,
        retention_days: config.retention_days,
        include_images: config.include_images,
      });
      setConfig(res);
      setMessage({ type: 'success', text: 'Configuración de backups guardada' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm('¿Restaurar este backup? Los datos actuales serán reemplazados por los del backup. Esta acción no se puede deshacer.')) return;
    setMessage(null);
    try {
      const data = await api.get<any>(`/backups/${backupId}/download`);
      const res = await api.post<any>('/backups/restore', { backup_data: data });
      setMessage({ type: 'success', text: `Restauración completada. ${JSON.stringify(res.results)}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Backups</h1>
          <p className="mt-1 text-sm text-slate-500">Crea y gestiona copias de seguridad de tu tienda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(!showConfig)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            ⚙ Configuración
          </button>
          <button onClick={handleCreate} disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {creating ? '⏳ Creando...' : '💾 Crear backup ahora'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Config Panel */}
      {showConfig && config && (
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Configuración de backups automáticos</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={config.auto_backup_enabled}
                onChange={(e) => setConfig({ ...config, auto_backup_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">Habilitar backups automáticos</span>
            </label>

            {config.auto_backup_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia</label>
                  <select value={config.frequency} aria-label="Frecuencia de backup"
                    onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
                    className="w-full sm:w-48 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Retención (días)</label>
                  <input type="number" min="7" max="365" value={config.retention_days}
                    onChange={(e) => setConfig({ ...config, retention_days: Number(e.target.value) })}
                    className="w-full sm:w-48 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
                </div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={config.include_images}
                    onChange={(e) => setConfig({ ...config, include_images: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300" />
                  <span className="text-sm text-slate-700">Incluir URLs de imágenes</span>
                </label>
              </>
            )}

            <button onClick={handleSaveConfig} disabled={savingConfig}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
              {savingConfig ? 'Guardando...' : 'Guardar configuración'}
            </button>

            {config.last_backup_at && (
              <p className="text-xs text-slate-400">Último backup: {new Date(config.last_backup_at).toLocaleString('es-CL')}</p>
            )}
          </div>
        </div>
      )}

      {/* Backups List */}
      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Tamaño</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      backup.type === 'manual' ? 'bg-blue-100 text-blue-700' :
                      backup.type === 'automatic' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {backup.type === 'manual' ? 'Manual' : backup.type === 'automatic' ? 'Automático' : 'Programado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      backup.status === 'completed' ? 'bg-green-100 text-green-700' :
                      backup.status === 'failed' ? 'bg-red-100 text-red-700' :
                      backup.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {backup.status === 'completed' ? '✓ Completado' :
                       backup.status === 'failed' ? '✗ Error' :
                       backup.status === 'in_progress' ? '⏳ En progreso' : 'Pendiente'}
                    </span>
                    {backup.error_message && (
                      <p className="text-xs text-red-500 mt-1">{backup.error_message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {formatBytes(backup.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(backup.created_at).toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {backup.status === 'completed' && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDownload(backup.id)}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                          ⬇ Descargar
                        </button>
                        <button onClick={() => handleRestore(backup.id)}
                          className="rounded-lg border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 transition">
                          🔄 Restaurar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No hay backups aún. Crea tu primer backup.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
