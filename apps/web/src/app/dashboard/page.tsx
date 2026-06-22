'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Copy, Check, Download, ExternalLink, Share2 } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [tenant, setTenant] = useState<{ subdomain: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats').then(setStats).catch(() => {});
    api.get<RecentOrder[]>('/orders?limit=5').then(setRecentOrders).catch(() => {});
    api.get<any>('/config/appearance')
      .then((res) => setTenant({ subdomain: res.subdomain, name: res.name }))
      .catch(() => {});
  }, []);

  const getStoreUrl = () => {
    if (!tenant?.subdomain) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.protocol}//${window.location.host}/store/${tenant.subdomain}`;
  };

  const handleCopyLink = () => {
    const url = getStoreUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    const url = getStoreUrl();
    if (!url || !tenant?.subdomain) return;
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qr_${tenant.subdomain}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error al descargar QR:', err);
    }
  };

  const statCards = [
    { label: 'Total productos', value: stats?.totalProducts ?? 0 },
    { label: 'Total órdenes', value: stats?.totalOrders ?? 0 },
    { label: 'Ingresos totales', value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}` },
    { label: 'Órdenes pendientes', value: stats?.pendingOrders ?? 0 },
  ];

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    confirmed: 'text-blue-600 bg-blue-50',
    processing: 'text-indigo-600 bg-indigo-50',
    shipped: 'text-purple-600 bg-purple-50',
    delivered: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-500">Bienvenido al panel de administración de tu tienda.</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
            <span className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black text-slate-955 tracking-tight">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Grilla Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Columna Izquierda: Órdenes Recientes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Órdenes recientes</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{order.customer_name}</td>
                    <td className="px-5 py-4 font-black text-slate-900">${order.total.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[order.status] || 'text-slate-600 bg-slate-50'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      No hay órdenes recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha: Compartir Tienda Widget */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Compartir tu Tienda</h2>
          {tenant ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-5">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enlace de tu e-commerce</h3>
                <p className="text-xs text-slate-500 mt-0.5">Comparte el acceso directo a tu catálogo público.</p>
              </div>

              {/* QR Code Container */}
              <div className="relative w-40 h-40 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-2 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getStoreUrl())}`}
                  alt="Código QR de la tienda"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Botones de acción QR */}
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Código QR
              </button>

              <hr className="w-full border-slate-100" />

              {/* Input de URL y Copiar */}
              <div className="w-full space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getStoreUrl()}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      copied
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <a
                  href={getStoreUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl border border-slate-200 hover:border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visitar Tienda Pública
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-400">
              Cargando datos de la tienda...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
