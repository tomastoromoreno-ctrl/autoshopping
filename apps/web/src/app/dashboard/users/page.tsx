'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_confirmed: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const ROLES = [
  { value: 'store_owner', label: 'Dueño', color: 'bg-purple-100 text-purple-700', icon: '👑' },
  { value: 'store_admin', label: 'Administrador', color: 'bg-blue-100 text-blue-700', icon: '🛡️' },
  { value: 'store_manager', label: 'Gerente', color: 'bg-green-100 text-green-700', icon: '📋' },
  { value: 'store_editor', label: 'Editor', color: 'bg-yellow-100 text-yellow-700', icon: '✏️' },
  { value: 'store_viewer', label: 'Visualizador', color: 'bg-slate-100 text-slate-700', icon: '👁️' },
];

const INVITE_ROLES = ROLES.filter((r) => r.value !== 'store_owner');

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-600' },
  accepted: { label: 'Aceptada', color: 'bg-green-50 text-green-600' },
  revoked: { label: 'Revocada', color: 'bg-red-50 text-red-600' },
  expired: { label: 'Expirada', color: 'bg-slate-50 text-slate-500' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('store_viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);
  const [tab, setTab] = useState<'members' | 'invitations'>('members');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { hasPermission } = usePermissions();

  const canWrite = hasPermission('users.write');
  const canDelete = hasPermission('users.delete');

  const loadUsers = useCallback(() => {
    api.get<User[]>('/users')
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const loadInvitations = useCallback(() => {
    api.get<Invitation[]>('/users/invitations/list')
      .then((res) => setInvitations(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUsers();
    loadInvitations();
  }, [loadUsers, loadInvitations]);

  const handleRoleChange = async (userId: string, role: string) => {
    setMessage(null);
    try {
      await api.patch(`/users/${userId}`, { role });
      setMessage({ type: 'success', text: 'Rol actualizado correctamente' });
      loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`¿Remover a "${userName}" del equipo? El usuario perderá acceso a esta tienda.`)) return;
    setMessage(null);
    try {
      await api.delete(`/users/${userId}`);
      setMessage({ type: 'success', text: 'Usuario removido del equipo' });
      loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const res = await api.post<{ token: string; email: string; role: string }>('/users/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      const inviteLink = `${window.location.origin}/auth/invite/${res.token}`;
      setInviteResult({
        type: 'success',
        text: `Invitación creada para ${res.email}`,
        link: inviteLink,
      });
      setInviteEmail('');
      loadInvitations();
    } catch (err: any) {
      setInviteResult({ type: 'error', text: err.message });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setInviteResult((prev) => prev ? { ...prev, text: '¡Link copiado al portapapeles!' } : null);
    });
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('¿Revocar esta invitación?')) return;
    try {
      await api.delete(`/users/invitations/${invitationId}`);
      loadInvitations();
      setMessage({ type: 'success', text: 'Invitación revocada' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find((r) => r.value === role) || { value: role, label: role, color: 'bg-slate-100 text-slate-700', icon: '❓' };
  };

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Equipo</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona los miembros de tu equipo y sus roles</p>
        </div>
        {canWrite && (
          <button onClick={() => { setShowInviteModal(true); setInviteResult(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Invitar miembro
          </button>
        )}
      </div>

      {/* Roles Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <span key={role.value} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
            {role.icon} {role.label}
          </span>
        ))}
      </div>

      {/* Status message */}
      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex border-b">
        <button onClick={() => setTab('members')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Miembros ({users.length})
        </button>
        <button onClick={() => setTab('invitations')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition relative ${tab === 'invitations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Invitaciones
          {pendingInvitations.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
              {pendingInvitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Confirmado</th>
                {(canWrite || canDelete) && <th className="px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                const isOwner = user.role === 'store_owner';
                return (
                  <tr key={user.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3">
                      {canWrite && !isOwner ? (
                        <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          aria-label="Rol del usuario"
                          className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-blue-600">
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.icon} {roleInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.email_confirmed ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {user.email_confirmed ? 'Sí' : 'No'}
                      </span>
                    </td>
                    {(canWrite || canDelete) && (
                      <td className="px-4 py-3">
                        {canDelete && !isOwner && (
                          <button onClick={() => handleDelete(user.id, user.name)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 transition">
                            Remover
                          </button>
                        )}
                        {isOwner && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hay miembros en el equipo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations Tab */}
      {tab === 'invitations' && (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Expira</th>
                {canWrite && <th className="px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => {
                const roleInfo = getRoleInfo(inv.role);
                const statusInfo = STATUS_LABELS[inv.status] || { label: inv.status, color: 'bg-slate-50 text-slate-500' };
                const isExpired = new Date(inv.expires_at) < new Date();
                return (
                  <tr key={inv.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {inv.status === 'pending' && !isExpired
                        ? new Date(inv.expires_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        {inv.status === 'pending' && !isExpired && (
                          <button onClick={() => handleRevokeInvitation(inv.id)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 transition">
                            Revocar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {invitations.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hay invitaciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">💡 Gestión de permisos</p>
        <p className="mt-1 text-blue-600">Para configurar qué puede hacer cada rol, ve a <a href="/dashboard/permissions" className="underline font-medium">Roles y Permisos</a>.</p>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Invitar miembro al equipo</h2>
              <button onClick={() => setShowInviteModal(false)} title="Cerrar modal" className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700">Correo electrónico</label>
                <input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@ejemplo.com" required
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" />
              </div>

              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700">Rol</label>
                <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-600">
                  {INVITE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.icon} {role.label}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  {inviteRole === 'store_admin' && 'Acceso casi total: productos, órdenes, usuarios, apariencia, blog, etc.'}
                  {inviteRole === 'store_manager' && 'Gestión operativa: productos, órdenes, blog, promociones, banners.'}
                  {inviteRole === 'store_editor' && 'Contenido: productos, blog, banners y categorías (solo lectura).'}
                  {inviteRole === 'store_viewer' && 'Solo lectura: puede ver productos, órdenes, analytics, etc.'}
                </p>
              </div>

              {inviteResult && (
                <div className={`rounded-lg p-3 text-sm ${inviteResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <p className="font-medium">{inviteResult.text}</p>
                  {inviteResult.link && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 mb-1">Link de invitación (válido por 7 días):</p>
                      <div className="flex gap-2">
                        <input type="text" readOnly value={inviteResult.link}
                          title="Enlace de invitación"
                          placeholder="Enlace de invitación"
                          className="flex-1 rounded border bg-white px-2 py-1.5 text-xs font-mono text-slate-700 select-all" />
                        <button type="button" onClick={() => handleCopyLink(inviteResult.link!)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 whitespace-nowrap">
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={inviteLoading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
                {inviteLoading ? 'Enviando invitación...' : 'Crear invitación'}
              </button>
            </form>

            <p className="mt-3 text-xs text-slate-400 text-center">
              Se generará un link que podrás compartir con el invitado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
