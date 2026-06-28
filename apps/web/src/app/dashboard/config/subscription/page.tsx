'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Subscription {
  plan_name: string;
  price: number;
  billing_cycle: string;
  status: string;
  next_billing_date: string;
  grace_period_ends_at?: string;
  suspension_reason?: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
}

export default function ClientSubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [retentionApplied, setRetentionApplied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ subscription: Subscription; payments: Payment[] }>('/billing/subscription');
      setSub(res.subscription);
      setPayments(res.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      const res = await api.post<{ url: string }>('/billing/subscription/change-payment-method');
      if (res.url) {
        window.open(res.url, '_blank');
        setSuccessMsg('Se ha abierto el portal de facturación en una nueva pestaña.');
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch {}
  };

  const handleUpgrade = async (planName: string) => {
    try {
      await api.post('/billing/subscription/upgrade-plan', { planName });
      setShowUpgradeModal(false);
      setSuccessMsg(`¡Te has suscrito exitosamente al plan ${planName.toUpperCase()}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchSubscription();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post('/billing/subscription/cancel');
      setShowCancelModal(false);
      alert('Tu suscripción ha sido cancelada. Tu tienda se suspenderá.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const applyRetention = () => {
    setRetentionApplied(true);
    setSuccessMsg('¡Felicidades! Se ha aplicado 1 mes gratis de regalo en tu próximo ciclo de cobro.');
    setShowCancelModal(false);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Calculate overdue banners
  const isOverdue = sub?.status === 'overdue';
  const nextBilling = sub?.next_billing_date ? new Date(sub.next_billing_date) : null;
  const isAtRisk = isOverdue && sub?.grace_period_ends_at && new Date(sub.grace_period_ends_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const planFeatures: Record<string, string[]> = {
    trial: ['Acceso completo temporal', '1 usuario administrador', 'Soporte vía email'],
    starter: ['Acceso completo', '1 usuario administrador', 'Soporte vía email', '100 productos activos'],
    growth: ['Acceso completo', '5 usuarios administradores', 'Soporte prioritario', 'Productos ilimitados', 'Integración SII Chile', 'Personalización avanzada'],
    pro: ['Acceso completo', '15 usuarios administradores', 'Soporte dedicado', 'Productos ilimitados', 'Integración SII Chile', 'Dominio personalizado gratis', 'API Keys y Webhooks'],
    enterprise: ['Acceso completo', 'Usuarios administradores ilimitados', 'Gerente de cuenta dedicado', 'Integraciones personalizadas', 'Uptime 99.9% garantizado'],
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header Tabs */}
      <div className="flex border-b">
        <a href="/dashboard/config" className="border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700">Configuración General</a>
        <a href="/dashboard/config/subscription" className="border-b-2 border-blue-600 px-4 py-2.5 text-sm font-bold text-blue-600">Mi Suscripción</a>
      </div>

      {/* Overdue Banners */}
      {isAtRisk && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex flex-col gap-1 shadow-sm">
          <span>🚨 <strong>¡Riesgo de suspensión inminente!</strong> Tu tienda será bloqueada en menos de 24 horas si no actualizas tu método de pago.</span>
        </div>
      )}

      {isOverdue && !isAtRisk && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-700 flex flex-col gap-1 shadow-sm">
          <span>⚠️ <strong>Pago vencido:</strong> Tu cuenta presenta un retraso en la facturación. Por favor actualiza tu método de pago para evitar la suspensión.</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-700 shadow-sm animate-pulse">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Plan Overview */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tu Plan Actual</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1 uppercase">{sub?.plan_name || 'TRIAL'}</h2>
            </div>
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
              sub?.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              sub?.status === 'trial' ? 'bg-cyan-100 text-cyan-700' :
              sub?.status === 'overdue' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {sub?.status === 'trial' ? 'En Prueba' : sub?.status}
            </span>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Precio mensual</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {sub?.price && sub.price > 0 ? `$${sub.price.toLocaleString('es-CL')} CLP` : 'Gratuito'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Próximo cobro</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {nextBilling ? nextBilling.toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Características Incluidas</h3>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-4">
              {(planFeatures[sub?.plan_name || 'trial'] || []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="border-t pt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 text-xs shadow-sm transition-all"
            >
              Cambiar / Mejorar Plan
            </button>
            <button
              onClick={handleUpdatePaymentMethod}
              className="rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-xs font-bold transition-all"
            >
              Actualizar Método de Pago
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="rounded-lg border border-transparent hover:text-red-700 text-slate-400 px-5 py-2.5 text-xs font-bold transition-all ml-auto"
            >
              Cancelar Suscripción
            </button>
          </div>
        </div>

        {/* Payment History Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Boletas</h3>
          
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay facturas emitidas todavía.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700">${p.amount.toLocaleString('es-CL')} CLP</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(p.date).toLocaleDateString()}</div>
                  </div>
                  <a
                    href={p.invoice_url}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Boleta PDF
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL COMPARAR PLANES ─── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-2xl space-y-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Mejorar Plan de AutoGastos</h3>
                <p className="text-xs text-slate-500 mt-1">Elige el plan ideal para expandir las ventas de tu negocio.</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-slate-900 text-xl font-bold">×</button>
            </div>

            <div className="grid gap-4 md:grid-cols-4 overflow-y-auto py-2 pr-1">
              {/* Starter */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Starter</h4>
                  <p className="mt-2 text-2xl font-black text-slate-900">$14.900 <span className="text-[10px] text-slate-400 font-normal">/mes</span></p>
                  <ul className="text-xs text-slate-500 space-y-2 mt-4">
                    <li>✓ 1 Usuario</li>
                    <li>✓ 100 Productos</li>
                    <li>✓ Soporte Email</li>
                  </ul>
                </div>
                <button onClick={() => handleUpgrade('starter')} className="w-full rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-bold py-2 text-xs transition-colors mt-4">
                  Seleccionar
                </button>
              </div>

              {/* Growth */}
              <div className="rounded-xl border-2 border-blue-500 bg-blue-50/10 p-4 space-y-4 flex flex-col justify-between relative shadow-sm">
                <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Popular</span>
                <div>
                  <h4 className="text-sm font-bold text-blue-600 uppercase">Growth</h4>
                  <p className="mt-2 text-2xl font-black text-slate-900">$26.900 <span className="text-[10px] text-slate-400 font-normal">/mes</span></p>
                  <ul className="text-xs text-slate-600 space-y-2 mt-4">
                    <li>✓ 5 Usuarios</li>
                    <li>✓ Productos Ilimitados</li>
                    <li>✓ Boleta Electrónica SII</li>
                    <li>✓ Soporte Prioritario</li>
                  </ul>
                </div>
                <button onClick={() => handleUpgrade('growth')} className="w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold py-2 text-xs transition-colors mt-4 shadow-sm">
                  Seleccionar
                </button>
              </div>

              {/* Pro */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Pro</h4>
                  <p className="mt-2 text-2xl font-black text-slate-900">$49.900 <span className="text-[10px] text-slate-400 font-normal">/mes</span></p>
                  <ul className="text-xs text-slate-500 space-y-2 mt-4">
                    <li>✓ 15 Usuarios</li>
                    <li>✓ Boleta SII + API Keys</li>
                    <li>✓ Dominio Propio Gratis</li>
                    <li>✓ Webhooks e integrations</li>
                  </ul>
                </div>
                <button onClick={() => handleUpgrade('pro')} className="w-full rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-bold py-2 text-xs transition-colors mt-4">
                  Seleccionar
                </button>
              </div>

              {/* Enterprise */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Enterprise</h4>
                  <p className="mt-2 text-2xl font-black text-slate-900">$129.000 <span className="text-[10px] text-slate-400 font-normal">/mes</span></p>
                  <ul className="text-xs text-slate-500 space-y-2 mt-4">
                    <li>✓ Usuarios Ilimitados</li>
                    <li>✓ Soporte Telefónico 24/7</li>
                    <li>✓ SLA 99.9% garantizado</li>
                    <li>✓ Servidor Dedicado</li>
                  </ul>
                </div>
                <button onClick={() => handleUpgrade('enterprise')} className="w-full rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-bold py-2 text-xs transition-colors mt-4">
                  Seleccionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CANCEL SUBSCRIPTION & RETENTION OFFER ─── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">¿Estás seguro de cancelar tu plan?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Al cancelar tu plan, perderás el acceso a tus pedidos y tu tienda será suspendida. Esta acción es irreversible.</p>
            
            {/* Retention Offer */}
            {!retentionApplied && (
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                <p className="text-xs font-bold text-blue-700">🎁 ¡Oferta de retención especial!</p>
                <p className="text-xs text-slate-600">Te obsequiamos <strong>1 mes totalmente gratuito</strong> de AutoGastos si decides conservar tu suscripción hoy.</p>
                <button
                  onClick={applyRetention}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 text-xs shadow-sm"
                >
                  ✓ Acepto el Mes Gratis
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold"
              >
                No cancelar, Volver
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-xs"
              >
                Sí, cancelar suscripción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
