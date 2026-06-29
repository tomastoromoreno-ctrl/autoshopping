'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const BannerEditor = dynamic(() => import('@/components/BannerEditor/BannerEditor'), { ssr: false });

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  bg_color?: string;
  text_color?: string;
  sort_order: number;
  is_active: boolean;
}

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
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slot, setSlot] = useState<number>(1);
  const [existingBanners, setExistingBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    api.get<Banner[]>('/banners').then((banners) => {
      setExistingBanners(banners);
      setLoadingBanners(false);
    }).catch(() => setLoadingBanners(false));
  }, []);

  useEffect(() => {
    if (editId) {
      const found = existingBanners.find((b) => b.id === editId);
      if (found) setSlot(found.sort_order || 1);
    }
  }, [editId, existingBanners]);

  const occupiedSlots = existingBanners.map((b) => b.sort_order);
  const currentBanner = editId ? existingBanners.find((b) => b.id === editId) : null;

  const handleSave = async (dataUrl: string) => {
    setSaving(true);
    try {
      const blob = await compressImage(dataUrl, 1200, 0.8);
      const file = new File([blob], `banner-${slot}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bannerId', `slot-${slot}`);

      const uploadRes = await api.postFormData<{ url: string }>('/upload/banner', formData);

      if (currentBanner) {
        await api.patch(`/banners/${currentBanner.id}`, {
          image_url: uploadRes.url,
          sort_order: slot,
        });
      } else {
        await api.post('/banners', {
          title: `Banner ${slot}`,
          subtitle: '',
          image_url: uploadRes.url,
          bg_color: '#2563eb',
          text_color: '#ffffff',
          sort_order: slot,
          is_active: true,
        });
      }

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
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/banners" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
            ← Banners
          </Link>
          <h1 className="text-lg font-bold">Editor de Banner</h1>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-slate-500">Guardando...</span>}
          {saved && <span className="text-sm font-medium text-green-600">✓ Guardado</span>}
        </div>
      </div>

      {/* Slot selector */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-600">Slot del carrusel:</span>
          {[1, 2, 3, 4, 5].map((s) => {
            const isOccupied = occupiedSlots.includes(s) && !(editId && currentBanner?.sort_order === s);
            const isCurrent = editId ? currentBanner?.sort_order === s : slot === s;
            return (
              <button
                key={s}
                onClick={() => !isOccupied || isCurrent ? setSlot(s) : null}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                  isCurrent
                    ? 'bg-primary text-white'
                    : isOccupied
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            );
          })}
          <span className="text-xs text-slate-400">
            {existingBanners.length}/5 banners creados
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <BannerEditor
          onSave={handleSave}
          initialImageUrl={currentBanner?.image_url}
          initialBg={currentBanner?.bg_color || '#2563eb'}
        />
      </div>
    </div>
  );
}
