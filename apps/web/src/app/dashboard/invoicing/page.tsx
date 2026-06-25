'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FileText, Download, Settings } from 'lucide-react';

interface Invoice {
  id: string;
  order_id: string;
  type: 'boleta' | 'factura';
  sii_code: string;
  folio: number;
  status: string;
  pdf_url?: string;
  xml_content?: string;
  created_at: string;
  total: number;
  net_amount: number;
  tax_amount: number;
  customer_name: string;
  customer_rut?: string;
  rut_emisor?: string;
  razon_social_emisor?: string;
}

interface InvoicingConfig {
  razon_social: string;
  rut_empresa: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  actividad_economica: string;
  sii_environment: string;
  certificate_uploaded: boolean;
  folio_start: number;
  folio_current: number;
  auto_generate_boleta: boolean;
  auto_generate_factura: boolean;
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [config, setConfig] = useState<InvoicingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<any>('/invoicing').then(setInvoices).catch(() => {}),
      api.get<InvoicingConfig>('/invoicing/config').then(setConfig).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    setMessage(null);
    try {
      const res = await api.patch<InvoicingConfig>('/invoicing/config', {
        razon_social: config.razon_social,
        rut_empresa: config.rut_empresa,
        giro: config.giro,
        direccion: config.direccion,
        comuna: config.comuna,
        ciudad: config.ciudad,
        actividad_economica: config.actividad_economica,
        sii_environment: config.sii_environment,
        folio_start: config.folio_start,
        auto_generate_boleta: config.auto_generate_boleta,
        auto_generate_factura: config.auto_generate_factura,
      });
      setConfig(res);
      setMessage({ type: 'success', text: 'Configuración de facturación guardada' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDownloadXml = (invoice: Invoice) => {
    if (!invoice.xml_content) return;
    const blob = new Blob([invoice.xml_content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DTE-${invoice.sii_code}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Facturación Electrónica SII</h1>
          <p className="mt-1 text-sm text-slate-500">Emisión de boletas y facturas electrónicas conforme al SII de Chile</p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
          <Settings size={16} />
          Configuración SII
        </button>
      </div>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* SII Config Panel */}
      {showConfig && config && (
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-1">Configuración del Contribuyente</h2>
          <p className="text-xs text-slate-500 mb-4">Datos necesarios para la emisión de documentos tributarios electrónicos (DTE)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
              <input type="text" value={config.razon_social || ''} placeholder="Mi Empresa SpA"
                onChange={(e) => setConfig({ ...config, razon_social: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RUT Empresa</label>
              <input type="text" value={config.rut_empresa || ''} placeholder="12.345.678-9"
                onChange={(e) => setConfig({ ...config, rut_empresa: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giro</label>
              <input type="text" value={config.giro || ''} placeholder="Venta al por menor"
                onChange={(e) => setConfig({ ...config, giro: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Económica</label>
              <input type="text" value={config.actividad_economica || ''} placeholder="Código CIIU"
                onChange={(e) => setConfig({ ...config, actividad_economica: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input type="text" value={config.direccion || ''} placeholder="Av. Ejemplo 123"
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comuna</label>
              <input type="text" value={config.comuna || ''} placeholder="Santiago"
                onChange={(e) => setConfig({ ...config, comuna: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
              <input type="text" value={config.ciudad || ''} placeholder="Santiago"
                onChange={(e) => setConfig({ ...config, ciudad: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ambiente SII</label>
              <select value={config.sii_environment} aria-label="Ambiente SII"
                onChange={(e) => setConfig({ ...config, sii_environment: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
                <option value="certification">Certificación (pruebas)</option>
                <option value="production">Producción</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.auto_generate_boleta}
                onChange={(e) => setConfig({ ...config, auto_generate_boleta: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300" />
              <span className="text-sm text-slate-700">Generar boletas automáticamente</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.auto_generate_factura}
                onChange={(e) => setConfig({ ...config, auto_generate_factura: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300" />
              <span className="text-sm text-slate-700">Generar facturas automáticamente</span>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">Folio actual: <strong className="text-slate-600">{config.folio_current}</strong></p>
            <button onClick={handleSaveConfig} disabled={savingConfig}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
              {savingConfig ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">Documentos emitidos</h2>
          {config && (
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
              config.sii_environment === 'production' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {config.sii_environment === 'production' ? '🟢 Producción' : '🟡 Certificación'}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Folio</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">RUT</th>
                <th className="pb-2 font-medium text-right">Neto</th>
                <th className="pb-2 font-medium text-right">IVA</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-b-0">
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.type === 'factura' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {inv.type === 'factura' ? 'Factura' : 'Boleta'}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs text-slate-600">{inv.folio || inv.sii_code}</td>
                  <td className="py-2 text-slate-900">{inv.customer_name}</td>
                  <td className="py-2 text-slate-600">{inv.customer_rut || '—'}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">${inv.net_amount?.toLocaleString() || '—'}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">${inv.tax_amount?.toLocaleString() || '—'}</td>
                  <td className="py-2 text-right font-medium text-slate-900">${inv.total?.toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === 'accepted' ? 'bg-green-100 text-green-700' : inv.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status === 'accepted' ? 'Aceptado' : inv.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{new Date(inv.created_at).toLocaleDateString('es-CL')}</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.xml_content && (
                        <button onClick={() => handleDownloadXml(inv)} title="Descargar XML DTE"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition">
                          <Download size={14} />
                        </button>
                      )}
                      {inv.pdf_url && (
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" title="Descargar PDF"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition">
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={10} className="py-10 text-center text-sm text-slate-400">No hay documentos emitidos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <FileText size={40} className="mx-auto text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">Para emitir documentos, selecciona una orden en la sección de Órdenes</p>
        <p className="mt-1 text-xs text-slate-400">Los documentos incluyen desglose de IVA (19%) y estructura XML DTE estándar del SII</p>
      </div>
    </div>
  );
}
