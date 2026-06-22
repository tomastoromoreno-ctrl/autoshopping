import Link from 'next/link';

interface StorePolicyProps {
  params: {
    subdomain: string;
    type: 'sales' | 'shipping';
  };
}

interface StoreData {
  id: string;
  name: string;
  primary_color?: string;
  config?: {
    sales_policy?: string;
    shipping_policy?: string;
  };
}

export default async function StorePolicyPage({ params }: StorePolicyProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  
  let store: StoreData | null = null;
  try {
    const res = await fetch(`${apiUrl}/stores/${params.subdomain}/public`, { cache: 'no-store' });
    if (res.ok) store = await res.json();
  } catch {}

  if (!store) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white px-4">
        <h1 className="text-2xl font-bold text-slate-900">Tienda no encontrada</h1>
        <p className="mt-2 text-slate-600">No pudimos cargar los datos de esta tienda.</p>
      </div>
    );
  }

  const isSales = params.type === 'sales';
  const policyTitle = isSales ? 'Políticas de Venta y Devoluciones' : 'Políticas de Envío y Despacho';
  const policyText = isSales ? store.config?.sales_policy : store.config?.shipping_policy;
  const primaryColor = store.primary_color || '#3b82f6';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link 
          href={`/store/${params.subdomain}`} 
          className="text-sm font-medium hover:underline"
          style={{ color: primaryColor }}
        >
          &larr; Volver a la tienda
        </Link>
      </div>
      
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 
          className="text-2xl font-bold border-b pb-4 text-slate-900"
          style={{ borderBottomColor: `${primaryColor}20` }}
        >
          {policyTitle}
        </h1>
        
        <div className="mt-6">
          {policyText ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 font-sans">
              {policyText}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              Esta política no ha sido configurada por la tienda todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
