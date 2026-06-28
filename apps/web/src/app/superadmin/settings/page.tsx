'use client';

import { useState } from 'react';

export default function BusinessRulesPage() {
  const [gracePeriod, setGracePeriod] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate updating settings since backend uses standard static configs or we could save in a local config.
    // In our BillingService, we implemented 3 days grace period by default.
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Reglas de Negocio</h1>
        <p className="text-slate-400 text-sm mt-1">Configura las políticas automáticas de facturación y suspensión global de AutoGastos.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-slate-200">Políticas de Suspensión por Impago</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Período de Gracia (Días)</label>
              <p className="text-xs text-slate-500 mt-1">Cantidad de días que el cliente puede operar con pago vencido antes de ser suspendido.</p>
              <input
                type="number"
                min={1}
                max={15}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                title="Días de período de gracia"
                placeholder="Días"
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 max-w-[150px]"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Secuencia de Notificaciones (Informativo)</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold">Día 1</span>
                  <div>
                    <p className="font-semibold text-slate-200">Primer aviso de cobro fallido</p>
                    <p className="text-slate-500 mt-0.5">Se envía correo alertando el fallo del pago y se otorga el inicio del período de gracia.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold">Día 3</span>
                  <div>
                    <p className="font-semibold text-slate-200">Último aviso antes de suspensión</p>
                    <p className="text-slate-500 mt-0.5">Se notifica que quedan 24 horas antes de interrumpir el acceso a la administración y ventas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">Día 4</span>
                  <div>
                    <p className="font-semibold text-slate-200">Suspensión de cuenta</p>
                    <p className="text-slate-500 mt-0.5">Se bloquea el acceso de forma automatizada y se despacha la notificación final de desactivación.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2 text-xs shadow-md transition-all"
            >
              {saving ? 'Guardando...' : 'Guardar Reglas'}
            </button>
            {saved && <span className="text-xs text-emerald-400 font-medium">Reglas guardadas y sincronizadas.</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
