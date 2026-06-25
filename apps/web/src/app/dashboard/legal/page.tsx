'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface LegalDoc {
  type: string;
  title: string;
  document: {
    id: string;
    content: string;
    version: number;
    is_active: boolean;
    updated_at: string;
  } | null;
  versions: number;
  hasDocument: boolean;
}

const DOC_ICONS: Record<string, string> = {
  terms_conditions: '📄',
  privacy_policy: '🔒',
  refund_policy: '🔄',
  shipping_policy: '🚚',
  cookies_policy: '🍪',
};

export default function LegalPage() {
  const [documents, setDocuments] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; type: string; content: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = () => {
    api.get<LegalDoc[]>('/legal')
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async (type: string) => {
    setGenerating(type);
    setMessage(null);
    try {
      await api.post<any>('/legal/generate', { type });
      load();
      setMessage({ type: 'success', text: 'Documento generado exitosamente' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setGenerating(null);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.patch<any>(`/legal/${editing.id}`, { content: editing.content });
      setEditing(null);
      load();
      setMessage({ type: 'success', text: 'Documento guardado' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (docId: string, isActive: boolean) => {
    try {
      await api.patch<any>(`/legal/${docId}/toggle`, { is_active: isActive });
      load();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  // Editing mode
  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <button onClick={() => setEditing(null)} className="text-sm text-blue-600 hover:underline mb-2">← Volver</button>
            <h1 className="text-xl font-bold text-slate-900">Editar documento</h1>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <textarea
          value={editing.content}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          rows={30}
          className="mt-4 w-full rounded-xl border bg-white p-5 text-sm text-slate-800 font-mono leading-relaxed outline-none focus:border-blue-600 shadow-sm"
        />

        {/* Preview */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Vista previa</h2>
          <div className="prose prose-sm max-w-none text-slate-700">
            {editing.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-slate-900 mb-3">{line.slice(2)}</h1>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{line.slice(3)}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-slate-700 mt-3 mb-1">{line.slice(4)}</h3>;
              if (line.startsWith('- ')) return <li key={i} className="ml-4 text-slate-600">{line.slice(2)}</li>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-700">{line.slice(2, -2)}</p>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="text-slate-600 mb-1">{line}</p>;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Documentos Legales</h1>
      <p className="mt-1 text-sm text-slate-500">Genera y gestiona los documentos legales de tu tienda (términos, privacidad, devoluciones, etc.)</p>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">ℹ️ Templates automáticos</p>
        <p className="mt-1 text-blue-600">Los documentos se generan con datos de tu tienda y cumplen con la legislación chilena (Ley 19.496, Ley 19.628, SERNAC). Puedes personalizarlos después de generarlos.</p>
      </div>

      <div className="mt-6 grid gap-4">
        {documents.map((doc) => (
          <div key={doc.type} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{DOC_ICONS[doc.type] || '📄'}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {doc.hasDocument ? (
                      <>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Generado</span>
                        <span className="text-xs text-slate-400">v{doc.document?.version} · Actualizado {doc.document?.updated_at ? new Date(doc.document.updated_at).toLocaleDateString('es-CL') : ''}</span>
                      </>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">No generado</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc.hasDocument && doc.document && (
                  <>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doc.document.is_active}
                        onChange={(e) => handleToggle(doc.document!.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                    <button onClick={() => setEditing({ id: doc.document!.id, type: doc.type, content: doc.document!.content })}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                      Editar
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleGenerate(doc.type)}
                  disabled={generating === doc.type}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
                  {generating === doc.type ? 'Generando...' : doc.hasDocument ? 'Regenerar' : 'Generar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
