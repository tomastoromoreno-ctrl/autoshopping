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
    has_buy_now: true,
    technical_specs: '',
    has_shipping_info: true,
    vertical_gallery: false,
    has_zoom: true,
  });

  useEffect(() => {
    api.get<Category[]>('/categories').then((res) => setCategories(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  const generateSlug = (name: string) => {
    setForm((prev) => ({ ...prev, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const specsObj: Record<string, string> = {};
      if (form.technical_specs) {
        form.technical_specs.split('\n').forEach((line) => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            if (key && val) {
              specsObj[key] = val;
            }
          }
        });
      }

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
        has_buy_now: form.has_buy_now,
        technical_specs: specsObj,
        has_shipping_info: form.has_shipping_info,
        vertical_gallery: form.vertical_gallery,
        has_zoom: form.has_zoom,
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
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre</label>
            <input id="name" type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); generateSlug(e.target.value); }}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required
              title="Nombre del producto" placeholder="Nombre del producto" />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug</label>
            <input id="slug" type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required
              title="Slug del producto" placeholder="slug-del-producto" />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción</label>
          <textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
            title="Descripción del producto" placeholder="Descripción del producto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700">Precio</label>
            <input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required
              title="Precio del producto" placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="compare_at_price" className="block text-sm font-medium text-slate-700">Precio comparado</label>
            <input id="compare_at_price" type="number" step="0.01" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              title="Precio comparado" placeholder="0.00" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-slate-700">Stock</label>
            <input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required
              title="Stock disponible" placeholder="0" />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU</label>
            <input id="sku" type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              title="SKU del producto" placeholder="SKU" />
          </div>
        </div>
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-slate-700">Categoría</label>
          <select id="category_id" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
            title="Categoría del producto">
            <option value="">Seleccionar categoría</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-slate-700">URLs de imágenes (separadas por coma)</label>
          <input id="images" type="text" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })}
            placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label htmlFor="technical_specs" className="block text-sm font-medium text-slate-700">Especificaciones Técnicas (Formato Llave: Valor, uno por línea)</label>
          <textarea id="technical_specs" rows={4} value={form.technical_specs} onChange={(e) => setForm({ ...form, technical_specs: e.target.value })}
            placeholder="Nivel de Juego: Profesional&#10;Tipo de Juego: Potencia&#10;Tacto: Duro&#10;Año: 2026"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.has_buy_now} onChange={(e) => setForm({ ...form, has_buy_now: e.target.checked })} className="rounded border-slate-300" />
            Habilitar botón "Comprar Ahora" (Express Checkout)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.has_shipping_info} onChange={(e) => setForm({ ...form, has_shipping_info: e.target.checked })} className="rounded border-slate-300" />
            Mostrar estimación de despacho dinámico
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.vertical_gallery} onChange={(e) => setForm({ ...form, vertical_gallery: e.target.checked })} className="rounded border-slate-300" />
            Usar galería vertical en escritorio (Desktop)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.has_zoom} onChange={(e) => setForm({ ...form, has_zoom: e.target.checked })} className="rounded border-slate-300" />
            Habilitar Zoom/Lightbox de imagen
          </label>
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
