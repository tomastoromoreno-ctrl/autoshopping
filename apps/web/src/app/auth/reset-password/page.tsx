'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user arrived via Supabase recovery link (auth token in hash)
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // ready to reset password
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">¡Contraseña actualizada!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tu nueva contraseña ha sido guardada correctamente. Redirigiendo al inicio de sesión...
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Ir a Iniciar Sesión ahora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa y confirma tu nueva contraseña de acceso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
                Nueva Contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Guardando nueva contraseña...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
