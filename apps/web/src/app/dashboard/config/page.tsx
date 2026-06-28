'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface StoreConfig {
  currency: string;
  payment_provider: string;
  mercadopago_access_token: string;
  mercadopago_public_key: string;
  transbank_api_key: string;
  transbank_commerce_code: string;
  shipping_enabled: boolean;
  shipping_cost: number;
  free_shipping_min: number;
  sales_policy: string;
  shipping_policy: string;
  whatsapp_number: string;
  whatsapp_message: string;
}

export default function ConfigPage() {
  const [form, setForm] = useState<StoreConfig>({
    currency: 'CLP',
    payment_provider: 'mercadopago',
    mercadopago_access_token: '',
    mercadopago_public_key: '',
    transbank_api_key: '',
    transbank_commerce_code: '',
    shipping_enabled: false,
    shipping_cost: 0,
    free_shipping_min: 0,
    sales_policy: '',
    shipping_policy: '',
    whatsapp_number: '',
    whatsapp_message: 'Hola, me gustaría hacer una consulta sobre un producto.',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<StoreConfig>('/config').then(setForm).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/config', form);
      alert('Configuración guardada');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Configuración</h1>
      
      <div className="flex border-b">
        <a href="/dashboard/config" className="border-b-2 border-blue-600 px-4 py-2.5 text-sm font-bold text-blue-600">Configuración General</a>
        <a href="/dashboard/config/subscription" className="border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700">Mi Suscripción</a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Moneda y pagos</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Moneda</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                aria-label="Moneda"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="CLP">CLP (Peso chileno)</option>
                <option value="ARS">ARS (Peso argentino)</option>
                <option value="USD">USD (Dólar estadounidense)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Proveedor de pago</label>
              <select value={form.payment_provider} onChange={(e) => setForm({ ...form, payment_provider: e.target.value })}
                aria-label="Proveedor de pago"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="mercadopago">MercadoPago</option>
                <option value="transbank">Transbank</option>
              </select>
            </div>
          </div>
        </div>

        {form.payment_provider === 'mercadopago' && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">MercadoPago</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Access Token</label>
                <input type="password" value={form.mercadopago_access_token} onChange={(e) => setForm({ ...form, mercadopago_access_token: e.target.value })}
                  aria-label="Access Token de MercadoPago"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Public Key</label>
                <input type="password" value={form.mercadopago_public_key} onChange={(e) => setForm({ ...form, mercadopago_public_key: e.target.value })}
                  aria-label="Public Key de MercadoPago"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        )}

        {form.payment_provider === 'transbank' && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Transbank</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">API Key</label>
                <input type="password" value={form.transbank_api_key} onChange={(e) => setForm({ ...form, transbank_api_key: e.target.value })}
                  aria-label="API Key de Transbank"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Código de Comercio</label>
                <input type="text" value={form.transbank_commerce_code} onChange={(e) => setForm({ ...form, transbank_commerce_code: e.target.value })}
                  aria-label="Código de Comercio de Transbank"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Envío</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.shipping_enabled} onChange={(e) => setForm({ ...form, shipping_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">Habilitar envío</span>
            </label>
            {form.shipping_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Costo de envío</label>
                  <input type="number" step="0.01" value={form.shipping_cost} onChange={(e) => setForm({ ...form, shipping_cost: Number(e.target.value) })}
                    aria-label="Costo de envío"
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Envío gratis desde</label>
                  <input type="number" step="0.01" value={form.free_shipping_min} onChange={(e) => setForm({ ...form, free_shipping_min: Number(e.target.value) })}
                    aria-label="Envío gratis desde"
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">WhatsApp Business</h2>
          <p className="mt-1 text-sm text-slate-500">Botón flotante de WhatsApp que aparece en tu tienda para que los clientes te contacten directamente.</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Número de WhatsApp</label>
              <input type="tel" placeholder="Ej: 56912345678" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                aria-label="Número de WhatsApp"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <p className="mt-1 text-xs text-slate-400">Incluye el código de país sin el signo +. Ej: 56912345678</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mensaje predeterminado</label>
              <textarea
                value={form.whatsapp_message}
                onChange={(e) => setForm({ ...form, whatsapp_message: e.target.value })}
                rows={3}
                placeholder="Hola, me gustaría hacer una consulta sobre un producto..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-slate-400">Mensaje que el cliente verá al abrir WhatsApp. Déjalo vacío para usar el predeterminado.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Políticas de la tienda</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Políticas de Venta y Devoluciones</label>
              <textarea
                value={form.sales_policy || ''}
                onChange={(e) => setForm({ ...form, sales_policy: e.target.value })}
                rows={4}
                placeholder="Escribe aquí los términos de venta, cambios, devoluciones y reembolsos..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary font-normal text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Políticas de Envío y Despacho</label>
              <textarea
                value={form.shipping_policy || ''}
                onChange={(e) => setForm({ ...form, shipping_policy: e.target.value })}
                rows={4}
                placeholder="Escribe aquí las zonas de envío, plazos de entrega, costos y transportistas..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary font-normal text-slate-800"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
