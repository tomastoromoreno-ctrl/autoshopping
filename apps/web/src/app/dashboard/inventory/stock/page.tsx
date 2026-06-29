'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface StockItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  price: number;
  images: string[];
  category: { name: string } | null;
  product_suppliers: { id: string; supplier: { id: string; name: string }; unit_cost: number; is_preferred: boolean }[];
}

export default function StockListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [supplierModal, setSupplierModal] = useState<{ productId: string; productName: string } | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierCost, setSupplierCost] = useState('');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '20');

      const data = await api.get<{ data: StockItem[]; total: number }>(`/inventory/stock?${params}`);
      setItems(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const handleAdjustStock = async (productId: string, adjustment: number) => {
    try {
      await api.post('/inventory/movements', {
        product_id: productId,
        type: 'adjustment',
        quantity: adjustment,
        notes: `Ajuste manual desde dashboard`,
      });
      fetchStock();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (id: string, currentStock: number) => {
    setEditingId(id);
    setEditValue(String(currentStock));
  };

  const saveEdit = async (id: string) => {
    const newStock = parseInt(editValue);
    if (isNaN(newStock)) return;
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;
      const diff = newStock - item.stock;
      if (diff !== 0) {
        await api.post('/inventory/movements', {
          product_id: id,
          type: 'adjustment',
          quantity: diff,
          notes: `Ajuste directo a ${newStock} unidades`,
        });
        fetchStock();
      }
    } catch (err) {
      console.error(err);
    }
    setEditingId(null);
  };

  const openSupplierModal = async (productId: string, productName: string) => {
    try {
      const data = await api.get<any[]>('/inventory/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setSupplierModal({ productId, productName });
    setSelectedSupplierId('');
    setSupplierCost('');
  };

  const assignSupplier = async () => {
    if (!supplierModal || !selectedSupplierId) return;
    try {
      await api.post('/inventory/product-suppliers', {
        product_id: supplierModal.productId,
        supplier_id: selectedSupplierId,
        unit_cost: supplierCost ? parseFloat(supplierCost) : null,
      });
      setSupplierModal(null);
      fetchStock();
    } catch (err) { console.error(err); }
  };

  const removeSupplier = async (psId: string) => {
    try {
      await api.delete(`/inventory/product-suppliers/${psId}`);
      fetchStock();
    } catch (err) { console.error(err); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">← Inventario</Link>
          <h1 className="text-2xl font-bold">Stock de Productos</h1>
        </div>
        <span className="text-sm text-slate-500">{total} productos</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Todos</option>
          <option value="in_stock">En stock (&gt;5)</option>
          <option value="low_stock">Stock bajo (1-5)</option>
          <option value="out_of_stock">Sin stock (0)</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No se encontraron productos</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Producto</th>
                <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="px-4 py-3 font-medium text-slate-600">Categoría</th>
                <th className="px-4 py-3 font-medium text-slate-600">Proveedor</th>
                <th className="px-4 py-3 font-medium text-slate-600">Precio</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-center">Stock</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <img src={item.images?.[0] || '/placeholder.svg'} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.sku || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category?.name || '-'}</td>
                  <td className="px-4 py-3">
                    {item.product_suppliers && item.product_suppliers.length > 0 ? (
                      <div className="space-y-1">
                        {item.product_suppliers.slice(0, 2).map((ps: any) => (
                          <div key={ps.id} className="flex items-center gap-1">
                            <span className="text-xs font-medium">{ps.supplier?.name}</span>
                            {ps.is_preferred && <span className="text-[10px] text-primary">★</span>}
                            <button onClick={() => removeSupplier(ps.id)} className="ml-1 text-[10px] text-red-400 hover:text-red-600">✕</button>
                          </div>
                        ))}
                        {item.product_suppliers.length > 2 && <span className="text-[10px] text-slate-400">+{item.product_suppliers.length - 2} más</span>}
                      </div>
                    ) : (
                      <button onClick={() => openSupplierModal(item.id, item.name)} className="text-xs text-primary hover:underline">+ Asignar</button>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3 text-center">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(item.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                        className="w-20 rounded border border-primary px-2 py-1 text-center text-sm"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => startEdit(item.id, item.stock)}
                        className={`inline-block cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.stock <= 0 ? 'bg-red-100 text-red-700' :
                          item.stock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.stock} uds
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAdjustStock(item.id, -1)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Reducir 1"
                      >
                        −
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item.id, 1)}
                        className="rounded p-1 text-slate-400 hover:bg-green-50 hover:text-green-600"
                        title="Agregar 1"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
      {supplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold">Asignar Proveedor</h2>
            <p className="mb-4 text-sm text-slate-500">{supplierModal.productName}</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Proveedor</label>
                <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Costo unitario (opcional)</label>
                <input type="number" value={supplierCost} onChange={(e) => setSupplierCost(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Ej: 5000" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setSupplierModal(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button>
                <button onClick={assignSupplier} disabled={!selectedSupplierId} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Asignar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
