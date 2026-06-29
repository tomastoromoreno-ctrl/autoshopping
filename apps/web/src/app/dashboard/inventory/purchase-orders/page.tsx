'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface PurchaseOrder {
  id: string;
  status: string;
  total: number;
  notes: string;
  expected_date: string;
  created_at: string;
  supplier: { name: string } | null;
  items: any[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  received: { label: 'Recibida', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ supplier_id: '', notes: '', expected_date: '', items: [{ product_id: '', quantity: 1, unit_cost: 0 }] });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get<{ data: PurchaseOrder[]; total: number }>(`/inventory/purchase-orders?${params}`);
      setOrders(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openCreate = async () => {
    try {
        const [s, p] = await Promise.all([
        api.get<any[]>('/inventory/suppliers'),
        api.get<any>('/products?limit=100'),
      ]);
      setSuppliers(Array.isArray(s) ? s : []);
      setProducts(Array.isArray(p) ? p : p.data || []);
    } catch (err) {
      console.error(err);
    }
    setShowCreate(true);
  };

  const handleCreate = async () => {
    const validItems = form.items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return;
    try {
      await api.post('/inventory/purchase-orders', {
        supplier_id: form.supplier_id || null,
        notes: form.notes || null,
        expected_date: form.expected_date || null,
        items: validItems,
      });
      setShowCreate(false);
      setForm({ supplier_id: '', notes: '', expected_date: '', items: [{ product_id: '', quantity: 1, unit_cost: 0 }] });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceive = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    try {
      const items = order.items.map((item: any) => ({
        product_id: item.product_id,
        received_quantity: item.quantity - (item.received_quantity || 0),
      }));
      await api.post(`/inventory/purchase-orders/${orderId}/receive`, { items });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.patch(`/inventory/purchase-orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, unit_cost: 0 }] });
  const removeItem = (index: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index: number, field: string, value: any) => {
    const items = [...form.items];
    (items[index] as any)[field] = value;
    setForm({ ...form, items });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">← Inventario</Link>
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
        </div>
        <button onClick={openCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          + Nueva Orden
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary">
          <option value="">Todos los estados</option>
          {Object.entries(statusLabels).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{total} órdenes</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No hay órdenes de compra</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = statusLabels[order.status] || statusLabels.draft;
            return (
              <div key={order.id} className="rounded-xl border border-slate-100 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">PO #{order.id.substring(0, 8)}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.supplier?.name || 'Sin proveedor'} · {new Date(order.created_at).toLocaleDateString('es-CL')}
                      {order.expected_date && ` · Esperado: ${new Date(order.expected_date).toLocaleDateString('es-CL')}`}
                    </p>
                  </div>
                  <span className="text-lg font-bold">{formatPrice(order.total)}</span>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mt-3 border-t border-slate-50 pt-3">
                    <p className="mb-2 text-xs font-medium text-slate-500">PRODUCTOS:</p>
                    <div className="space-y-1">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{item.product?.name || item.product_id} × {item.quantity}</span>
                          <span className="text-slate-500">{formatPrice(item.unit_cost)} c/u</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {order.status === 'draft' && (
                    <>
                      <button onClick={() => handleStatusChange(order.id, 'sent')} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600">Marcar Enviada</button>
                      <button onClick={() => handleStatusChange(order.id, 'cancelled')} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Cancelar</button>
                    </>
                  )}
                  {order.status === 'sent' && (
                    <button onClick={() => handleReceive(order.id)} className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">Recibir Mercadería</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nueva Orden de Compra</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Proveedor</label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fecha esperada</label>
                <input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Productos</label>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Producto...</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Cant." />
                      <input type="number" value={item.unit_cost} onChange={(e) => updateItem(i, 'unit_cost', parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Costo" />
                      {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2 text-sm text-primary hover:underline">+ Agregar producto</button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button>
                <button onClick={handleCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Crear Orden</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
