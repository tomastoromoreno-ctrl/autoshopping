import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Sin conexión</h1>
      <p className="text-slate-500 max-w-sm mb-8">Parece que no tienes conexión a internet. Vuelve a intentarlo cuando tengas señal.</p>
      <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all">
        Intentar de nuevo
      </Link>
    </div>
  );
}
