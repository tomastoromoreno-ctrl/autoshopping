'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Globe, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function DomainPage() {
  const [config, setConfig] = useState<any>(null);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get<any>('/stores/config').then(setConfig).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!domain) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.patch<any>('/stores/config', {
        custom_domain: domain,
        domain_verified: false,
      });
      setMessage({ type: 'success', text: 'Dominio guardado. Verifica los registros DNS para activarlo.' });
      setConfig({ ...config, custom_domain: domain, domain_verified: false });
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar dominio.' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post<any>('/stores/verify-domain', { domain: config.custom_domain });
      setMessage({ type: 'success', text: 'Verificación iniciada. Puede tardar unos minutos.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al verificar dominio.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dominio Personalizado</h1>
      <p className="mt-1 text-sm text-slate-500">Configura un dominio propio para tu tienda (ej: tienda.com)</p>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle size={16} className="inline mr-1" /> : <AlertCircle size={16} className="inline mr-1" />}
          {message.text}
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">Configurar dominio</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subdominio actual</label>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{config?.subdomain || '—'}.autoshopping.cl</span>
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-xs text-green-600">Activo</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dominio personalizado (opcional)</label>
            <div className="flex gap-2">
              <input type="text" placeholder="tienda.com" value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
              <button onClick={handleSave} disabled={saving || !domain}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {config?.custom_domain && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-700">Registros DNS requeridos:</p>
              <div className="mt-2 space-y-1 font-mono text-xs text-slate-600">
                <p><strong>CNAME:</strong> {config.custom_domain} → cname.vercel-dns.com</p>
                <p><strong>o A record:</strong> 76.76.21.21</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.domain_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {config.domain_verified ? 'Verificado' : 'Pendiente de verificación'}
                </span>
                {!config.domain_verified && (
                  <button onClick={handleVerify} disabled={saving}
                    className="rounded-lg border px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white transition">
                    Verificar ahora
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">¿Cómo funciona?</p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-blue-600">
              <li>Configura el registro CNAME o A en tu proveedor de DNS</li>
              <li>La verificación automática toma entre 5 minutos y 48 horas</li>
              <li>El certificado SSL se genera automáticamente</li>
              <li>Tu tienda también estará disponible en el subdominio por defecto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
