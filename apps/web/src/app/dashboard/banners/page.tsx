'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit, Eye, EyeOff, Image, Palette } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  btn_text?: string;
  bg_color?: string;
  text_color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const defaultForm = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  btn_text: 'Comprar ahora',
  bg_color: '#2563eb',
  text_color: '#ffffff',
  sort_order: 0,
  is_active: true,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get<Banner[]>('/banners')
      .then((res) => setBanners(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image_url: b.image_url || '',
      link_url: b.link_url || '',
      btn_text: b.btn_text || 'Comprar ahora',
      bg_color: b.bg_color || '#2563eb',
      text_color: b.text_color || '#ffffff',
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        image_url: form.image_url || undefined,
        link_url: form.link_url || undefined,
        btn_text: form.btn_text || undefined,
        bg_color: form.bg_color,
        text_color: form.text_color,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (editing) {
        await api.patch(`/banners/${editing.id}`, body);
      } else {
        await api.post('/banners', body);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error guardando');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error eliminando');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.post(`/banners/${id}/toggle`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error cambiando estado');
    }
  };

  const sortedBanners = [...banners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Banners</h1>
        <button onClick={openNew}
          className="rounded-lg bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-primary/90 w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus size={16} />
          Nuevo banner
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Image className="mt-0.5 h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">¿Qué son los banners?</p>
            <p className="mt-1 text-xs text-blue-700">
              Los banners aparecen como un carrusel en la página de inicio de tu tienda. Puedes usarlos para promocionar ofertas, nuevos productos o destacar categorías importantes.
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">{editing ? 'Editar' : 'Nuevo'} banner</h2>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Título *</label>
                    <input type="text" placeholder="Título del banner" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Subtítulo</label>
                    <input type="text" placeholder="Subtítulo (opcional)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <ImageUpload
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    folder="banners"
                    label="Imagen del banner"
                  />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">URL de enlace</label>
                    <input type="url" placeholder="https://..." value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Texto del botón</label>
                    <input type="text" placeholder="Comprar ahora" value={form.btn_text} onChange={(e) => setForm({ ...form, btn_text: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Color de fondo</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                          className="h-9 w-9 rounded-lg border cursor-pointer" />
                        <input type="text" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                          className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Color de texto</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                          className="h-9 w-9 rounded-lg border cursor-pointer" />
                        <input type="text" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                          className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Orden</label>
                      <input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                        <span className="text-sm text-slate-700">Activo</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Vista previa</label>
                  <div
                    className="relative overflow-hidden rounded-xl p-6 min-h-[160px] flex flex-col justify-center"
                    style={{ backgroundColor: form.bg_color, color: form.text_color }}
                  >
                    {form.image_url && (
                      <img src={form.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold">{form.title || 'Título del banner'}</h3>
                      {form.subtitle && <p className="mt-1 text-sm opacity-90">{form.subtitle}</p>}
                      {form.btn_text && (
                        <span className="mt-3 inline-block rounded-lg bg-white/20 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                          {form.btn_text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedBanners.map((banner) => (
          <div key={banner.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div
              className="relative h-32 flex items-center justify-center p-4"
              style={{ backgroundColor: banner.bg_color || '#2563eb', color: banner.text_color || '#ffffff' }}
            >
              {banner.image_url && (
                <img src={banner.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="relative z-10 text-center">
                <h3 className="font-bold text-sm">{banner.title}</h3>
                {banner.subtitle && <p className="text-xs opacity-90 mt-0.5">{banner.subtitle}</p>}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    #{banner.sort_order}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${banner.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {banner.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(banner.id)} title={banner.is_active ? 'Desactivar' : 'Activar'}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                    {banner.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(banner)} title="Editar"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(banner.id)} title="Eliminar"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-12 text-center">
            <Palette className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-500">No hay banners</p>
            <p className="mt-1 text-xs text-slate-400">Crea tu primer banner para mostrar en el carrusel de inicio</p>
            <button onClick={openNew}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Crear primer banner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
