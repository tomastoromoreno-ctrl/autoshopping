'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanEmail = email.trim();
      const supabase = createClient();

      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/reset-password`
        : 'https://web-autoshopping.vercel.app/auth/reset-password';

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar recuperación de contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Revisa tu correo</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor revisa tu bandeja de entrada (y spam) y haz clic en el enlace para restablecer tu contraseña.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Volver a Iniciar Sesión
            </Link>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              ¿No recibiste el correo? Reintentar
            </button>
          </div>
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
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa tu correo para recibir las instrucciones de recuperación
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
              <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-700">
                Correo Electrónico
              </label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
