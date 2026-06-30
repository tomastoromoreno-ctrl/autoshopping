'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Package, LogOut, Loader2, Save, ChevronRight, ExternalLink, Shield } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { formatPrice } from '@/lib/format';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  tracking_number?: string;
  tracking_courier?: string;
  items_count?: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'En preparación', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Reembolsado', color: 'bg-slate-100 text-slate-700' },
};

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const subdomain = params.subdomain as string;
  const { customer, token, loading: authLoading, logout, updateProfile } = useCustomerAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  useEffect(() => {
    if (!authLoading && !customer) {
      router.push(`/store/${subdomain}/account/login`);
    }
  }, [customer, authLoading, router, subdomain]);

  useEffect(() => {
    if (customer) {
      setFormName(customer.name || '');
      setFormEmail(customer.email || '');
      setFormPhone(customer.phone || '');
    }
  }, [customer]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/customers/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || data || []);
      }
    } catch {}
    setOrdersLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateProfile({ name: formName, email: formEmail, phone: formPhone });
      setSuccessMsg('Perfil actualizado correctamente');
      setEditing(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push(`/store/${subdomain}`);
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Mi Cuenta</h1>

        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Perfil</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Editar
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition flex items-center gap-2 text-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormName(customer.name || '');
                      setFormEmail(customer.email || '');
                      setFormPhone(customer.phone || '');
                    }}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900">{customer.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{customer.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-slate-900" />
              <h2 className="text-lg font-semibold text-slate-900">Mis Pedidos</h2>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Aún no tienes pedidos</p>
                <Link
                  href={`/store/${subdomain}`}
                  className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Explorar tienda
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const status = STATUS_MAP[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700' };
                  return (
                    <Link
                      key={order.id}
                      href={`/store/${subdomain}/account/orders/${order.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-slate-900 text-sm">#{order.order_number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('es-CL')}
                          {order.items_count ? ` · ${order.items_count} productos` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 text-sm">{formatPrice(order.total)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href={`/store/${subdomain}/account/data`}
            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition flex items-center justify-center gap-2 text-sm"
          >
            <Shield className="w-4 h-4" />
            Mis Datos y Privacidad
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </motion.div>
    </div>
  );
}
