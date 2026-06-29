'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', address: '', notes: '' });
  const [viewProducts, setViewProducts] = useState<{ supplierId: string; supplierName: string } | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.get<Supplier[]>('/inventory/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSave = async () => {
    if (!form.name) { alert('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/inventory/suppliers/${editingId}`, form);
      } else {
        await api.post('/inventory/suppliers', form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', contact_name: '', email: '', phone: '', address: '', notes: '' });
      fetchSuppliers();
    } catch (err: any) {
      alert('Error al guardar: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await api.delete(`/inventory/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (supplier: Supplier) => {
    setForm({ name: supplier.name, contact_name: supplier.contact_name || '', email: supplier.email || '', phone: supplier.phone || '', address: supplier.address || '', notes: supplier.notes || '' });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const viewSupplierProducts = async (supplierId: string, supplierName: string) => {
    try {
      const data = await api.get<any[]>(`/inventory/supplier-products/${supplierId}`);
      setSupplierProducts(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setViewProducts({ supplierId, supplierName });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">← Inventario</Link>
          <h1 className="text-2xl font-bold">Proveedores</h1>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', contact_name: '', email: '', phone: '', address: '', notes: '' }); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          + Nuevo Proveedor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No hay proveedores registrados</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-100 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  {s.contact_name && <p className="text-sm text-slate-500">{s.contact_name}</p>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {s.email && <p>📧 {s.email}</p>}
                {s.phone && <p>📱 {s.phone}</p>}
                {s.address && <p>📍 {s.address}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => viewSupplierProducts(s.id, s.name)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Productos</button>
                <button onClick={() => startEdit(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editingId ? 'Editar' : 'Nuevo'} Proveedor</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contacto</label>
                <input type="text" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Teléfono</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Dirección</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Productos de {viewProducts.supplierName}</h2>
                <p className="text-sm text-slate-500">{supplierProducts.length} productos asignados</p>
              </div>
              <button onClick={() => setViewProducts(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Cerrar</button>
            </div>
            {supplierProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Este proveedor no tiene productos asignados</p>
            ) : (
              <div className="space-y-3">
                {supplierProducts.map((ps: any) => (
                  <div key={ps.id} className="flex items-center gap-3 rounded-lg border border-slate-50 p-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img src={ps.product?.images?.[0] || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{ps.product?.name}</p>
                      <p className="text-xs text-slate-500">SKU: {ps.product?.sku || '-'} · Stock: {ps.product?.stock}</p>
                    </div>
                    {ps.unit_cost && <span className="text-sm font-semibold">${ps.unit_cost.toLocaleString('es-CL')}</span>}
                    {ps.is_preferred && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Principal</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
