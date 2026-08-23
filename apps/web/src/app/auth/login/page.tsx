'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.trim();
      const supabase = createClient();

      let sessionData: any = null;
      let userData: any = null;

      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.');
          }
          if (authError.message.includes('Email not confirmed')) {
            throw new Error('Tu correo electrónico no ha sido confirmado aún. Por favor revisa tu bandeja de entrada.');
          }
          throw new Error(authError.message);
        }

        sessionData = data.session;
        userData = data.user;
      } catch (err: any) {
        // If error is specific credential/confirmation error, rethrow immediately
        if (err.message.includes('Correo o contraseña incorrectos') || err.message.includes('confirmado')) {
          throw err;
        }

        // Try API proxy fallback if browser direct fetch to Supabase failed
        try {
          const apiRes = await api.post<any>('/auth/signin', { email: cleanEmail, password });
          if (apiRes && apiRes.access_token) {
            sessionData = { access_token: apiRes.access_token, refresh_token: apiRes.refresh_token };
            userData = apiRes.user;
          } else {
            throw err;
          }
        } catch {
          if (err.message === 'Failed to fetch') {
            throw new Error('Error de conexión a la base de datos o bloqueador de publicidad activo (AdBlock / Brave Shield) en tu navegador. Por favor desactívalo para este sitio e intenta de nuevo.');
          }
          throw err;
        }
      }

      if (!sessionData) {
        throw new Error('No se pudo iniciar sesión. Por favor intenta nuevamente.');
      }

      const accessToken = sessionData.access_token;
      const refreshToken = sessionData.refresh_token;

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      // Check role and tenant from profile or metadata
      let role = userData?.user_metadata?.role;
      let tenantId = userData?.user_metadata?.tenant_id;

      if (!role || !tenantId) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', userData?.id)
            .maybeSingle();

          if (profile) {
            role = role || profile.role;
            tenantId = tenantId || profile.tenant_id;
          }
        } catch {}
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else if (role === 'super_admin' || role === 'support_agent') {
        router.push('/superadmin');
      } else if (tenantId) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al iniciar sesión');
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
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                <Link href="/auth/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none focus:border-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
