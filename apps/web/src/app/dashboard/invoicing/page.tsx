'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FileText, Download, Send } from 'lucide-react';

interface Invoice {
  id: string;
  order_id: string;
  type: 'boleta' | 'factura';
  sii_code: string;
  status: string;
  pdf_url?: string;
  xml_url?: string;
  created_at: string;
  total: number;
  customer_name: string;
  customer_rut?: string;
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/invoicing').then(setInvoices).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (orderId: string) => {
    setGenerating(orderId);
    try {
      await api.post<any>('/invoicing/generate', { order_id: orderId });
      api.get<any>('/invoicing').then(setInvoices);
    } catch {
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Facturación Electrónica SII</h1>
      <p className="mt-1 text-sm text-slate-500">Emisión de boletas y facturas electrónicas conforme al SII de Chile</p>

      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">Documentos emitidos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Código SII</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">RUT</th>
                <th className="pb-2 font-medium text-right">Monto</th>
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
                  <td className="py-2 font-mono text-xs text-slate-600">{inv.sii_code}</td>
                  <td className="py-2 text-slate-900">{inv.customer_name}</td>
                  <td className="py-2 text-slate-600">{inv.customer_rut || '—'}</td>
                  <td className="py-2 text-right font-medium text-slate-900">${inv.total.toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === 'accepted' ? 'bg-green-100 text-green-700' : inv.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status === 'accepted' ? 'Aceptado' : inv.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{new Date(inv.created_at).toLocaleDateString('es-CL')}</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.pdf_url && (
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition">
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No hay documentos emitidos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <FileText size={40} className="mx-auto text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">Para emitir documentos, selecciona una orden en la sección de Órdenes</p>
        <p className="mt-1 text-xs text-slate-400">Los documentos se generan automáticamente según el tipo de cliente (boleta o factura)</p>
      </div>
    </div>
  );
}
