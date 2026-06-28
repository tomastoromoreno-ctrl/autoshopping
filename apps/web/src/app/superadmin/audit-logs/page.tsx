'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  created_at: string;
  action_type: string;
  reason: string;
  notes: string;
  ip_address: string;
  operator: {
    name: string;
    email: string;
  };
  store: {
    name: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (actionFilter) params.set('actionType', actionFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await api.get<{ data: AuditLog[]; total: number }>(`/superadmin/audit-logs?${params}`);
      setLogs(res.data);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    // Header
    const headers = ['Fecha', 'Operador', 'Email Operador', 'Tienda Destino', 'Accion', 'Motivo', 'Detalle', 'IP'];
    
    // Rows
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.operator?.name || '',
      log.operator?.email || '',
      log.store?.name || 'Sistema/Global',
      log.action_type,
      log.reason || '',
      log.notes || '',
      log.ip_address || ''
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Bitácora de Auditoría</h1>
          <p className="text-slate-400 text-sm mt-1">Registro inmutable de todas las acciones críticas ejecutadas por operadores.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 px-5 py-2.5 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-30 self-start"
        >
          📥 Exportar a CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Acción</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            title="Acción de auditoría"
            className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            <option value="">Todas las acciones</option>
            <option value="GOD_MODE_ENTER">GOD_MODE_ENTER</option>
            <option value="GOD_MODE_EXIT">GOD_MODE_EXIT</option>
            <option value="STORE_SUSPENDED">STORE_SUSPENDED</option>
            <option value="STORE_ACTIVATED">STORE_ACTIVATED</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            <option value="FORCE_LOGOUT">FORCE_LOGOUT</option>
            <option value="STORE_RESET">STORE_RESET</option>
            <option value="PLAN_CHANGED">PLAN_CHANGED</option>
            <option value="PAYMENT_MARKED">PAYMENT_MARKED</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Fecha de inicio"
            className="mt-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Fecha de fin"
            className="mt-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>

        {(actionFilter || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setActionFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 px-4 py-2 text-xs font-bold"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Operador</th>
              <th className="px-6 py-4">Tienda Destino</th>
              <th className="px-6 py-4">Tipo Acción</th>
              <th className="px-6 py-4">Motivo</th>
              <th className="px-6 py-4">Detalle / IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-2" />
                  Cargando bitácora de auditoría...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                  No hay registros de auditoría que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-800/25 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-200">{row.operator?.name || 'Sistema'}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{row.operator?.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-300">{row.store?.name || 'Sistema/Global'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                      row.action_type.includes('GOD_MODE') ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' :
                      row.action_type.includes('RESET') ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' :
                      row.action_type.includes('SUSPEND') ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                      row.action_type.includes('ACTIVATE') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {row.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 max-w-[200px] truncate" title={row.reason}>
                    {row.reason || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    <div>{row.notes}</div>
                    {row.ip_address && <div className="text-[10px] text-slate-500 font-mono mt-1">IP: {row.ip_address}</div>}
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
    </div>
  );
}
