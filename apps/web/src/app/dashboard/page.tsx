'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Copy, Check, Download, ExternalLink, Share2, TrendingUp, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import QRCode from '@/components/QRCode';

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

// Animated counter
function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = end;
    };
    animate();
  }, [value]);

  return <span>{prefix}{display.toLocaleString('es-CL')}</span>;
}

import { createClient } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [tenant, setTenant] = useState<{ subdomain: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let tenantId = user?.user_metadata?.tenant_id;
        if (!tenantId && user) {
          const { data: profile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle();
          tenantId = profile?.tenant_id;
        }

        if (tenantId) {
          // Fetch tenant info
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('subdomain, name')
            .eq('id', tenantId)
            .maybeSingle();

          if (tenantData) {
            setTenant({ subdomain: tenantData.subdomain, name: tenantData.name });
          }

          // Fetch products count
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          // Fetch orders
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, customer_name, total, status, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

          const allOrders = ordersData || [];
          const totalOrders = allOrders.length;
          const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
          const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

          setStats({
            totalProducts: productCount || 0,
            totalOrders,
            totalRevenue,
            pendingOrders,
          });

          setRecentOrders(allOrders.slice(0, 5));
          return;
        }
      } catch (err) {
        console.error('Supabase direct load error:', err);
      }

      // API fallback
      api.get<DashboardStats>('/dashboard/stats').then(setStats).catch(() => {});
      api.get<RecentOrder[]>('/orders?limit=5').then(setRecentOrders).catch(() => {});
      api.get<any>('/config/appearance')
        .then((res) => setTenant({ subdomain: res.subdomain, name: res.name }))
        .catch(() => {});
    }

    loadDashboardData();
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
    try {
      const svgEl = document.querySelector('#store-qr svg') as SVGSVGElement;
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 500);
        ctx.drawImage(img, 0, 0, 500, 500);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `qr_${tenant.subdomain}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        });
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('Error al descargar QR:', err);
    }
  };

  const statCards = [
    { label: 'Total productos', value: stats?.totalProducts ?? 0, icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
    { label: 'Total órdenes', value: stats?.totalOrders ?? 0, icon: TrendingUp, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Ingresos totales', value: stats?.totalRevenue ?? 0, prefix: '$', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Órdenes pendientes', value: stats?.pendingOrders ?? 0, icon: Clock, color: 'from-amber-500 to-orange-500', change: stats?.pendingOrders ? `${stats.pendingOrders}` : '0', up: false },
  ];

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
    processing: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    shipped: 'text-purple-700 bg-purple-50 border-purple-200',
    delivered: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    cancelled: 'text-red-700 bg-red-50 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-500">Bienvenido al panel de administración de tu tienda.</p>
      </motion.div>

      {/* Animated Stat Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between cursor-default group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  <AnimatedNumber value={card.value} prefix={card.prefix} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grilla Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Columna Izquierda: Órdenes Recientes */}
        <div className="lg:col-span-2 space-y-4">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-bold text-slate-900 tracking-tight"
          >
            Órdenes recientes
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
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
                <AnimatePresence>
                  {recentOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{order.customer_name}</td>
                      <td className="px-5 py-4 font-black text-slate-900">${order.total.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[order.status] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      No hay órdenes recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Columna Derecha: Compartir Tienda Widget */}
        <div className="space-y-4">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-bold text-slate-900 tracking-tight"
          >
            Compartir tu Tienda
          </motion.h2>
          {tenant ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-5"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
              >
                <Share2 className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enlace de tu e-commerce</h3>
                <p className="text-xs text-slate-500 mt-0.5">Comparte el acceso directo a tu catálogo público.</p>
              </div>

              {/* QR Code Container */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                id="store-qr"
                className="relative w-40 h-40 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-2 shadow-inner"
              >
                <QRCode value={getStoreUrl()} size={128} />
              </motion.div>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Código QR
              </button>

              <hr className="w-full border-slate-100" />

              <div className="w-full space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getStoreUrl()}
                    aria-label="URL de la tienda"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 outline-none select-all"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCopyLink}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
                      copied
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </motion.button>
                </div>

                <motion.a
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  href={getStoreUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl border border-slate-200 hover:border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 transition-all duration-200 flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visitar Tienda Pública
                </motion.a>
              </div>
            </motion.div>
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
