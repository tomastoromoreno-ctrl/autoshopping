'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface Movement {
  id: string;
  product: { name: string; sku: string; images: string[] };
  type: string;
  quantity: number;
  reference_id: string;
  reference_type: string;
  notes: string;
  created_at: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  purchase: { label: 'Compra', color: 'bg-green-100 text-green-700' },
  sale: { label: 'Venta', color: 'bg-blue-100 text-blue-700' },
  adjustment: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-700' },
  return: { label: 'Devolución', color: 'bg-purple-100 text-purple-700' },
  transfer: { label: 'Transferencia', color: 'bg-indigo-100 text-indigo-700' },
  damage: { label: 'Daño', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Vencido', color: 'bg-orange-100 text-orange-700' },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ product_id: '', type: 'adjustment', quantity: '', notes: '' });

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('page', String(page));
      const data = await api.get<{ data: Movement[]; total: number }>(`/inventory/movements?${params}`);
      setMovements(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const fetchProducts = async () => {
    try {
      const data = await api.get<any>('/products?limit=100');
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!form.product_id || !form.quantity) return;
    try {
      await api.post('/inventory/movements', {
        product_id: form.product_id,
        type: form.type,
        quantity: parseInt(form.quantity),
        notes: form.notes || null,
      });
      setShowCreate(false);
      setForm({ product_id: '', type: 'adjustment', quantity: '', notes: '' });
      fetchMovements();
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    fetchProducts();
    setShowCreate(true);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movimientos de Stock</h1>
        <button onClick={openCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          + Nuevo Movimiento
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(typeLabels).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{total} movimientos</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : movements.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No hay movimientos registrados</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Producto</th>
                <th className="px-4 py-3 font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-center">Cantidad</th>
                <th className="px-4 py-3 font-medium text-slate-600">Referencia</th>
                <th className="px-4 py-3 font-medium text-slate-600">Notas</th>
                <th className="px-4 py-3 font-medium text-slate-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const typeInfo = typeLabels[m.type] || { label: m.type, color: 'bg-slate-100 text-slate-700' };
                return (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                          <img src={m.product?.images?.[0] || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium">{m.product?.name || 'Producto'}</p>
                          <p className="text-xs text-slate-500">{m.product?.sku || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {m.reference_type ? `${m.reference_type}: ${m.reference_id?.substring(0, 8)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{m.notes || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(m.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50">Anterior</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50">Siguiente</button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nuevo Movimiento</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Producto</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {Object.entries(typeLabels).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Cantidad (positivo = entrada, negativo = salida)</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Ej: 10 o -5" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Opcional..." />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button>
                <button onClick={handleCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
