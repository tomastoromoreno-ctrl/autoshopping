'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    try {
      const cleanEmail = email.trim();
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: name.trim(), role: 'store_owner' },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: cleanEmail,
            name: name.trim(),
            role: 'store_owner',
            email_confirmed: true,
          });
        } catch {}
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">✓</div>
          <h1 className="text-xl font-bold text-slate-900">Registro exitoso</h1>
          <p className="mt-2 text-sm text-slate-500">Registrado correctamente. Por favor, inicia sesión para configurar tu tienda.</p>
          <Link href={`/auth/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="mt-4 inline-block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Ir a iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">AutoShopping</h1>
            <p className="mt-1 text-sm text-slate-500">Crea tu cuenta</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-700">Nombre</label>
              <input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" required />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-700">Email</label>
              <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" required />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" required />
            </div>
            <div>
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-700">Confirmar contraseña</label>
              <input id="register-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/auth/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="font-medium text-blue-600 hover:underline">Inicia sesión</Link>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
