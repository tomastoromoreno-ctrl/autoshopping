'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Package, Download, Trash2, Loader2, ArrowLeft, Shield, Bell, BellOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function DataPage() {
  const router = useRouter();
  const params = useParams();
  const subdomain = params.subdomain as string;
  const { customer, token, loading: authLoading } = useCustomerAuth();

  const [marketingConsent, setMarketingConsent] = useState(false);
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !customer) {
      router.push(`/store/${subdomain}/account/login`);
    }
  }, [customer, authLoading, router, subdomain]);

  useEffect(() => {
    if (customer) {
      setMarketingConsent((customer as any).marketing_consent || false);
    }
  }, [customer]);

  async function handleMarketingToggle() {
    setSavingMarketing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/customers/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consent_type: 'marketing',
          granted: !marketingConsent,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar preferencias');
      setMarketingConsent(!marketingConsent);
      setSuccessMsg(!marketingConsent ? 'Suscripción a marketing activada' : 'Suscripción a marketing desactivada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar');
    } finally {
      setSavingMarketing(false);
    }
  }

  async function handleExportData() {
    setExportLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/customers/data-export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al exportar datos');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis-datos-${customer?.email || 'cliente'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Datos exportados correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al exportar datos');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteRequest() {
    setDeleteLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/customers/data-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Error al solicitar eliminación');
      setShowDeleteConfirm(false);
      setSuccessMsg('Solicitud de eliminación enviada. Sus datos serán eliminados en un plazo de 30 días. Los datos de transacciones se mantendrán por obligación tributaria.');
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar eliminación');
    } finally {
      setDeleteLoading(false);
    }
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href={`/store/${subdomain}/account`} className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver a Mi Cuenta
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Mis Datos</h1>
        <p className="text-sm text-slate-500 mb-8">Gestiona tus datos personales y preferencias de privacidad conforme a la Ley N° 19.628.</p>

        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Data */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Datos Personales</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Nombre</p>
                  <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Correo electrónico</p>
                  <p className="text-sm font-medium text-slate-900">{customer.email}</p>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Teléfono</p>
                    <p className="text-sm font-medium text-slate-900">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.default_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Dirección guardada</p>
                    <p className="text-sm font-medium text-slate-900">
                      {customer.default_address.address}, {customer.default_address.city}, {customer.default_address.state}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Puedes editar estos datos desde tu <Link href={`/store/${subdomain}/account`} className="text-blue-600 hover:underline">perfil</Link>.
            </p>
          </div>

          {/* Marketing Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Preferencias de Comunicación</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Controla si deseas recibir comunicaciones de marketing por correo electrónico sobre ofertas, nuevos productos y promociones.
            </p>
            <button
              onClick={handleMarketingToggle}
              disabled={savingMarketing}
              className={`flex items-center gap-3 w-full p-4 rounded-xl border transition-all duration-200 ${
                marketingConsent
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {savingMarketing ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : marketingConsent ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {marketingConsent ? 'Recibo comunicaciones de marketing' : 'No recibo comunicaciones de marketing'}
                </p>
                <p className="text-xs text-slate-500">
                  {marketingConsent ? 'Haz clic para desuscribirte' : 'Haz clic para suscribirte'}
                </p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${marketingConsent ? 'bg-green-500' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mt-1 transition-transform duration-200 ${marketingConsent ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </button>
          </div>

          {/* Export Data */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Download className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Exportar Mis Datos</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Descarga una copia de todos tus datos personales almacenados en nuestra plataforma, conforme a tu derecho de portabilidad.
            </p>
            <button
              onClick={handleExportData}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
            >
              {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exportLoading ? 'Exportando...' : 'Descargar Mis Datos'}
            </button>
          </div>

          {/* Delete Data */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-slate-900">Eliminar Mis Datos</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Solicita la eliminación de tus datos personales. Tus datos de identificación, contacto y dirección serán eliminados. El historial de transacciones se anonymizará por obligación tributaria (6 años).
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">¿Qué significa esto?</p>
                  <ul className="mt-1 list-disc list-inside text-amber-700 space-y-0.5">
                    <li>Se eliminarán: nombre, email, teléfono, direcciones</li>
                    <li>Se mantendrán: datos de pedidos (anonymizados) por obligación tributaria</li>
                    <li>Tu cuenta será desactivada permanentemente</li>
                  </ul>
                </div>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Solicitar Eliminación
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">¿Estás seguro? Esta acción es irreversible.</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteRequest}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleteLoading ? 'Procesando...' : 'Sí, eliminar mis datos'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Seguridad</h2>
            </div>
            <p className="text-sm text-slate-500">
              Tus datos están protegidos con cifrado TLS en tránsito y en reposo. Almacenamos los registros de consentimiento como evidencia de cumplimiento de la Ley N° 19.628. Para ejercer tus derechos de acceso, rectificación o eliminación, utiliza las opciones de esta página o contacta a privacidad@autoshopping.cl.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
