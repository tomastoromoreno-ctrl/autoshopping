'use client';

import { useState, useEffect } from 'react';
import { Globe, DollarSign, Plus, Trash2, Edit3, Check, RefreshCw, Layers } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
];

const SUPPORTED_CURRENCIES = [
  { code: 'CLP', name: 'Peso Chileno' },
  { code: 'USD', name: 'Dólar Americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'BRL', name: 'Real Brasileño' },
];

export default function InternationalPage() {
  const [activeTab, setActiveTab] = useState<'languages' | 'currencies' | 'translations'>('languages');
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Language activation
  const [newLangCode, setNewLangCode] = useState('en');
  const [newLangDefault, setNewLangDefault] = useState(false);

  // Currency activation
  const [newCurrCode, setNewCurrCode] = useState('USD');
  const [newCurrDefault, setNewCurrDefault] = useState(false);
  const [newCurrRate, setNewCurrRate] = useState(0.0011);
  const [newCurrMode, setNewCurrMode] = useState<'auto' | 'manual'>('auto');
  const [newCurrRounding, setNewCurrRounding] = useState('nearest');

  // Translation Modal
  const [transLang, setTransLang] = useState('en');
  const [transName, setTransName] = useState('');
  const [transDesc, setTransDesc] = useState('');
  const [transSlug, setTransSlug] = useState('');
  const [showTransModal, setShowTransModal] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetchLanguages();
    fetchCurrencies();
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${apiUrl}/store/languages`, { headers: getHeaders() });
      if (res.ok) setLanguages(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${apiUrl}/store/currencies`, { headers: getHeaders() });
      if (res.ok) setCurrencies(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/products`, { headers: getHeaders() });
      if (res.ok) {
        const payload = await res.json();
        setProducts(payload.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/store/languages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code: newLangCode, is_default: newLangDefault }),
      });
      if (res.ok) {
        fetchLanguages();
        setNewLangDefault(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivateLanguage = async (code: string) => {
    try {
      const res = await fetch(`${apiUrl}/store/languages/${code}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) fetchLanguages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/store/currencies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          code: newCurrCode,
          is_default: newCurrDefault,
          exchange_rate: newCurrRate,
          rate_mode: newCurrMode,
          rounding_rule: newCurrRounding,
        }),
      });
      if (res.ok) {
        fetchCurrencies();
        setNewCurrDefault(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivateCurrency = async (code: string) => {
    try {
      const res = await fetch(`${apiUrl}/store/currencies/${code}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) fetchCurrencies();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateExchangeRates = async () => {
    try {
      alert('Actualizando tasas de cambio automáticamente...');
      const res = await fetch(`${apiUrl}/internal/currencies/update-rates`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        alert('Tasas actualizadas exitosamente');
        fetchCurrencies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Translation Modal actions
  const openTranslation = async (product: any) => {
    setSelectedProduct(product);
    setTransName('');
    setTransDesc('');
    setTransSlug('');
    setShowTransModal(true);
    
    // Fetch existing translation if any
    try {
      const res = await fetch(`${apiUrl}/products/${product.id}/translations`, { headers: getHeaders() });
      if (res.ok) {
        const trans = await res.json();
        const matched = trans.find((t: any) => t.language_code === transLang);
        if (matched) {
          setTransName(matched.name || '');
          setTransDesc(matched.description || '');
          setTransSlug(matched.slug || '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch(`${apiUrl}/products/${selectedProduct.id}/translations/${transLang}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: transName,
          description: transDesc,
          slug: transSlug || selectedProduct.slug,
        }),
      });
      if (res.ok) {
        setShowTransModal(false);
        alert('Traducción guardada');
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Multiidioma y Multimoneda</h1>
          <p className="mt-2 text-sm text-slate-500">
            Traduce tu catálogo de productos y ofrece visualización de precios en divisas internacionales para tus clientes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('languages')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'languages' ? 'border-b-2 border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Idiomas
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'currencies' ? 'border-b-2 border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Monedas
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'translations' ? 'border-b-2 border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Traducciones de Productos
          </button>
        </div>
      </div>

      {/* TAB 1: IDIOMAS */}
      {activeTab === 'languages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Activar Idioma</h3>
            <form onSubmit={handleActivateLanguage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Idioma</label>
                <select
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name} ({l.code.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newLangDefault}
                  onChange={(e) => setNewLangDefault(e.target.checked)}
                />
                <span className="text-xs font-semibold text-slate-700">Establecer como idioma principal</span>
              </label>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Activar Idioma
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Idiomas Activos</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Idioma</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Código</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {languages.map((lang) => (
                  <tr key={lang.language_code}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                      {SUPPORTED_LANGUAGES.find(l => l.code === lang.language_code)?.name || lang.language_code}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-600">{lang.language_code.toUpperCase()}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {lang.is_default ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <Check className="h-3 w-3" /> Principal
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Alternativo</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      {!lang.is_default && (
                        <button
                          onClick={() => handleDeactivateLanguage(lang.language_code)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONEDAS */}
      {activeTab === 'currencies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Activar Moneda</h3>
              <button
                onClick={handleUpdateExchangeRates}
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-semibold"
                title="Actualizar tasas de cambio de monedas vía API"
              >
                <RefreshCw className="h-3 w-3" /> Auto Sync
              </button>
            </div>
            <form onSubmit={handleActivateCurrency} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Moneda</label>
                <select
                  value={newCurrCode}
                  onChange={(e) => setNewCurrCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Tasa de Cambio (vs CLP principal)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={newCurrRate}
                  onChange={(e) => setNewCurrRate(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Modo de Tasa</label>
                <select
                  value={newCurrMode}
                  onChange={(e) => setNewCurrMode(e.target.value as 'auto' | 'manual')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="auto">Auto (API automática)</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCurrDefault}
                  onChange={(e) => setNewCurrDefault(e.target.checked)}
                />
                <span className="text-xs font-semibold text-slate-700">Establecer como moneda por defecto</span>
              </label>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Activar Moneda
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Monedas Habilitadas</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Moneda</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Tasa (vs CLP)</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Modo</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currencies.map((curr) => (
                  <tr key={curr.currency_code}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                      {SUPPORTED_CURRENCIES.find(c => c.code === curr.currency_code)?.name || curr.currency_code}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-600">{curr.exchange_rate}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-600">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        curr.rate_mode === 'auto' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {curr.rate_mode}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {curr.is_default ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <Check className="h-3 w-3" /> Principal
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Alternativa</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      {!curr.is_default && (
                        <button
                          onClick={() => handleDeactivateCurrency(curr.currency_code)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRADUCCIONES */}
      {activeTab === 'translations' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Administrador de Traducciones de Catálogo</h3>
          </div>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Producto</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Precio Base</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Stock</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                    No hay productos en catálogo.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">{prod.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">${prod.price.toLocaleString()} CLP</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{prod.stock || 0} unidades</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openTranslation(prod)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1.5 ml-auto"
                      >
                        <Globe className="h-3.5 w-3.5" /> Traducir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: FORMULARIO DE TRADUCCIÓN */}
      {showTransModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Traducir Producto</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">{selectedProduct.name}</p>
              </div>
              <select
                value={transLang}
                onChange={(e) => setTransLang(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white font-bold text-slate-700"
              >
                {languages.filter(l => !l.is_default).map((l) => (
                  <option key={l.language_code} value={l.language_code}>{l.language_code.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveTranslation}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Nombre Traducido</label>
                  <input
                    type="text"
                    required
                    value={transName}
                    onChange={(e) => setTransName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Descripción Traducida</label>
                  <textarea
                    rows={4}
                    value={transDesc}
                    onChange={(e) => setTransDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Slug amigable (traducción)</label>
                  <input
                    type="text"
                    required
                    placeholder={selectedProduct.slug}
                    value={transSlug}
                    onChange={(e) => setTransSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Guardar Traducción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
