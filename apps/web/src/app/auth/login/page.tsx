'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ access_token: string; refresh_token?: string; user: any }>('/auth/signin', { email, password });
      localStorage.setItem('access_token', res.access_token);
      if (res.refresh_token) {
        localStorage.setItem('refresh_token', res.refresh_token);
      }

      const payload = JSON.parse(atob(res.access_token.split('.')[1]));
      const role = payload.user_metadata?.role || payload.role;
      const tenantId = payload.user_metadata?.tenant_id || payload.tenant_id;

      // If there's a redirect URL (e.g. from invitation), go there first
      if (redirectTo) {
        router.push(redirectTo);
      } else if (role === 'super_admin') {
        router.push('/admin');
      } else if (tenantId) {
        // Any user with a tenant (owner, admin, manager, editor, viewer) goes to dashboard
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">AutoShopping</h1>
            <p className="mt-1 text-sm text-slate-500">Inicia sesión en tu panel</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" required />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link href={`/auth/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="font-medium text-blue-600 hover:underline">Regístrate</Link>
          </p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
