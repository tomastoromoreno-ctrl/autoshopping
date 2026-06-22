'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_at_price: '',
    stock: '',
    sku: '',
    category_id: '',
    images: '',
  });

  useEffect(() => {
    api.get<{ data: Category[] }>('/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const generateSlug = (name: string) => {
    setForm((prev) => ({ ...prev, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        stock: Number(form.stock),
        sku: form.sku || null,
        category_id: form.category_id || null,
        images: form.images ? form.images.split(',').map((s) => s.trim()) : [],
      });
      router.push('/dashboard/products');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Nuevo producto</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre</label>
            <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); generateSlug(e.target.value); }}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Precio</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Precio comparado</label>
            <input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Stock</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">SKU</label>
            <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Categoría</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">Seleccionar categoría</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">URLs de imágenes (separadas por coma)</label>
          <input type="text" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })}
            placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border px-6 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
