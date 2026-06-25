'use client';

import { useState, useEffect } from 'react';
import { Shield, Settings, Activity, Trash2, Key, RefreshCw, Plus, Check, Copy, AlertTriangle, Play } from 'lucide-react';

const SCOPES_LIST = [
  { value: 'products:read', label: 'products:read', desc: 'Leer productos y categorías' },
  { value: 'products:write', label: 'products:write', desc: 'Crear, editar y borrar productos/categorías' },
  { value: 'orders:read', label: 'orders:read', desc: 'Ver pedidos e historial' },
  { value: 'orders:write', label: 'orders:write', desc: 'Actualizar y gestionar pedidos' },
  { value: 'customers:read', label: 'customers:read', desc: 'Ver lista de clientes' },
  { value: 'customers:write', label: 'customers:write', desc: 'Crear y editar clientes' },
  { value: 'inventory:read', label: 'inventory:read', desc: 'Ver stock' },
  { value: 'inventory:write', label: 'inventory:write', desc: 'Ajustar inventario' },
  { value: 'marketing:read', label: 'marketing:read', desc: 'Ver cupones y promociones' },
  { value: 'marketing:write', label: 'marketing:write', desc: 'Gestionar cupones y promociones' },
  { value: 'analytics:read', label: 'analytics:read', desc: 'Ver reportes y métricas de ventas' },
  { value: 'settings:read', label: 'settings:read', desc: 'Ver configuraciones de la tienda' },
  { value: 'settings:write', label: 'settings:write', desc: 'Modificar configuraciones de la tienda' },
];

const EVENTS_LIST = [
  { value: 'order.created', label: 'order.created' },
  { value: 'order.paid', label: 'order.paid' },
  { value: 'order.shipped', label: 'order.shipped' },
  { value: 'order.cancelled', label: 'order.cancelled' },
  { value: 'product.created', label: 'product.created' },
  { value: 'product.updated', label: 'product.updated' },
  { value: 'product.deleted', label: 'product.deleted' },
  { value: 'product.out_of_stock', label: 'product.out_of_stock' },
  { value: 'customer.created', label: 'customer.created' },
];

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  
  // Modales
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'live' | 'sandbox'>('live');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['products:read', 'orders:read']);
  const [copiedKey, setCopiedKey] = useState(false);

  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [whUrl, setWhUrl] = useState('');
  const [whDesc, setWhDesc] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['order.paid']);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${apiUrl}/me/api-keys`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`${apiUrl}/webhooks`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
        if (data.length > 0 && !selectedEndpoint) {
          selectEndpoint(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectEndpoint = async (ep: any) => {
    setSelectedEndpoint(ep);
    try {
      const res = await fetch(`${apiUrl}/webhooks/${ep.id}/deliveries`, { headers: getHeaders() });
      if (res.ok) {
        const logs = await res.json();
        setDeliveries(logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API Key creation
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/me/api-keys`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newKeyName,
          environment: newKeyEnv,
          scopes: newKeyScopes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.api_key);
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas revocar esta clave API? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${apiUrl}/me/api-keys/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Webhooks creation
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/webhooks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          url: whUrl,
          description: whDesc,
          events: whEvents,
        }),
      });
      if (res.ok) {
        setShowWebhookModal(false);
        setWhUrl('');
        setWhDesc('');
        fetchWebhooks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este webhook?')) return;
    try {
      const res = await fetch(`${apiUrl}/webhooks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        if (selectedEndpoint?.id === id) {
          setSelectedEndpoint(null);
          setDeliveries([]);
        }
        fetchWebhooks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      alert('Enviando petición webhook de prueba...');
      const res = await fetch(`${apiUrl}/webhooks/${id}/test`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        alert('¡Webhook enviado! Recargando historial...');
        if (selectedEndpoint?.id === id) {
          selectEndpoint(selectedEndpoint);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryWebhook = async (deliveryId: string) => {
    try {
      const res = await fetch(`${apiUrl}/webhooks/deliveries/${deliveryId}/retry`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        alert('Reintento encolado exitosamente.');
        if (selectedEndpoint) selectEndpoint(selectedEndpoint);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Desarrolladores e Integraciones</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestiona claves de API, suscríbete a eventos vía webhooks e integra sistemas externos con tu ecommerce.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'keys' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Claves de API (API Keys)
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'webhooks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Webhooks de Salida
          </button>
        </div>
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Credenciales Headless API</h2>
              <p className="text-sm text-slate-500">Crea credenciales con permisos granulares para frontends externos o ERPs.</p>
            </div>
            <button
              onClick={() => {
                setNewKey(null);
                setNewKeyName('');
                setShowKeyModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Crear Clave API
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prefijo</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entorno</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Scopes</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Último uso</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Creado el</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">
                      No hay claves de API creadas.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">{key.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-600">{key.key_prefix}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          key.environment === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {key.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={key.scopes.join(', ')}>
                        {key.scopes.join(', ')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Nunca'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Revocar Clave API"
                        >
                          <Trash2 className="h-4.5 w-4.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoints list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Webhook Endpoints</h2>
              <button
                onClick={() => setShowWebhookModal(true)}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>

            <div className="space-y-3">
              {webhooks.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-sm text-slate-400">
                  No hay webhooks registrados.
                </div>
              ) : (
                webhooks.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => selectEndpoint(ep)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                      selectedEndpoint?.id === ep.id
                        ? 'border-blue-500 bg-blue-50/20'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        ep.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {ep.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTestWebhook(ep.id); }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Enviar payload de prueba"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteWebhook(ep.id); }}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-mono text-slate-800 break-all">{ep.url}</p>
                    {ep.description && <p className="mt-1 text-xs text-slate-500">{ep.description}</p>}
                    <div className="mt-3 border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-400">
                      <span>{ep.events.length} Eventos</span>
                      {ep.consecutive_failures > 0 && (
                        <span className="text-red-500 font-semibold">{ep.consecutive_failures} fallos consec.</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delivery logs */}
          <div className="lg:col-span-2 space-y-4">
            {selectedEndpoint ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Historial de Envíos</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-md">{selectedEndpoint.url}</p>
                  </div>
                  <button
                    onClick={() => selectEndpoint(selectedEndpoint)}
                    className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Actualizar logs"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Evento</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código Resp.</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Intentos</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {deliveries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                            No hay entregas registradas para este endpoint.
                          </td>
                        </tr>
                      ) : (
                        deliveries.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-slate-700">{log.event_type}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-slate-600">
                              {log.last_response_status || 'Fallido (Network)'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{log.attempt_count}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                              {log.status !== 'success' && (
                                <button
                                  onClick={() => handleRetryWebhook(log.id)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                                >
                                  Reintentar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 shadow-sm">
                Selecciona un endpoint para ver su historial de envíos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREAR CLAVE API */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Crear Clave API</h3>
              <p className="text-sm text-slate-500 mt-1">Configure los permisos y el entorno para la nueva clave.</p>
            </div>

            {newKey ? (
              <div className="p-6 space-y-4">
                <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-800 flex gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Guarda esta clave API ahora</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Por razones de seguridad, no podremos mostrar esta clave nuevamente. Cópiala y guárdala en un lugar seguro.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 p-3 bg-slate-900 rounded-xl font-mono text-xs text-white items-center justify-between">
                  <span className="select-all break-all">{newKey}</span>
                  <button
                    onClick={() => copyToClipboard(newKey)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => { setShowKeyModal(false); setNewKey(null); }}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Listo, la he copiado
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey}>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Nombre descriptivo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Integración ERP, Web Headless, etc."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Entorno</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 flex-1 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="environment"
                          checked={newKeyEnv === 'live'}
                          onChange={() => setNewKeyEnv('live')}
                        />
                        <div>
                          <p className="text-sm font-semibold">Live (Producción)</p>
                          <p className="text-[10px] text-slate-500">Interactúa con datos reales del negocio.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 flex-1 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="environment"
                          checked={newKeyEnv === 'sandbox'}
                          onChange={() => setNewKeyEnv('sandbox')}
                        />
                        <div>
                          <p className="text-sm font-semibold">Sandbox (Pruebas)</p>
                          <p className="text-[10px] text-slate-500">Datos simulados para fase de desarrollo.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Permisos (Scopes)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      {SCOPES_LIST.map((scope) => (
                        <label key={scope.value} className="flex items-start gap-2.5 p-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={newKeyScopes.includes(scope.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyScopes([...newKeyScopes, scope.value]);
                              } else {
                                setNewKeyScopes(newKeyScopes.filter(s => s !== scope.value));
                              }
                            }}
                          />
                          <div>
                            <span className="text-xs font-mono font-bold text-slate-800">{scope.label}</span>
                            <p className="text-[10px] text-slate-500">{scope.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                  >
                    Crear Clave
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREAR WEBHOOK */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Agregar Webhook Endpoint</h3>
              <p className="text-sm text-slate-500 mt-1">Registra una URL HTTPS para empezar a escuchar eventos.</p>
            </div>

            <form onSubmit={handleCreateWebhook}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">URL del endpoint</label>
                  <input
                    type="url"
                    required
                    placeholder="https://tuapi.com/webhooks"
                    value={whUrl}
                    onChange={(e) => setWhUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Descripción (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Sincronización automática de inventario a ERP"
                    value={whDesc}
                    onChange={(e) => setWhDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Eventos a suscribir</label>
                  <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    {EVENTS_LIST.map((evt) => (
                      <label key={evt.value} className="flex items-center gap-2 cursor-pointer p-0.5">
                        <input
                          type="checkbox"
                          checked={whEvents.includes(evt.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWhEvents([...whEvents, evt.value]);
                            } else {
                              setWhEvents(whEvents.filter(ev => ev !== evt.value));
                            }
                          }}
                        />
                        <span className="text-xs font-mono text-slate-800">{evt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Registrar Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
