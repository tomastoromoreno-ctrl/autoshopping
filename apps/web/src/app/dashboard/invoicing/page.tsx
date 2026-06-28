'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FileText, Download, Settings, Upload, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';

interface Invoice {
  id: string;
  order_id: string;
  type: 'boleta' | 'factura' | 'recibo';
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
  customer_email: string;
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
  sii_invoicing_enabled: boolean;
}

interface Caf {
  id: string;
  dte_type: number;
  folio_start: number;
  folio_end: number;
  folio_current: number;
  is_active: boolean;
  created_at: string;
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [config, setConfig] = useState<InvoicingConfig | null>(null);
  const [cafs, setCafs] = useState<Caf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingCaf, setUploadingCaf] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>('/invoicing').then(setInvoices).catch(() => {}),
      api.get<InvoicingConfig>('/invoicing/config').then(setConfig).catch(() => {}),
      api.get<Caf[]>('/invoicing/cafs').then(setCafs).catch(() => {}),
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
        sii_invoicing_enabled: config.sii_invoicing_enabled,
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

  const handleUploadCertificate = async () => {
    if (!certFile) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un archivo de certificado (.p12 o .pfx)' });
      return;
    }
    setUploadingCert(true);
    setMessage(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        try {
          const res = await api.post<InvoicingConfig>('/invoicing/certificate', {
            certificate_base64: base64Content,
            filename: certFile.name,
            password: certPassword,
          });
          setConfig(res);
          setMessage({ type: 'success', text: 'Certificado digital cargado correctamente' });
          setCertFile(null);
          setCertPassword('');
        } catch (err: any) {
          setMessage({ type: 'error', text: err.message || 'Error al subir certificado' });
        } finally {
          setUploadingCert(false);
        }
      };
      reader.readAsDataURL(certFile);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setUploadingCert(false);
    }
  };

  const handleUploadCaf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCaf(true);
    setMessage(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const xmlContent = reader.result as string;
        try {
          await api.post('/invoicing/caf', { xml_content: xmlContent });
          const updatedCafs = await api.get<Caf[]>('/invoicing/cafs');
          setCafs(updatedCafs);
          setMessage({ type: 'success', text: `Folios autorizados (CAF) cargados correctamente para ${file.name}` });
        } catch (err: any) {
          setMessage({ type: 'error', text: err.message || 'Error al subir archivo CAF' });
        } finally {
          setUploadingCaf(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setUploadingCaf(false);
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

      {/* Master Toggle */}
      {config && (
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Emisión de Facturación Electrónica SII</h2>
              <p className="text-xs text-slate-500 mt-1">
                {config.sii_invoicing_enabled 
                  ? 'Activo: La plataforma emitirá boletas y facturas legales firmadas electrónicamente.' 
                  : 'Inactivo: Se emitirán recibos simples a los clientes en lugar de documentos legales.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={config.sii_invoicing_enabled}
                title="Habilitar Facturación Electrónica SII"
                onChange={async (e) => {
                  const val = e.target.checked;
                  setConfig({ ...config, sii_invoicing_enabled: val });
                  try {
                    const res = await api.patch<InvoicingConfig>('/invoicing/config', {
                      sii_invoicing_enabled: val,
                    });
                    setConfig(res);
                    setMessage({ type: 'success', text: `Facturación SII ${val ? 'habilitada' : 'deshabilitada'} correctamente.` });
                  } catch (err: any) {
                    setMessage({ type: 'error', text: err.message });
                  }
                }}
                className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Advanced Certificates and CAF Panel */}
      {config && config.sii_invoicing_enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Certificate Panel */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-1">Certificado Digital (.p12 / .pfx)</h3>
            <p className="text-xs text-slate-500 mb-4">Requerido para firmar los documentos tributarios (DTE) ante el SII.</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  config.certificate_uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {config.certificate_uploaded ? (
                    <>
                      <CheckCircle size={12} /> Certificado cargado
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={12} /> Sin certificado cargado
                    </>
                  )}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Seleccionar Archivo</label>
                <input type="file" accept=".p12,.pfx"
                  title="Subir archivo del certificado digital"
                  placeholder="Ningún archivo seleccionado"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña de la Firma</label>
                <input type="password" value={certPassword} placeholder="Contraseña de la firma"
                  onChange={(e) => setCertPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
              </div>

              <button onClick={handleUploadCertificate} disabled={uploadingCert || !certFile}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
                <Upload size={14} />
                {uploadingCert ? 'Cargando...' : 'Subir Certificado'}
              </button>
            </div>
          </div>

          {/* CAF Panel */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-1">Carga de CAF (Timbraje de Folios)</h3>
            <p className="text-xs text-slate-500 mb-4">Sube los archivos XML de folios autorizados obtenidos del SII.</p>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer relative">
                <input type="file" accept=".xml" onChange={handleUploadCaf} disabled={uploadingCaf}
                  title="Subir archivo XML CAF del SII"
                  placeholder="Ningún archivo seleccionado"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FileCode size={24} className="mx-auto text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-600 block">
                  {uploadingCaf ? 'Cargando CAF...' : 'Seleccionar XML CAF del SII'}
                </span>
                <span className="text-[10px] text-slate-400">Archivos .xml válidos</span>
              </div>

              <div className="max-h-[140px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-500 font-medium">
                      <th className="pb-1">DTE</th>
                      <th className="pb-1">Rango</th>
                      <th className="pb-1 text-center">Folio Act.</th>
                      <th className="pb-1 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cafs.map((caf) => (
                      <tr key={caf.id} className="border-b last:border-b-0 text-slate-600">
                        <td className="py-1.5 font-medium text-slate-800">
                          {caf.dte_type === 33 ? 'Factura (33)' : 'Boleta (39)'}
                        </td>
                        <td className="py-1.5">{caf.folio_start} - {caf.folio_end}</td>
                        <td className="py-1.5 text-center font-mono">{caf.folio_current}</td>
                        <td className="py-1.5 text-right">
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            caf.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {caf.is_active ? 'Activo' : 'Agotado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {cafs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          Sin archivos CAF autorizados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
            <p className="text-xs text-slate-400">Folio correlativo: <strong className="text-slate-600">{config.folio_current}</strong></p>
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      inv.type === 'factura' 
                        ? 'bg-blue-100 text-blue-700' 
                        : inv.type === 'recibo'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {inv.type === 'factura' ? 'Factura' : inv.type === 'recibo' ? 'Recibo' : 'Boleta'}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs text-slate-600">{inv.folio || inv.sii_code}</td>
                  <td className="py-2 text-slate-900">{inv.customer_name}</td>
                  <td className="py-2 text-slate-600">{inv.customer_rut || '—'}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">${inv.net_amount?.toLocaleString() || '—'}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">${inv.tax_amount?.toLocaleString() || '—'}</td>
                  <td className="py-2 text-right font-medium text-slate-900">${inv.total?.toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === 'accepted' || inv.status === 'completed' ? 'bg-green-100 text-green-700' : inv.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status === 'accepted' || inv.status === 'completed' ? 'Aceptado' : inv.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
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
                      {inv.type === 'recibo' && (
                        <button onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Recibo de Compra #${inv.folio}</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #333; }
                                    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                                    .details { margin: 20px 0; }
                                    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #888; }
                                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                    th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
                                    th { background-color: #f9f9f9; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h2>RECIBO DE COMPRA SIMPLE</h2>
                                    <p>Folio: #${inv.folio}</p>
                                    <p>Fecha: ${new Date(inv.created_at).toLocaleDateString('es-CL')}</p>
                                  </div>
                                  <div class="details">
                                    <p><strong>Cliente:</strong> ${inv.customer_name}</p>
                                    <p><strong>Email:</strong> ${inv.customer_email}</p>
                                  </div>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Detalle</th>
                                        <th style="text-align: right;">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>Monto Neto</td>
                                        <td style="text-align: right;">$${inv.net_amount?.toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td>IVA (19%)</td>
                                        <td style="text-align: right;">$${inv.tax_amount?.toLocaleString()}</td>
                                      </tr>
                                      <tr style="font-weight: bold; border-top: 2px solid #333;">
                                        <td>Total Pagado</td>
                                        <td style="text-align: right;">$${inv.total?.toLocaleString()}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <div class="footer">
                                    <p>Gracias por tu compra. Documento no válido como boleta o factura comercial legal.</p>
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }
                        }} title="Imprimir Recibo"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-purple-600 transition">
                          <FileText size={14} />
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
