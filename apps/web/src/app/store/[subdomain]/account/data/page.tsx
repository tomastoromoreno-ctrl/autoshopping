'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Package, Download, Trash2, Loader2, ArrowLeft, Shield, Bell, BellOff, AlertTriangle, CheckCircle2, Lock, Unlock, FileText, History, XCircle } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function DataPage() {
  const router = useRouter();
  const params = useParams();
  const subdomain = params.subdomain as string;
  const { customer, token, loading: authLoading } = useCustomerAuth();

  const [marketingConsent, setMarketingConsent] = useState(false);
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [portabilityLoading, setPortabilityLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [oppositionLoading, setOppositionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [subjectRequests, setSubjectRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  // Opposición
  const [oppositionMarketing, setOppositionMarketing] = useState(false);
  const [oppositionProfiling, setOppositionProfiling] = useState(false);

  useEffect(() => {
    if (!authLoading && !customer) {
      router.push(`/store/${subdomain}/account/login`);
    }
  }, [customer, authLoading, router, subdomain]);

  useEffect(() => {
    if (customer) {
      setMarketingConsent((customer as any).marketing_consent || false);
      setOppositionMarketing((customer as any).opposition_marketing || false);
      setOppositionProfiling((customer as any).opposition_profiling || false);
    }
  }, [customer]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  async function apiFetch(path: string, options?: RequestInit) {
    const res = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error de red' }));
      throw new Error(err.message || 'Error');
    }
    return res.json();
  }

  async function handleMarketingToggle() {
    setSavingMarketing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch('/customers/consent', {
        method: 'POST',
        body: JSON.stringify({ consent_type: 'marketing', granted: !marketingConsent }),
      });
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
      const data = await apiFetch('/customers/data-export');
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

  async function handlePortability() {
    setPortabilityLoading(true);
    setErrorMsg('');
    try {
      const data = await apiFetch('/customers/portability');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datos-portables-${customer?.email || 'cliente'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Datos exportados en formato portable');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al exportar');
    } finally {
      setPortabilityLoading(false);
    }
  }

  async function handleBlockData() {
    setBlockingLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const customerData = customer as any;
      if (customerData.data_blocked) {
        await apiFetch('/customers/unblock', { method: 'POST' });
        setSuccessMsg('Bloqueo de datos levantado');
      } else {
        await apiFetch('/customers/blocking', {
          method: 'POST',
          body: JSON.stringify({ reason: 'Solicitud del titular' }),
        });
        setSuccessMsg('Datos bloqueados. No serán procesados hasta nuevo aviso.');
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setBlockingLoading(false);
    }
  }

  async function handleOpposition() {
    setOppositionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch('/customers/opposition', {
        method: 'POST',
        body: JSON.stringify({
          marketing: !oppositionMarketing,
          profiling: oppositionProfiling,
        }),
      });
      setOppositionMarketing(!oppositionMarketing);
      setSuccessMsg(oppositionMarketing ? 'Oposición a marketing retirada' : 'Oposición a marketing registrada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setOppositionLoading(false);
    }
  }

  async function handleDeleteRequest() {
    setDeleteLoading(true);
    setErrorMsg('');
    try {
      await apiFetch('/customers/data-deletion', { method: 'POST' });
      setShowDeleteConfirm(false);
      setSuccessMsg('Solicitud de eliminación enviada. Sus datos serán eliminados en un plazo de 30 días.');
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar eliminación');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function loadSubjectRequests() {
    try {
      const data = await apiFetch('/customers/subject-requests');
      setSubjectRequests(data || []);
      setShowRequests(true);
    } catch {}
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
        <p className="text-sm text-slate-500 mb-8">Gestiona tus datos personales y derechos conforme a la Ley N° 21.719 de Protección de Datos Personales.</p>

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

          {/* Portabilidad (Ley 21.719) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Download className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Portabilidad de Datos</h2>
            </div>
            <p className="text-sm text-slate-500 mb-1">
              Derecho a recibir tus datos personales en un formato estructurado, de uso común y lectura mecánica (Art. 2 letra e, Ley 21.719).
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Este archivo incluye tus datos personales, historial de pedidos y registros de consentimiento en formato JSON portable.
            </p>
            <button onClick={handlePortability} disabled={portabilityLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200 disabled:opacity-50">
              {portabilityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {portabilityLoading ? 'Exportando...' : 'Descargar Datos Portables'}
            </button>
          </div>

          {/* Bloqueo de Datos (Ley 21.719) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              {(customer as any)?.data_blocked ? <Lock className="w-5 h-5 text-amber-600" /> : <Unlock className="w-5 h-5 text-slate-600" />}
              <h2 className="text-lg font-semibold text-slate-900">Bloqueo de Datos</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Derecho a solicitar el bloqueo temporal del tratamiento de tus datos personales (Art. 2 letra f, Ley 21.719). Mientras esté vigente, tus datos no serán procesados.
            </p>
            {(customer as any)?.data_blocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-amber-800">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Datos bloqueados desde {new Date((customer as any).data_blocked_at).toLocaleDateString('es-CL')}</p>
                    {(customer as any).data_blocked_reason && <p className="text-amber-700 mt-1">Motivo: {(customer as any).data_blocked_reason}</p>}
                  </div>
                </div>
              </div>
            )}
            <button onClick={handleBlockData} disabled={blockingLoading}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 ${
                (customer as any)?.data_blocked
                  ? 'border border-green-300 bg-white text-green-700 hover:bg-green-50'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}>
              {blockingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (customer as any)?.data_blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {blockingLoading ? 'Procesando...' : (customer as any)?.data_blocked ? 'Levantar Bloqueo' : 'Bloquear mis Datos'}
            </button>
          </div>

          {/* Oposición (Ley 21.719) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <XCircle className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Oposición al Tratamiento</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Derecho a oponerte al tratamiento de tus datos para fines específicos (Art. 2 letra d, Ley 21.719).
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input type="checkbox" checked={oppositionMarketing} onChange={() => {}} disabled
                  className="rounded border-slate-300 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Oposición a marketing</p>
                  <p className="text-xs text-slate-500">No deseo que mis datos sean utilizados para fines de marketing</p>
                </div>
                <button onClick={handleOpposition} disabled={oppositionLoading}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    oppositionMarketing ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}>
                  {oppositionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : oppositionMarketing ? 'Retirar' : 'Activar'}
                </button>
              </label>
            </div>
          </div>

          {/* Historial de Solicitudes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <History className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Historial de Solicitudes</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">Registro de todas las solicitudes de derechos ARCO-P-B que has ejercido.</p>
            {!showRequests ? (
              <button onClick={loadSubjectRequests}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">
                <History className="w-4 h-4" /> Ver historial
              </button>
            ) : subjectRequests.length === 0 ? (
              <p className="text-sm text-slate-400">No hay solicitudes registradas.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {subjectRequests.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <span className="text-xs font-medium text-slate-700 bg-slate-200 px-2 py-0.5 rounded">{r.request_type}</span>
                      <span className="text-xs text-slate-500 ml-2">{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {r.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security & DPO Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Seguridad y Contacto</h2>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Tus datos están protegidos con cifrado TLS en tránsito y en reposo. Para ejercer tus derechos bajo la Ley N° 21.719, utiliza las opciones de esta página o contacta a nuestro Delegado de Protección de Datos:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
              <p><strong>DPO:</strong> Delegado de Protección de Datos</p>
              <p><strong>Email:</strong> <a href="mailto:privacidad@autoshopping.cl" className="text-blue-600 hover:underline">privacidad@autoshopping.cl</a></p>
              <p className="mt-1 text-xs text-slate-500">Plazo de respuesta: máximo 30 días corridos (Art. 14, Ley 21.719).</p>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Si consideras que el tratamiento de tus datos no se ajusta a la normativa, puedes presentar una reclamación ante la Agencia de Protección de Datos Personales (APDP).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
