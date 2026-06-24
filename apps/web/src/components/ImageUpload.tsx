'use client';

import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Upload, X, Image, Loader2 } from 'lucide-react';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, folder = 'uploads', label = 'Imagen', className = '' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5MB');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await api.postFormData<{ url: string; path: string }>('/upload/image', formData);
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo imagen');
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  }, [handleFile]);

  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>

      {/* Current image preview */}
      {value && (
        <div className="relative mb-2 group">
          <img src={value} alt="" className="h-32 w-full rounded-lg object-cover border" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition
          ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Image className="h-8 w-8 text-slate-300" />
        )}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            {uploading ? 'Subiendo...' : 'Arrastra una imagen, pega del portapapeles o haz clic'}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">JPG, PNG, WebP, GIF, SVG - Max 5MB</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {/* URL input as alternative */}
      <div className="mt-2">
        <input type="url" placeholder="O pega una URL de imagen"
          value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-primary" />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
