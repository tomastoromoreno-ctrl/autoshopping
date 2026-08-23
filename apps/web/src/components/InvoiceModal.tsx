'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download, FileText, CheckCircle2, Building2, FileCode, AlertCircle, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { formatRut } from '@/lib/rut';
import { api } from '@/lib/api';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    created_at: string;
    total: number;
    subtotal?: number;
    discount?: number;
    shipping_cost?: number;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    document_type?: 'boleta' | 'factura' | string;
    customer_rut?: string;
    razon_social?: string;
    giro?: string;
    direccion_tributaria?: string;
    comuna_tributaria?: string;
    items?: Array<{
      product_id?: string;
      name?: string;
      product_name?: string;
      variant_name?: string;
      quantity: number;
      price?: number;
      unit_price?: number;
      total_price?: number;
    }>;
  };
  invoiceConfig?: {
    razon_social?: string;
    rut_empresa?: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    sii_invoicing_enabled?: boolean;
  } | null;
  invoiceData?: {
    id?: string;
    folio?: number;
    sii_code?: string;
    type?: string;
    status?: string;
    xml_content?: string;
    created_at?: string;
  } | null;
  onInvoiceEmitted?: () => void;
}

export function InvoiceModal({ isOpen, onClose, order, invoiceConfig, invoiceData, onInvoiceEmitted }: InvoiceModalProps) {
  const [emitting, setEmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  const isFactura = order.document_type === 'factura' || !!order.customer_rut || invoiceData?.type === 'factura';
  const docTitle = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA';
  const dteCode = isFactura ? '33' : '39';

  const rutEmisor = invoiceConfig?.rut_empresa ? formatRut(invoiceConfig.rut_empresa) : '76.543.210-K';
  const razonEmisor = invoiceConfig?.razon_social || 'MI TIENDA ECOMMERCE SPA';
  const giroEmisor = invoiceConfig?.giro || 'VENTA POR MENOR DE PRODUCTOS Y SERVICIOS';
  const direccionEmisor = `${invoiceConfig?.direccion || 'Av. Providencia 1234, Of. 500'}, ${invoiceConfig?.comuna || 'Providencia'}, ${invoiceConfig?.ciudad || 'Santiago'}`;

  const folio = invoiceData?.folio || 1001;
  const isEmitted = invoiceData?.status === 'accepted' || invoiceData?.status === 'completed' || !!invoiceData?.folio;

  // Tax calculations (19% IVA Chilean Tax)
  const totalAmount = order.total || 0;
  const netAmount = Math.round(totalAmount / 1.19);
  const taxAmount = totalAmount - netAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    if (!invoiceData?.xml_content) return;
    const blob = new Blob([invoiceData.xml_content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DTE-${invoiceData.sii_code || dteCode + '-' + folio}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmitInvoice = async () => {
    setEmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/invoicing/generate/${order.id}`);
      setSuccessMsg('Documento tributario emitido correctamente ante el SII.');
      if (onInvoiceEmitted) onInvoiceEmitted();
    } catch (err: any) {
      setError(err.message || 'Error al emitir documento tributario.');
    } finally {
      setEmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[90vh]"
      >
        {/* Modal Toolbar / Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-red-400" />
            <span className="font-bold text-base tracking-wide">
              Documento Tributario Electrónico (DTE Chile)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar (Print / Download / Emit) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isEmitted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isEmitted ? `Emitido en SII (Folio #${folio})` : 'Documento Pendiente / Borrador'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isEmitted && (
              <button
                type="button"
                onClick={handleEmitInvoice}
                disabled={emitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${emitting ? 'animate-spin' : ''}`} />
                {emitting ? 'Emitiendo...' : 'Emitir DTE SII'}
              </button>
            )}

            {invoiceData?.xml_content && (
              <button
                type="button"
                onClick={handleDownloadXml}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <FileCode className="h-3.5 w-3.5 text-blue-600" />
                Descargar XML
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-6 py-2 border-b border-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 text-xs px-6 py-2 border-b border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Official Chilean DTE Printable Sheet */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          {/* Header Layout: Store Info (Left) + Red Box DTE SII (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pb-6 border-b border-slate-300">
            {/* Emisor Info (Left) */}
            <div className="sm:col-span-7 space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-red-600" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {razonEmisor}
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase">{giroEmisor}</p>
              <p className="text-xs text-slate-600">{direccionEmisor}</p>
              <p className="text-xs text-slate-500">Casa Matriz - Venta Electrónica</p>
            </div>

            {/* Official SII Red Box (Right) */}
            <div className="sm:col-span-5 flex justify-end">
              <div className="w-full max-w-[260px] border-4 border-red-600 p-3 text-center rounded-sm bg-white flex flex-col justify-center space-y-1">
                <p className="text-base font-black text-red-600 font-mono tracking-wider">
                  R.U.T.: {rutEmisor}
                </p>
                <p className="text-sm font-black uppercase text-red-600 tracking-wide border-y-2 border-red-600 py-1 my-1">
                  {docTitle}
                </p>
                <p className="text-base font-black text-red-600 font-mono">
                  N° {folio}
                </p>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest pt-1">
                  S.I.I. - SANTIAGO CENTRO
                </p>
              </div>
            </div>
          </div>

          {/* Document Date & Customer / Receptor Details */}
          <div className="mt-6 rounded-lg border border-slate-300 bg-slate-50/50 p-4 text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 font-medium">FECHA EMISIÓN:</p>
                <p className="font-bold text-slate-900">
                  {new Date(order.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <p className="text-slate-500 font-medium">FORMA DE PAGO:</p>
                <p className="font-bold text-slate-900">VENTA CONTADO ELECTRÓNICA</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 font-medium">SEÑOR(ES) / RAZÓN SOCIAL:</p>
                <p className="font-bold text-slate-900 uppercase">
                  {isFactura && order.razon_social ? order.razon_social : order.customer_name}
                </p>
              </div>

              <div>
                <p className="text-slate-500 font-medium">R.U.T. RECEPTOR:</p>
                <p className="font-bold text-slate-900 font-mono">
                  {order.customer_rut ? formatRut(order.customer_rut) : '66.666.666-6 (CLIENTE FINAL)'}
                </p>
              </div>

              {isFactura && (
                <>
                  <div>
                    <p className="text-slate-500 font-medium">GIRO COMERCIAL:</p>
                    <p className="font-bold text-slate-900 uppercase">{order.giro || 'NO ESPECIFICADO'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">DIRECCIÓN TRIBUTARIA:</p>
                    <p className="font-bold text-slate-900 uppercase">
                      {order.direccion_tributaria || 'NO ESPECIFICADA'} {order.comuna_tributaria ? `, ${order.comuna_tributaria}` : ''}
                    </p>
                  </div>
                </>
              )}

              <div>
                <p className="text-slate-500 font-medium">CONTACTO / EMAIL:</p>
                <p className="font-medium text-slate-800">{order.customer_email}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold uppercase">
                  <th className="py-2.5 px-3">Ítem / Producto</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const name = item.product_name || item.name || 'Producto';
                    const qty = item.quantity || 1;
                    const unitPrc = item.unit_price || item.price || 0;
                    const totPrc = item.total_price || unitPrc * qty;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900">{name}</p>
                          {item.variant_name && (
                            <p className="text-[11px] text-slate-500">{item.variant_name}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold">{qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${formatPrice(unitPrc)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                          ${formatPrice(totPrc)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500 italic">
                      Detalle de productos de la orden #{order.id.slice(0, 8)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Taxes Breakdown */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* Timbre Electrónico SII (PDF417 barcode visualization) */}
            <div className="w-full sm:w-1/2 border border-slate-300 rounded-lg p-3 bg-slate-50 text-center">
              <div className="flex flex-col items-center justify-center py-2 space-y-1">
                {/* Visual Representation of PDF417 Timbre */}
                <div className="w-full max-w-[240px] h-14 bg-slate-900 p-1.5 rounded flex items-center justify-center gap-0.5 opacity-90">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white h-full"
                      style={{
                        width: `${(i % 3) + 1}px`,
                        opacity: i % 5 === 0 ? 0.4 : 1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest pt-1">
                  Timbre Electrónico SII
                </span>
                <span className="text-[8px] text-slate-500">
                  Res. N° 80 de 2014 - Verifique documento en www.sii.cl
                </span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="w-full sm:w-1/2 border border-slate-300 rounded-lg overflow-hidden text-xs">
              <div className="flex justify-between py-2 px-4 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Monto Neto (Afecto):</span>
                <span className="font-mono font-semibold text-slate-900">${formatPrice(netAmount)}</span>
              </div>
              <div className="flex justify-between py-2 px-4 border-b border-slate-200">
                <span className="text-slate-600 font-medium">IVA (19%):</span>
                <span className="font-mono font-semibold text-slate-900">${formatPrice(taxAmount)}</span>
              </div>
              {order.shipping_cost ? (
                <div className="flex justify-between py-2 px-4 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Costo de Envío:</span>
                  <span className="font-mono font-semibold text-slate-900">${formatPrice(order.shipping_cost)}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-2.5 px-4 bg-slate-900 text-white font-bold text-sm">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono">${formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <p>Documento emitido electrónicamente en conformidad con la normativa del Servicio de Impuestos Internos de Chile.</p>
            <p className="mt-0.5">AutoShopping Platform - Folio ID: {folio}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
