'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Store, ArrowRight, Check, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainCheck, setSubdomainCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [domainSuffix, setDomainSuffix] = useState('.localhost:3000');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (typeof window !== 'undefined') {
      setDomainSuffix(`.${window.location.host}`);
    }
  }, [router]);

  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').replace(/(^-|-$)/g, '');

  const checkSubdomain = useCallback(async (value: string) => {
    if (value.length < 3) { setSubdomainCheck('idle'); return; }
    setSubdomainCheck('checking');
    try {
      const res = await api.post<{ available: boolean }>(`/tenants/verify-subdomain`, { subdomain: value });
      setSubdomainCheck(res.available ? 'available' : 'taken');
    } catch {
      setSubdomainCheck('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (subdomain) checkSubdomain(subdomain); }, 500);
    return () => clearTimeout(timer);
  }, [subdomain, checkSubdomain]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subdomainCheck !== 'available') return;
    setLoading(true);
    setError('');
    try {
      await api.post('/tenants', { name: storeName, subdomain });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Crea tu tienda</h1>
          <p className="mt-2 text-sm text-slate-500">Configura tu e-commerce en menos de 1 minuto</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleCreate} className="space-y-5">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700">Nombre de tu tienda</label>
              <input type="text" value={storeName} onChange={(e) => { setStoreName(e.target.value); if (!subdomain) setSubdomain(slugify(e.target.value)); }}
                placeholder="Ej: Mi Tienda Deportiva" required
                className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Subdominio</label>
              <div className="mt-1 flex rounded-lg border focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input type="text" value={subdomain} onChange={(e) => setSubdomain(slugify(e.target.value))}
                  placeholder="mitienda" required minLength={3} maxLength={30}
                  className="flex-1 rounded-l-lg border-0 px-3 py-2.5 text-sm outline-none" />
                <span className="flex items-center rounded-r-lg border-l bg-slate-50 px-3 text-sm text-slate-500">{domainSuffix}</span>
              </div>
              {subdomain.length >= 3 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {subdomainCheck === 'checking' && <><Loader2 className="h-3 w-3 animate-spin text-slate-400" /><span className="text-slate-400">Verificando...</span></>}
                  {subdomainCheck === 'available' && <><Check className="h-3 w-3 text-green-500" /><span className="text-green-600">{subdomain}{domainSuffix} está disponible</span></>}
                  {subdomainCheck === 'taken' && <><span className="text-red-500">Este subdominio ya está en uso</span></>}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || subdomainCheck !== 'available'}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Crear mi tienda</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Gratis para empezar. Sin tarjeta de crédito.
        </p>
      </div>
    </div>
  );
}
