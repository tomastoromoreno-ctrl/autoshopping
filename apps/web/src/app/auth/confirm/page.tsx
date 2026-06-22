'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('token_hash');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de confirmación no encontrado');
      return;
    }
    
    if (calledRef.current) return;
    calledRef.current = true;

    api.post('/auth/confirm', { token })
      .then(() => {
        setStatus('success');
        setMessage('Cuenta confirmada exitosamente');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Error al confirmar la cuenta');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
        {status === 'loading' && (
          <div>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Confirmando tu cuenta...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">✓</div>
            <h1 className="text-xl font-bold text-slate-900">{message}</h1>
            <Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Ir a iniciar sesión
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">✕</div>
            <h1 className="text-xl font-bold text-slate-900">Error</h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Volver a iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
