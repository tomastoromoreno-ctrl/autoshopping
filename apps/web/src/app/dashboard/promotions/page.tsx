'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Promotion {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
}

interface Coupon {
  id: string;
  code: string;
  used_count: number;
  max_uses: number | null;
  is_active: boolean;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    name: '', discount_type: 'percentage', discount_value: '', min_purchase: '',
    starts_at: '', ends_at: '', usage_limit: '',
  });
  const [couponForm, setCouponForm] = useState({ code: '', max_uses: '' });
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/promotions').then((res) => setPromotions(res.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date().toISOString();
      await api.post('/promotions', {
        name: form.name,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_purchase: form.min_purchase ? Number(form.min_purchase) : undefined,
        starts_at: form.starts_at || now,
        ends_at: form.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
      });
      setShowForm(false);
      setForm({ name: '', discount_type: 'percentage', discount_value: '', min_purchase: '', starts_at: '', ends_at: '', usage_limit: '' });
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromo) return;
    try {
      await api.post('/coupons', {
        promotion_id: selectedPromo.id,
        code: couponForm.code,
        max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : undefined,
      });
      setShowCouponForm(false);
      setCouponForm({ code: '', max_uses: '' });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Promociones</h1>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-primary/90 w-full sm:w-auto">Nueva promoción</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">Nueva promoción</h2>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <input type="text" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
              <div className="flex gap-3">
                <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed">Monto fijo</option>
                </select>
                <input type="number" step="0.01" placeholder="Valor" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
              </div>
              <input type="number" step="0.01" placeholder="Compra mínima" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <div className="flex gap-3">
                <div className="w-full">
                  <label className="mb-1 block text-xs text-slate-500">Fecha inicio</label>
                  <input type="date" value={form.starts_at ? form.starts_at.split('T')[0] : ''} onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div className="w-full">
                  <label className="mb-1 block text-xs text-slate-500">Fecha fin</label>
                  <input type="date" value={form.ends_at ? form.ends_at.split('T')[0] : ''} onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : '' })}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <input type="number" placeholder="Límite de usos" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCouponForm && selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Agregar cupón a {selectedPromo.name}</h2>
            <form onSubmit={handleAddCoupon} className="mt-4 space-y-3">
              <input type="text" placeholder="Código del cupón" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
              <input type="number" placeholder="Límite de usos" value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Agregar</button>
                <button type="button" onClick={() => { setShowCouponForm(false); setSelectedPromo(null); }}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {promotions.map((promo) => {
          const now = new Date();
          const started = new Date(promo.starts_at) <= now;
          const ended = new Date(promo.ends_at) < now;
          const active = promo.is_active && started && !ended;
          return (
            <div key={promo.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{promo.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                    {promo.starts_at && ` · Desde ${new Date(promo.starts_at).toLocaleDateString()}`}
                    {promo.ends_at && ` · Hasta ${new Date(promo.ends_at).toLocaleDateString()}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Usos: {promo.usage_count}{promo.usage_limit ? ` / ${promo.usage_limit}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                  {active ? 'Activa' : ended ? 'Expirada' : 'Inactiva'}
                </span>
              </div>
              <button onClick={() => { setSelectedPromo(promo); setCouponForm({ code: '', max_uses: '' }); setShowCouponForm(true); }}
                className="mt-3 text-xs font-medium text-primary hover:underline">+ Agregar cupón</button>
            </div>
          );
        })}
        {promotions.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-400">No hay promociones</div>
        )}
      </div>
    </div>
  );
}
