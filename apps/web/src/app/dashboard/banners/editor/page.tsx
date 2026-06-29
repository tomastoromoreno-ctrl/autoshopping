'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const BannerEditor = dynamic(() => import('@/components/BannerEditor/BannerEditor'), { ssr: false });

function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
    };
    img.src = dataUrl;
  });
}

export default function BannerEditorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (dataUrl: string) => {
    setSaving(true);
    try {
      const blob = await compressImage(dataUrl, 1200, 0.8);
      const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bannerId', 'main');

      const uploadRes = await api.postFormData<{ url: string }>('/upload/banner', formData);

      await api.post('/banners', {
        title: 'Banner personalizado',
        subtitle: '',
        image_url: uploadRes.url,
        bg_color: '#2563eb',
        text_color: '#ffffff',
        sort_order: 0,
        is_active: true,
      });

      setSaved(true);
      setTimeout(() => router.push('/dashboard/banners'), 1500);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el banner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/banners" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
            ← Banners
          </Link>
          <h1 className="text-lg font-bold">Editor de Banner</h1>
        </div>
        {saving && <span className="text-sm text-slate-500">Guardando...</span>}
        {saved && <span className="text-sm font-medium text-green-600">✓ Banner guardado</span>}
      </div>

      <div className="flex-1 overflow-hidden">
        <BannerEditor onSave={handleSave} />
      </div>
    </div>
  );
}
