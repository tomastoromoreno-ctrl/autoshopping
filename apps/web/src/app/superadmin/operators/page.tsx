'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
  email_confirmed: boolean;
  created_at: string;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'support_agent'>('support_agent');
  const [inviting, setInviting] = useState(false);
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
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await api.get<Operator[]>('/superadmin/operators');
      setOperators(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post('/superadmin/operators', {
        email: inviteEmail,
        role: inviteRole,
      });
      alert('Invitación enviada con éxito.');
      setInviteEmail('');
      fetchOperators();
    } catch (err: any) {
      alert(err.message || 'Error al invitar al operador');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (operator: Operator) => {
    const isCurrentlyActive = operator.role !== 'customer';
    const confirmMsg = isCurrentlyActive
      ? `¿Estás seguro de desactivar al operador ${operator.name}? Perderá sus accesos administrativos.`
      : `¿Estás seguro de activar al operador ${operator.name}? Recuperará sus accesos administrativos.`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.patch(`/superadmin/operators/${operator.id}`, {
        active: !isCurrentlyActive,
      });
      fetchOperators();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isSuperAdmin = operatorRole === 'super_admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Operadores y Roles</h1>
        <p className="text-slate-400 text-sm mt-1">Invita y gestiona las cuentas de los operadores del equipo de AutoGastos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Invite Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4 self-start">
          <h2 className="text-lg font-bold text-slate-200">Invitar Nuevo Operador</h2>
          
          {isSuperAdmin ? (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@autogastos.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Rol Asignado</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  title="Rol asignado del operador"
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                >
                  <option value="support_agent">Agente de Soporte (Lectura + God Mode)</option>
                  <option value="super_admin">Super Admin (Acceso Total)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 text-xs transition-all shadow-md"
              >
                {inviting ? 'Enviando...' : 'Enviar Invitación por Email'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              🔒 Solo los operadores con rol de <strong>Super Admin</strong> pueden invitar nuevos operadores al panel administrativo.
            </p>
          )}
        </div>

        {/* Right column: Operators Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
                <th className="px-6 py-4">Operador</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Confirmado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-semibold">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-2" />
                    Cargando operadores del sistema...
                  </td>
                </tr>
              ) : operators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    No se encontraron operadores registrados.
                  </td>
                </tr>
              ) : (
                operators.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{row.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{row.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        row.role === 'super_admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' :
                        row.role === 'support_agent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {row.role === 'super_admin' ? 'Super Admin' : row.role === 'support_agent' ? 'Soporte' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={row.email_confirmed ? 'text-emerald-400' : 'text-slate-500'}>
                        {row.email_confirmed ? '✓ Sí' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => handleToggleStatus(row)}
                          className={`rounded px-3 py-1.5 text-xs font-semibold border transition-all ${
                            row.role !== 'customer'
                              ? 'border-rose-900/30 text-rose-400 hover:bg-rose-500/10'
                              : 'border-emerald-900/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {row.role !== 'customer' ? 'Desactivar' : 'Activar'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No permitido</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
