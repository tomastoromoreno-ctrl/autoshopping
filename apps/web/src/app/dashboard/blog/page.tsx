'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  status: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<BlogPost>>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<any>('/blog').then(setPosts).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async () => {
    if (!current.title || !current.content) return;
    setSaving(true);
    try {
      const payload = { ...current, slug: current.slug || generateSlug(current.title) };
      if (current.id) {
        await api.patch<any>(`/blog/${current.id}`, payload);
      } else {
        await api.post<any>('/blog', payload);
      }
      setEditing(false);
      setCurrent({});
      load();
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar publicación?')) return;
    await api.delete<any>(`/blog/${id}`);
    load();
  };

  const handlePublish = async (post: BlogPost) => {
    await api.patch<any>(`/blog/${post.id}`, { status: post.status === 'published' ? 'draft' : 'published' });
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Blog</h1>
        <button onClick={() => { setEditing(true); setCurrent({}); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
          <Plus size={16} /> Nuevo post
        </button>
      </div>

      {editing && (
        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{current.id ? 'Editar post' : 'Nuevo post'}</h2>
          <div className="mt-4 space-y-3">
            <input type="text" placeholder="Título" value={current.title || ''}
              onChange={(e) => setCurrent({ ...current, title: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            <input type="text" placeholder="Slug (auto-generado)" value={current.slug || ''}
              onChange={(e) => setCurrent({ ...current, slug: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            <input type="text" placeholder="Extracto" value={current.excerpt || ''}
              onChange={(e) => setCurrent({ ...current, excerpt: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            <input type="text" placeholder="URL imagen de portada" value={current.cover_image || ''}
              onChange={(e) => setCurrent({ ...current, cover_image: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            <textarea placeholder="Contenido (markdown)" value={current.content || ''}
              onChange={(e) => setCurrent({ ...current, content: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600 min-h-[200px] font-mono" />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditing(false); setCurrent({}); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate">{post.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {post.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">/{post.slug} · {new Date(post.created_at).toLocaleDateString('es-CL')}</p>
            </div>
            <div className="ml-4 flex items-center gap-1">
              <button onClick={() => handlePublish(post)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition" title={post.status === 'published' ? 'Despublicar' : 'Publicar'}>
                <Eye size={16} />
              </button>
              <button onClick={() => { setEditing(true); setCurrent(post); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(post.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No hay publicaciones. Crea tu primer post.</p>}
      </div>
    </div>
  );
}
