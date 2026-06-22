'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  order: number;
  active: boolean;
  children?: Category[];
}

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
  categories.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  });
  return roots;
}

function CategoryRow({ cat, depth }: { cat: Category; depth: number }) {
  return (
    <>
      <tr className="border-b hover:bg-slate-50">
        <td className="px-4 py-3" style={{ paddingLeft: `${12 + depth * 20}px` }}>
          <span className="font-medium text-slate-900">{cat.name}</span>
        </td>
        <td className="px-4 py-3 text-slate-500">{cat.slug}</td>
        <td className="px-4 py-3 text-slate-500">{cat.parent_id || '-'}</td>
        <td className="px-4 py-3">{cat.order}</td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{cat.active ? 'Sí' : 'No'}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-slate-400">-</span>
        </td>
      </tr>
      {cat.children?.map((child) => <CategoryRow key={child.id} cat={child} depth={depth + 1} />)}
    </>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [treeView, setTreeView] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', parent_id: '', order: '0', active: true });

  const load = () => {
    api.get<{ data: Category[] }>('/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: form.parent_id || null,
        order: Number(form.order),
        active: form.active,
      });
      setForm({ name: '', slug: '', parent_id: '', order: '0', active: true });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tree = treeView ? buildTree(categories) : [];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Categorías</h1>
      <div className="mt-4 sm:mt-6 grid gap-6 sm:gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Agregar categoría</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <input type="text" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
              <input type="text" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Sin padre (raíz)</option>
                {categories.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" placeholder="Orden" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
                Activa
              </label>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Agregar</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">{categories.length} categorías</p>
            <button onClick={() => setTreeView(!treeView)}
              className="rounded-lg border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">{treeView ? 'Vista plana' : 'Vista árbol'}</button>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Padre</th>
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Activa</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {treeView
                  ? tree.map((cat) => <CategoryRow key={cat.id} cat={cat} depth={0} />)
                  : categories.map((cat) => (
                      <tr key={cat.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                        <td className="px-4 py-3 text-slate-500">{cat.slug}</td>
                        <td className="px-4 py-3 text-slate-500">{cat.parent_id ? categories.find((c) => c.id === cat.parent_id)?.name || cat.parent_id : '-'}</td>
                        <td className="px-4 py-3">{cat.order}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{cat.active ? 'Sí' : 'No'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-400">-</span>
                        </td>
                      </tr>
                    ))}
                {categories.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay categorías</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
