'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Shield, UserCog, Activity, FileText, AlertTriangle, Plus, Pencil, Trash2, Loader2, CheckCircle2, Database, Users, X, ExternalLink, Download, Save } from 'lucide-react';

export default function PrivacyDashboardPage() {
  const [tab, setTab] = useState<'dpo' | 'activities' | 'breaches' | 'processors'>('dpo');
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // DPO
  const [dpo, setDpo] = useState<any>(null);
  const [dpoForm, setDpoForm] = useState({ name: '', email: '', phone: '', is_external: false, company_name: '' });
  const [editingDpo, setEditingDpo] = useState(false);

  // Activities
  const [activities, setActivities] = useState<any[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ purpose: '', legal_basis: '', data_categories: '', retention_period: '', security_measures: '' });
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  // Breaches
  const [breaches, setBreaches] = useState<any[]>([]);
  const [showBreachForm, setShowBreachForm] = useState(false);
  const [breachForm, setBreachForm] = useState({ description: '', affected_data_categories: '', affected_count: 0, risk_assessment: '' });

  // Processors
  const [processors, setProcessors] = useState<any[]>([]);
  const [showProcessorForm, setShowProcessorForm] = useState(false);
  const [processorForm, setProcessorForm] = useState({ processor_name: '', processor_contact: '', processor_email: '', processing_description: '', data_categories: '', security_measures: '', contract_date: '', expires_at: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([
        loadDpo(),
        loadActivities(),
        loadBreaches(),
        loadProcessors(),
      ]);
    } catch {}
    setLoading(false);
  }

  async function loadDpo() {
    try { const d = await api.get<any>('/data-protection/dpo'); setDpo(d); } catch {}
  }

  async function loadActivities() {
    try { const a = await api.get<any[]>('/data-protection/activities'); setActivities(a || []); } catch {}
  }

  async function loadBreaches() {
    try { const b = await api.get<any[]>('/data-protection/breaches'); setBreaches(b || []); } catch {}
  }

  async function loadProcessors() {
    try { const p = await api.get<any[]>('/data-protection/processors'); setProcessors(p || []); } catch {}
  }

  async function handleSaveDpo(e: React.FormEvent) {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    try {
      await api.post('/data-protection/dpo', dpoForm);
      await loadDpo(); setEditingDpo(false);
      setSuccessMsg('DPO actualizado correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error al guardar DPO'); }
  }

  async function handleDeleteDpo() {
    if (!confirm('¿Eliminar el DPO registrado?')) return;
    try {
      await api.delete('/data-protection/dpo');
      setDpo(null); setEditingDpo(false);
      setSuccessMsg('DPO eliminado');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error'); }
  }

  async function handleSaveActivity(e: React.FormEvent) {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    const payload = {
      ...activityForm,
      data_categories: activityForm.data_categories.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      if (editingActivity) {
        await api.patch(`/data-protection/activities/${editingActivity}`, payload);
      } else {
        await api.post('/data-protection/activities', payload);
      }
      await loadActivities(); setShowActivityForm(false); setEditingActivity(null);
      setActivityForm({ purpose: '', legal_basis: '', data_categories: '', retention_period: '', security_measures: '' });
      setSuccessMsg('Actividad guardada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error'); }
  }

  function editActivity(a: any) {
    setActivityForm({
      purpose: a.purpose || '',
      legal_basis: a.legal_basis || '',
      data_categories: (a.data_categories || []).join(', '),
      retention_period: a.retention_period || '',
      security_measures: a.security_measures || '',
    });
    setEditingActivity(a.id);
    setShowActivityForm(true);
  }

  async function handleSaveBreach(e: React.FormEvent) {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    try {
      await api.post('/data-protection/breaches', {
        ...breachForm,
        affected_data_categories: breachForm.affected_data_categories.split(',').map(s => s.trim()).filter(Boolean),
      });
      await loadBreaches(); setShowBreachForm(false);
      setBreachForm({ description: '', affected_data_categories: '', affected_count: 0, risk_assessment: '' });
      setSuccessMsg('Brecha registrada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error'); }
  }

  async function handleNotifyApdp(id: string) {
    try {
      await api.patch(`/data-protection/breaches/${id}`, { notified_apdp: true, notified_apdp_at: new Date().toISOString() });
      await loadBreaches();
      setSuccessMsg('APDP notificada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error'); }
  }

  async function handleResolveBreach(id: string) {
    try {
      await api.patch(`/data-protection/breaches/${id}`, { status: 'resolved', resolved_at: new Date().toISOString() });
      await loadBreaches();
      setSuccessMsg('Brecha resuelta');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error'); }
  }

  async function handleSaveProcessor(e: React.FormEvent) {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    try {
      await api.post('/data-protection/processors', {
        ...processorForm,
        data_categories: processorForm.data_categories.split(',').map(s => s.trim()).filter(Boolean),
      });
      await loadProcessors(); setShowProcessorForm(false);
      setProcessorForm({ processor_name: '', processor_contact: '', processor_email: '', processing_description: '', data_categories: '', security_measures: '', contract_date: '', expires_at: '' });
      setSuccessMsg('Encargado registrado');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setErrorMsg(err.message || 'Error'); }
  }

  const tabs = [
    { id: 'dpo' as const, label: 'DPO', icon: UserCog },
    { id: 'activities' as const, label: 'Actividades', icon: Activity },
    { id: 'breaches' as const, label: 'Brechas', icon: AlertTriangle },
    { id: 'processors' as const, label: 'Encargados', icon: Database },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Protección de Datos</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">Cumplimiento Ley N° 21.719 — Gestión de DPO, actividades de tratamiento, brechas y encargados.</p>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorMsg}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* DPO Tab */}
            {tab === 'dpo' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Delegado de Protección de Datos (DPO)</h2>
                <p className="text-sm text-slate-500 mb-6">Designa un DPO interno o externo conforme al Art. 14 quáter de la Ley 21.719.</p>

                {dpo && !editingDpo ? (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><UserCog className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Nombre</p><p className="text-sm font-medium text-slate-900">{dpo.name}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><FileText className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-900">{dpo.email}</p></div></div>
                    {dpo.phone && <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><Users className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Teléfono</p><p className="text-sm font-medium text-slate-900">{dpo.phone}</p></div></div>}
                    {dpo.is_external && <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><ExternalLink className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Empresa externa</p><p className="text-sm font-medium text-slate-900">{dpo.company_name || '—'}</p></div></div>}
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setDpoForm({ name: dpo.name, email: dpo.email, phone: dpo.phone || '', is_external: dpo.is_external, company_name: dpo.company_name || '' }); setEditingDpo(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                        <Pencil className="w-4 h-4" /> Editar
                      </button>
                      <button onClick={handleDeleteDpo}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-xl text-sm font-medium hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveDpo} className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                        <input type="text" value={dpoForm.name} onChange={e => setDpoForm(p => ({...p, name: e.target.value}))} required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={dpoForm.email} onChange={e => setDpoForm(p => ({...p, email: e.target.value}))} required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                        <input type="text" value={dpoForm.phone} onChange={e => setDpoForm(p => ({...p, phone: e.target.value}))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="flex items-center gap-3 pt-6">
                        <input type="checkbox" id="is_external" checked={dpoForm.is_external} onChange={e => setDpoForm(p => ({...p, is_external: e.target.checked}))}
                          className="rounded border-slate-300 text-blue-600" />
                        <label htmlFor="is_external" className="text-sm text-slate-700">DPO externo</label>
                      </div>
                    </div>
                    {dpoForm.is_external && (
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la empresa</label>
                        <input type="text" value={dpoForm.company_name} onChange={e => setDpoForm(p => ({...p, company_name: e.target.value}))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    )}
                    <div className="flex gap-3">
                      <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                        <Save className="w-4 h-4" /> {dpo ? 'Actualizar DPO' : 'Registrar DPO'}
                      </button>
                      {editingDpo && (
                        <button type="button" onClick={() => setEditingDpo(false)}
                          className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {tab === 'activities' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Registro de Actividades de Tratamiento</h2>
                  <button onClick={() => { setShowActivityForm(true); setEditingActivity(null); setActivityForm({ purpose: '', legal_basis: '', data_categories: '', retention_period: '', security_measures: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                    <Plus className="w-4 h-4" /> Nueva Actividad
                  </button>
                </div>

                {showActivityForm && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">{editingActivity ? 'Editar' : 'Nueva'} Actividad de Tratamiento</h3>
                    <form onSubmit={handleSaveActivity} className="space-y-4">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Finalidad *</label>
                        <input type="text" value={activityForm.purpose} onChange={e => setActivityForm(p => ({...p, purpose: e.target.value}))} required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Base legal *</label>
                        <select value={activityForm.legal_basis} onChange={e => setActivityForm(p => ({...p, legal_basis: e.target.value}))} required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Seleccionar...</option>
                          <option value="consentimiento">Consentimiento del titular</option>
                          <option value="ejecucion_contractual">Ejecución de un contrato</option>
                          <option value="obligacion_legal">Obligación legal</option>
                          <option value="interes_legitimo">Interés legítimo del responsable</option>
                          <option value="interes_publico">Interés público</option>
                        </select></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Categorías de datos (separadas por coma)</label>
                        <input type="text" value={activityForm.data_categories} onChange={e => setActivityForm(p => ({...p, data_categories: e.target.value}))}
                          placeholder="nombre, email, teléfono, dirección"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Período de retención</label>
                          <input type="text" value={activityForm.retention_period} onChange={e => setActivityForm(p => ({...p, retention_period: e.target.value}))}
                            placeholder="5 años"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Medidas de seguridad</label>
                          <input type="text" value={activityForm.security_measures} onChange={e => setActivityForm(p => ({...p, security_measures: e.target.value}))}
                            placeholder="Cifrado TLS, acceso restringido"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                          <Save className="w-4 h-4" /> {editingActivity ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button type="button" onClick={() => setShowActivityForm(false)}
                          className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activities.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No hay actividades registradas</p>
                    <p className="text-xs text-slate-400 mt-1">Registra tus actividades de tratamiento para cumplir con el Art. 14 ter.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map(a => (
                      <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm">{a.purpose}</h3>
                            <p className="text-xs text-slate-500 mt-1">Base legal: <span className="font-medium text-slate-700">{a.legal_basis}</span></p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">Retención: {a.retention_period || '—'}</span>
                              {(a.data_categories || []).map((cat: string) => (
                                <span key={cat} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{cat}</span>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => editActivity(a)} className="p-2 text-slate-400 hover:text-blue-600 transition"><Pencil className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Breaches Tab */}
            {tab === 'breaches' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Notificación de Brechas de Datos</h2>
                  <button onClick={() => setShowBreachForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">
                    <Plus className="w-4 h-4" /> Registrar Brecha
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Art. 14 sexies — Las brechas deben notificarse a la APDP en un plazo máximo de 72 horas.</p>

                {showBreachForm && (
                  <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Nueva Brecha de Datos</h3>
                    <form onSubmit={handleSaveBreach} className="space-y-4">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
                        <textarea value={breachForm.description} onChange={e => setBreachForm(p => ({...p, description: e.target.value}))} required rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Categorías de datos afectados</label>
                        <input type="text" value={breachForm.affected_data_categories} onChange={e => setBreachForm(p => ({...p, affected_data_categories: e.target.value}))}
                          placeholder="nombre, email, teléfono"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">N° aproximado de afectados</label>
                          <input type="number" value={breachForm.affected_count || ''} onChange={e => setBreachForm(p => ({...p, affected_count: parseInt(e.target.value) || 0}))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Evaluación de riesgo</label>
                          <input type="text" value={breachForm.risk_assessment} onChange={e => setBreachForm(p => ({...p, risk_assessment: e.target.value}))}
                            placeholder="Alto / Medio / Bajo"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">
                          <Save className="w-4 h-4" /> Registrar
                        </button>
                        <button type="button" onClick={() => setShowBreachForm(false)}
                          className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {breaches.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No hay brechas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {breaches.map(b => (
                      <div key={b.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${b.status === 'open' ? 'border-red-200' : 'border-green-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {b.status === 'open' ? 'Abierta' : 'Resuelta'}
                              </span>
                              <span className="text-xs text-slate-400">{new Date(b.detected_at).toLocaleString('es-CL')}</span>
                            </div>
                            <p className="text-sm text-slate-900 font-medium">{b.description}</p>
                            {b.affected_count > 0 && <p className="text-xs text-slate-500 mt-1">{b.affected_count} afectados</p>}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className={`text-xs px-2 py-1 rounded-lg ${b.notified_apdp ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                APDP: {b.notified_apdp ? 'Notificada' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!b.notified_apdp && b.status === 'open' && (
                              <button onClick={() => handleNotifyApdp(b.id)}
                                className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium">
                                Notificar APDP
                              </button>
                            )}
                            {b.status === 'open' && (
                              <button onClick={() => handleResolveBreach(b.id)}
                                className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                                Resolver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Processors Tab */}
            {tab === 'processors' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Encargados de Tratamiento</h2>
                  <button onClick={() => setShowProcessorForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                    <Plus className="w-4 h-4" /> Nuevo Encargado
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Art. 8 — Los encargados deben tener un contrato que regule el tratamiento de datos.</p>

                {showProcessorForm && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Nuevo Contrato de Encargado</h3>
                    <form onSubmit={handleSaveProcessor} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre del encargado *</label>
                          <input type="text" value={processorForm.processor_name} onChange={e => setProcessorForm(p => ({...p, processor_name: e.target.value}))} required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input type="email" value={processorForm.processor_email} onChange={e => setProcessorForm(p => ({...p, processor_email: e.target.value}))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Descripción del tratamiento *</label>
                        <textarea value={processorForm.processing_description} onChange={e => setProcessorForm(p => ({...p, processing_description: e.target.value}))} required rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Categorías de datos</label>
                        <input type="text" value={processorForm.data_categories} onChange={e => setProcessorForm(p => ({...p, data_categories: e.target.value}))}
                          placeholder="nombre, email, dirección"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Medidas de seguridad</label>
                          <input type="text" value={processorForm.security_measures} onChange={e => setProcessorForm(p => ({...p, security_measures: e.target.value}))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Fecha del contrato</label>
                          <input type="date" value={processorForm.contract_date} onChange={e => setProcessorForm(p => ({...p, contract_date: e.target.value}))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                          <input type="date" value={processorForm.expires_at} onChange={e => setProcessorForm(p => ({...p, expires_at: e.target.value}))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                          <Save className="w-4 h-4" /> Guardar
                        </button>
                        <button type="button" onClick={() => setShowProcessorForm(false)}
                          className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {processors.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No hay encargados registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {processors.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm">{p.processor_name}</h3>
                            <p className="text-xs text-slate-500 mt-1">{p.processor_email && <>{p.processor_email} · </>}{p.processing_description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(p.data_categories || []).map((cat: string) => (
                                <span key={cat} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{cat}</span>
                              ))}
                              {p.contract_date && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">Desde {new Date(p.contract_date).toLocaleDateString('es-CL')}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
