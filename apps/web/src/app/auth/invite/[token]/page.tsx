'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  tenant_name: string;
  expires_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  store_admin: 'Administrador',
  store_manager: 'Gerente',
  store_editor: 'Editor',
  store_viewer: 'Visualizador',
};

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setIsLoggedIn(true);
        setUserEmail(payload.email || '');
      } catch {
        setIsLoggedIn(false);
      }
    }

    // Verify the invitation token
    api.get<InvitationInfo>(`/users/invitations/verify/${token}`)
      .then((data) => setInvitation(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      await api.post(`/users/invitations/${token}/accept`);

      // Refresh token to get new role + tenant_id in JWT
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await api.post<{ access_token: string; refresh_token: string }>(
            '/auth/refresh',
            { refresh_token: refreshToken },
          );
          localStorage.setItem('access_token', refreshRes.access_token);
          localStorage.setItem('refresh_token', refreshRes.refresh_token);
        } catch {
          // If refresh fails, they'll need to re-login
        }
      }

      // Clear cached permissions
      sessionStorage.removeItem('user_permissions');
      setAccepted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Error state (invalid/expired/used token)
  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">❌</div>
          <h1 className="text-xl font-bold text-slate-900">Invitación no válida</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <div className="mt-6 space-y-2">
            <Link href="/auth/login" className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
              Ir a iniciar sesión
            </Link>
            <Link href="/" className="block w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Successfully accepted
  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✅</div>
          <h1 className="text-xl font-bold text-slate-900">¡Invitación aceptada!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ya eres parte del equipo de <strong>{invitation?.tenant_name}</strong> como{' '}
            <strong>{ROLE_LABELS[invitation?.role || ''] || invitation?.role}</strong>.
          </p>
          <button onClick={() => router.push('/dashboard')}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Invitation valid — show details
  const emailMismatch = isLoggedIn && userEmail && invitation?.email && userEmail.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl">📩</div>
          <h1 className="text-2xl font-bold text-slate-900">Invitación al equipo</h1>
          <p className="mt-1 text-sm text-slate-500">Te han invitado a unirte a una tienda</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {/* Invitation details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Tienda</span>
              <span className="text-sm font-semibold text-slate-900">{invitation?.tenant_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Rol asignado</span>
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                {ROLE_LABELS[invitation?.role || ''] || invitation?.role}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Invitado a</span>
              <span className="text-sm font-medium text-slate-700">{invitation?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Expira</span>
              <span className="text-sm text-slate-700">
                {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {/* Email mismatch warning */}
          {emailMismatch && (
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
              <p className="font-medium">⚠️ Correo diferente</p>
              <p className="mt-0.5 text-xs">Estás logueado como <strong>{userEmail}</strong>, pero la invitación fue enviada a <strong>{invitation?.email}</strong>. Necesitas iniciar sesión con el correo de la invitación.</p>
            </div>
          )}

          {/* Action buttons */}
          {isLoggedIn && !emailMismatch ? (
            <button onClick={handleAccept} disabled={accepting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
              {accepting ? 'Aceptando invitación...' : 'Aceptar invitación'}
            </button>
          ) : (
            <div className="space-y-3">
              {emailMismatch ? (
                <button onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  sessionStorage.removeItem('user_permissions');
                  router.push(`/auth/login?redirect=/auth/invite/${token}`);
                }}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
                  Iniciar sesión con otro correo
                </button>
              ) : (
                <>
                  <Link href={`/auth/login?redirect=/auth/invite/${token}`}
                    className="block w-full text-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
                    Iniciar sesión
                  </Link>
                  <Link href={`/auth/register?redirect=/auth/invite/${token}`}
                    className="block w-full text-center rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                    Crear cuenta nueva
                  </Link>
                </>
              )}
              <p className="text-center text-xs text-slate-400">
                {emailMismatch ? 'Cierra esta sesión e inicia con el correo de la invitación.' : 'Inicia sesión o crea una cuenta para aceptar la invitación.'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition inline-flex items-center gap-1.5">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
