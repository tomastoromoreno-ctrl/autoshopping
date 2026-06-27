'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Check, Truck, ShieldAlert, Settings, HelpCircle, Save } from 'lucide-react';

interface ShippingConfig {
  provider: 'starken' | 'chilexpress' | 'blueexpress' | 'flat_rate';
  is_enabled: boolean;
  mode?: 'dynamic' | 'collect';
  api_key?: string;
  api_secret?: string;
  client_id?: string;
  origin_region?: string;
  origin_commune?: string;
  origin_address?: string;
  flat_rate_cost?: number;
}

const PROVIDERS = [
  { id: 'starken', name: 'Starken', logo: '📦 Starken', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'chilexpress', name: 'Chilexpress', logo: '🚚 Chilexpress', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { id: 'blueexpress', name: 'Blue Express', logo: '🔵 Blue Express', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'flat_rate', name: 'Tarifa Plana (Envío Propio)', logo: '🛵 Tarifa Plana', color: 'bg-slate-50 text-slate-700 border-slate-200' }
] as const;

export default function ShippingDashboardPage() {
  const [configs, setConfigs] = useState<Record<string, ShippingConfig>>({
    starken: { provider: 'starken', is_enabled: false, mode: 'dynamic', api_key: '', client_id: '', origin_region: 'Metropolitana', origin_commune: 'Santiago', origin_address: '' },
    chilexpress: { provider: 'chilexpress', is_enabled: false, mode: 'dynamic', api_key: '', client_id: '', origin_region: 'Metropolitana', origin_commune: 'Santiago', origin_address: '' },
    blueexpress: { provider: 'blueexpress', is_enabled: false, mode: 'dynamic', api_key: '', api_secret: '', client_id: '', origin_region: 'Metropolitana', origin_commune: 'Santiago', origin_address: '' },
    flat_rate: { provider: 'flat_rate', is_enabled: false, flat_rate_cost: 3990, origin_region: 'Metropolitana', origin_commune: 'Santiago', origin_address: '' },
  });
  
  const [activeTab, setActiveTab] = useState<'starken' | 'chilexpress' | 'blueexpress' | 'flat_rate'>('starken');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<ShippingConfig[]>('/shipping/config')
      .then((data) => {
        if (data && data.length > 0) {
          const newConfigs = { ...configs };
          data.forEach((c) => {
            newConfigs[c.provider] = {
              ...newConfigs[c.provider],
              ...c,
            };
          });
          setConfigs(newConfigs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (provider: keyof typeof configs) => {
    setConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        is_enabled: !prev[provider].is_enabled
      }
    }));
  };

  const handleChange = (provider: keyof typeof configs, field: keyof ShippingConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = async (provider: keyof typeof configs) => {
    setSaving(true);
    try {
      await api.patch('/shipping/config', configs[provider]);
      alert(`Configuración de ${provider.toUpperCase()} guardada con éxito.`);
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hub de Envíos Integrado</h1>
          <p className="text-sm text-slate-500">Conecta couriers chilenos y cotiza tarifas en tiempo real en tu checkout.</p>
        </div>
      </div>

      {/* Grid de Transportistas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROVIDERS.map((p) => {
          const isEnabled = configs[p.id]?.is_enabled;
          const isActive = activeTab === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                isActive ? 'ring-2 ring-primary border-primary' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${p.color}`}>
                  {p.logo}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(p.id);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-primary' : 'bg-slate-200'
                  }`}
                  aria-label={`Habilitar ${p.name}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {isEnabled ? '🟢 Activo en Checkout' : '🔴 Inactivo'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Formulario de Configuración del Courier Activo */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-slate-900">
            Ajustes de {PROVIDERS.find((p) => p.id === activeTab)?.name}
          </h2>
        </div>

        <div className="mt-6 space-y-6">
          {/* Alerta de inactividad */}
          {!configs[activeTab]?.is_enabled && (
            <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-800 text-sm">
              <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-semibold">Este transportista está desactivado.</span> Habilítalo usando el interruptor en la tarjeta superior para que aparezca en el checkout de tus clientes.
              </div>
            </div>
          )}

          {/* Configuración de Dirección de Origen (Necesaria para cotizaciones reales) */}
          <div className="grid gap-4 sm:grid-cols-3 border-b pb-6">
            <div className="sm:col-span-3">
              <h3 className="text-sm font-semibold text-slate-800">Dirección de Origen del Despacho</h3>
              <p className="text-xs text-slate-500">Es el origen desde donde Starken/Chilexpress calcularán el costo del despacho.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Región de Origen</label>
              <input
                type="text"
                value={configs[activeTab]?.origin_region || ''}
                onChange={(e) => handleChange(activeTab, 'origin_region', e.target.value)}
                placeholder="Ej: Metropolitana"
                aria-label="Región de Origen"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Comuna de Origen</label>
              <input
                type="text"
                value={configs[activeTab]?.origin_commune || ''}
                onChange={(e) => handleChange(activeTab, 'origin_commune', e.target.value)}
                placeholder="Ej: Las Condes"
                aria-label="Comuna de Origen"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Calle y Número de Origen</label>
              <input
                type="text"
                value={configs[activeTab]?.origin_address || ''}
                onChange={(e) => handleChange(activeTab, 'origin_address', e.target.value)}
                placeholder="Ej: Av. Vitacura 1234"
                aria-label="Calle y Número de Origen"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Campos Específicos por Proveedor */}
          <div className="space-y-4">
            {activeTab === 'flat_rate' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600">Costo de la Tarifa Plana (CLP)</label>
                <input
                  type="number"
                  value={configs.flat_rate.flat_rate_cost || 0}
                  onChange={(e) => handleChange('flat_rate', 'flat_rate_cost', Number(e.target.value))}
                  placeholder="Ej: 3990"
                  aria-label="Costo de la Tarifa Plana"
                  className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600">Modo de Despacho</label>
                  <select
                    value={configs[activeTab]?.mode || 'dynamic'}
                    onChange={(e) => handleChange(activeTab, 'mode', e.target.value)}
                    aria-label="Modo de Despacho"
                    className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary font-medium text-slate-700 bg-white"
                  >
                    <option value="dynamic">Cotización Dinámica Estimada (Cobrar en Checkout)</option>
                    <option value="collect">Envío por Pagar (Costo $0 al cliente, cancela al recibir)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400 font-normal">
                    {configs[activeTab]?.mode === 'collect'
                      ? '💡 En este modo no se requieren credenciales API obligatorias para cotizar, ya que el cliente pagará directamente al transportista.'
                      : '🔑 Requiere credenciales de integración comerciales válidas proporcionadas por la empresa de transportes.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">RUT / ID de Cliente</label>
                    <input
                      type="text"
                      value={configs[activeTab]?.client_id || ''}
                      onChange={(e) => handleChange(activeTab, 'client_id', e.target.value)}
                      placeholder="Ej: 76123456-7"
                      aria-label="RUT o ID de Cliente"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">API Key / Token de Acceso (Opcional si es Por Pagar)</label>
                    <input
                      type="password"
                      value={configs[activeTab]?.api_key || ''}
                      onChange={(e) => handleChange(activeTab, 'api_key', e.target.value)}
                      placeholder="🔑 Token o contraseña de integración"
                      aria-label="API Key o Token de Acceso"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {activeTab === 'blueexpress' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">API Secret Key (Client Secret)</label>
                    <input
                      type="password"
                      value={configs.blueexpress.api_secret || ''}
                      onChange={(e) => handleChange('blueexpress', 'api_secret', e.target.value)}
                      placeholder="Secret Key"
                      aria-label="API Secret Key"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(activeTab)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Ajustes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
