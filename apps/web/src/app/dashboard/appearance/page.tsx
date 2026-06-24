'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Upload, Move, ZoomIn, Sparkles, Palette, Type, Layout, CreditCard, Instagram, Facebook, MessageCircle, Twitter, Music } from 'lucide-react';

const colorPresets = [
  { name: 'Nike Sport', bg: '#ffffff', btn: '#111111', btnText: '#ffffff', text: '#111111', primary: '#111111' },
  { name: 'Adidas Classic', bg: '#ffffff', btn: '#000000', btnText: '#ffffff', text: '#000000', primary: '#000000' },
  { name: 'Ocean Blue', bg: '#f8fafc', btn: '#0ea5e9', btnText: '#ffffff', text: '#0f172a', primary: '#0ea5e9' },
  { name: 'Forest Green', bg: '#f0fdf4', btn: '#16a34a', btnText: '#ffffff', text: '#14532d', primary: '#16a34a' },
  { name: 'Sunset Orange', bg: '#fff7ed', btn: '#ea580c', btnText: '#ffffff', text: '#431407', primary: '#ea580c' },
  { name: 'Royal Purple', bg: '#faf5ff', btn: '#9333ea', btnText: '#ffffff', text: '#3b0764', primary: '#9333ea' },
  { name: 'Rose Pink', bg: '#fff1f2', btn: '#e11d48', btnText: '#ffffff', text: '#4c0519', primary: '#e11d48' },
  { name: 'Midnight Dark', bg: '#0f172a', btn: '#3b82f6', btnText: '#ffffff', text: '#e2e8f0', primary: '#3b82f6' },
  { name: 'Minimalist', bg: '#ffffff', btn: '#1e293b', btnText: '#ffffff', text: '#334155', primary: '#1e293b' },
  { name: 'Warm Earth', bg: '#fefce8', btn: '#a16207', btnText: '#ffffff', text: '#422006', primary: '#a16207' },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter', sample: 'La mejor tienda online' },
  { value: 'Montserrat', label: 'Montserrat', sample: 'La mejor tienda online' },
  { value: 'Outfit', label: 'Outfit', sample: 'La mejor tienda online' },
  { value: 'Poppins', label: 'Poppins', sample: 'La mejor tienda online' },
  { value: 'Playfair Display', label: 'Playfair Display', sample: 'La mejor tienda online' },
];

export default function AppearancePage() {
  const [form, setForm] = useState({
    name: '',
    slogan: '',
    logo_url: '',
    font_family: 'Inter',
    primary_color: '#3b82f6',
    bg_color: '#ffffff',
    btn_color: '#3b82f6',
    btn_text_color: '#ffffff',
    text_color: '#1e293b',
    header_style: 'classic',
    footer_style: 'minimal',
    card_style: 'standard',
    social_instagram: '',
    social_facebook: '',
    social_whatsapp: '',
    social_twitter: '',
    social_tiktok: '',
    color_preset: '',
  });
  const [loading, setLoading] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [originalLogo, setOriginalLogo] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<any>('/config/appearance').then((res) => {
      setForm({
        name: res.name || '',
        slogan: res.slogan || '',
        logo_url: res.logo_url || '',
        font_family: res.font_family || 'Inter',
        primary_color: res.primary_color || '#3b82f6',
        bg_color: res.bg_color || '#ffffff',
        btn_color: res.btn_color || '#3b82f6',
        btn_text_color: res.btn_text_color || '#ffffff',
        text_color: res.text_color || '#1e293b',
        header_style: res.header_style || 'classic',
        footer_style: res.footer_style || 'minimal',
        card_style: res.card_style || 'standard',
        social_instagram: res.social_instagram || '',
        social_facebook: res.social_facebook || '',
        social_whatsapp: res.social_whatsapp || '',
        social_twitter: res.social_twitter || '',
        social_tiktok: res.social_tiktok || '',
        color_preset: res.color_preset || '',
      });
      if (res.logo_url) {
        setOriginalLogo(res.logo_url);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 200);

      const minScale = Math.max(200 / img.width, 200 / img.height);
      const scale = minScale * zoom;
      const w = img.width * scale;
      const h = img.height * scale;

      const x = (200 - w) / 2 + offsetX;
      const y = (200 - h) / 2 + offsetY;

      ctx.drawImage(img, x, y, w, h);
      const base64 = canvas.toDataURL('image/png');
      setForm((prev) => ({ ...prev, logo_url: base64 }));
    };
  }, [imageSrc, zoom, offsetX, offsetY]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const applyPreset = (preset: typeof colorPresets[number]) => {
    setForm((prev) => ({
      ...prev,
      color_preset: preset.name,
      bg_color: preset.bg,
      btn_color: preset.btn,
      btn_text_color: preset.btnText,
      text_color: preset.text,
      primary_color: preset.primary,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/config/appearance', form);
      setOriginalLogo(form.logo_url);
      setImageSrc(null);
      alert('Cambios guardados con éxito');
    } catch (err: any) {
      alert(err.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Apariencia</h1>
          <p className="text-xs sm:text-sm text-slate-500">Personaliza la identidad visual y marca de tu tienda online.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. Color Presets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Palette className="w-5 h-5" />}
            title="Paletas de Color"
            desc="Selecciona un preset visual para aplicar colores instantáneamente."
            color="bg-violet-50 text-violet-600"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`relative rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  form.color_preset === preset.name
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{ backgroundColor: preset.bg }}
              >
                <div className="flex gap-1.5 mb-2 justify-center">
                  <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.bg }} />
                  <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.btn }} />
                  <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.text }} />
                  <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.primary }} />
                </div>
                <span className="text-[10px] font-bold text-center block" style={{ color: preset.text }}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Font Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Type className="w-5 h-5" />}
            title="Tipografía"
            desc="Selecciona la fuente que mejor represente tu marca."
            color="bg-sky-50 text-sky-600"
          />
          <div className="space-y-2">
            {fontOptions.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, font_family: font.value }))}
                className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                  form.font_family === font.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-bold text-slate-700">{font.label}</span>
                <span className="text-sm text-slate-600" style={{ fontFamily: `${font.value}, sans-serif` }}>
                  {font.sample}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Logo Upload */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Upload className="w-5 h-5" />}
            title="Logo de la Tienda"
            desc="Sube el logo de tu marca y ajústalo con zoom y posición."
            color="bg-emerald-50 text-emerald-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                aria-label="Subir logo"
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/20 transition-all"
              >
                <Upload className="w-4 h-4" />
                Subir desde Computadora o Móvil
              </button>

              {imageSrc && (
                <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajustes de Encuadre</span>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> Zoom</span>
                      <span>{zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      aria-label="Zoom"
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" /> Eje Horizontal (X)</span>
                      <span>{offsetX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="1"
                      value={offsetX}
                      onChange={(e) => setOffsetX(parseInt(e.target.value))}
                      aria-label="Eje Horizontal (X)"
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5 rotate-90" /> Eje Vertical (Y)</span>
                      <span>{offsetY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="1"
                      value={offsetY}
                      onChange={(e) => setOffsetY(parseInt(e.target.value))}
                      aria-label="Eje Vertical (Y)"
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Encuadre Resultante</span>
              <div className="relative w-40 h-40 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-inner">
                {imageSrc ? (
                  <div className="w-full h-full relative">
                    <img
                      src={imageSrc}
                      alt="Logo preview"
                      style={{
                        transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                        transformOrigin: 'center',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                      className="absolute inset-0 transition-transform duration-75"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500/30 pointer-events-none rounded-2xl" />
                  </div>
                ) : originalLogo ? (
                  <img src={originalLogo} alt="Logo actual" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-slate-300 text-3xl font-bold">AS</div>
                )}
              </div>
              {imageSrc && (
                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(null);
                    setForm((prev) => ({ ...prev, logo_url: originalLogo }));
                  }}
                  className="mt-3 text-xs text-red-500 font-semibold hover:underline"
                >
                  Cancelar cambios de imagen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Store Identity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title="Identidad de la Tienda"
            desc="Define el nombre y slogan que se mostrarán en el navegador."
            color="bg-amber-50 text-amber-600"
          />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre de la Tienda</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: SportShop"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Slogan</label>
              <input
                type="text"
                value={form.slogan}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                placeholder="Ej: La mejor tienda de calzado deportivo"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Vista previa en navegador</span>
              <div className="flex items-center gap-2 rounded-t-lg bg-slate-200/60 border-t border-x border-slate-300/80 px-3 sm:px-4 py-2 max-w-full sm:max-w-sm truncate text-xs text-slate-700 shadow-sm font-sans select-none">
                <span className="text-[11px] shrink-0">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="w-3.5 h-3.5 object-cover rounded" />
                  ) : (
                    '🛍️'
                  )}
                </span>
                <span className="font-medium truncate">
                  {form.name || 'Mi Tienda'} {form.slogan ? `| ${form.slogan}` : ''}
                </span>
                <span className="text-[8px] text-slate-400 ml-auto pl-2">✕</span>
              </div>
              <div className="h-4 bg-slate-200/30 border-t border-slate-300/50 rounded-b-lg flex items-center px-4">
                <div className="w-16 h-2 rounded bg-slate-300/60" />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Color Pickers (manual override) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Palette className="w-5 h-5" />}
            title="Personalización de Colores"
            desc="Ajusta manualmente los colores de tu tienda."
            color="bg-pink-50 text-pink-600"
          />
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'bg_color', label: 'Fondo' },
              { key: 'btn_color', label: 'Botones' },
              { key: 'btn_text_color', label: 'Texto en Botones' },
              { key: 'text_color', label: 'Texto Principal' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <input
                    type="color"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="h-8 w-8 cursor-pointer rounded-lg border-0"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700">{(form as any)[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Header Style */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Layout className="w-5 h-5" />}
            title="Estilo del Header"
            desc="Selecciona el diseño de la barra de navegación superior."
            color="bg-indigo-50 text-indigo-600"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                value: 'classic',
                label: 'Clásico',
                desc: 'Logo izquierda, nav centro, carrito derecha',
                wireframe: (
                  <div className="flex items-center justify-between w-full h-12 px-2">
                    <div className="w-6 h-4 bg-slate-800 rounded" />
                    <div className="flex gap-1">
                      <div className="w-5 h-1.5 bg-slate-400 rounded" />
                      <div className="w-5 h-1.5 bg-slate-400 rounded" />
                      <div className="w-5 h-1.5 bg-slate-400 rounded" />
                    </div>
                    <div className="w-4 h-4 bg-slate-600 rounded" />
                  </div>
                ),
              },
              {
                value: 'centered',
                label: 'Centrado',
                desc: 'Logo centro, navegación abajo',
                wireframe: (
                  <div className="flex flex-col items-center gap-1.5 w-full h-12 px-2 pt-1">
                    <div className="w-8 h-4 bg-slate-800 rounded" />
                    <div className="flex gap-1">
                      <div className="w-4 h-1 bg-slate-400 rounded" />
                      <div className="w-4 h-1 bg-slate-400 rounded" />
                      <div className="w-4 h-1 bg-slate-400 rounded" />
                      <div className="w-4 h-1 bg-slate-400 rounded" />
                    </div>
                  </div>
                ),
              },
              {
                value: 'minimal',
                label: 'Mínimo',
                desc: 'Logo izquierda, menú hamburguesa derecha',
                wireframe: (
                  <div className="flex items-center justify-between w-full h-12 px-2">
                    <div className="w-6 h-4 bg-slate-800 rounded" />
                    <div className="flex flex-col gap-0.5">
                      <div className="w-4 h-0.5 bg-slate-600 rounded" />
                      <div className="w-4 h-0.5 bg-slate-600 rounded" />
                      <div className="w-4 h-0.5 bg-slate-600 rounded" />
                    </div>
                  </div>
                ),
              },
            ].map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, header_style: style.value }))}
                className={`rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  form.header_style === style.value
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="rounded-lg bg-slate-100 border border-slate-200 overflow-hidden mb-2">
                  {style.wireframe}
                </div>
                <div className="text-sm font-bold text-slate-800">{style.label}</div>
                <div className="text-[10px] text-slate-500">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 7. Footer Style */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Layout className="w-5 h-5 rotate-180" />}
            title="Estilo del Footer"
            desc="Selecciona el diseño del pie de página."
            color="bg-teal-50 text-teal-600"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                value: 'minimal',
                label: 'Mínimo',
                desc: 'Nombre centrado, links, copyright',
                wireframe: (
                  <div className="flex flex-col items-center gap-1.5 w-full h-12 px-2 pt-1">
                    <div className="w-10 h-2 bg-slate-700 rounded" />
                    <div className="flex gap-1">
                      <div className="w-3 h-1 bg-slate-400 rounded" />
                      <div className="w-3 h-1 bg-slate-400 rounded" />
                      <div className="w-3 h-1 bg-slate-400 rounded" />
                    </div>
                    <div className="w-6 h-0.5 bg-slate-300 rounded" />
                  </div>
                ),
              },
              {
                value: 'columns',
                label: 'Columnas',
                desc: '3 columnas: Info, Links, Social',
                wireframe: (
                  <div className="flex gap-1.5 w-full h-12 px-2 pt-1">
                    <div className="flex-1 space-y-1">
                      <div className="w-4 h-1 bg-slate-600 rounded" />
                      <div className="w-full h-0.5 bg-slate-300 rounded" />
                      <div className="w-full h-0.5 bg-slate-300 rounded" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="w-4 h-1 bg-slate-600 rounded" />
                      <div className="w-full h-0.5 bg-slate-300 rounded" />
                      <div className="w-full h-0.5 bg-slate-300 rounded" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="w-4 h-1 bg-slate-600 rounded" />
                      <div className="w-full h-0.5 bg-slate-300 rounded" />
                      <div className="w-full h-0.5 bg-slate-300 rounded" />
                    </div>
                  </div>
                ),
              },
              {
                value: 'full',
                label: 'Completo',
                desc: 'Ancho completo con newsletter',
                wireframe: (
                  <div className="flex flex-col gap-1 w-full h-12 px-2 pt-1">
                    <div className="flex gap-1">
                      <div className="flex-1 h-1 bg-slate-700 rounded" />
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 bg-slate-400 rounded" />
                      <div className="w-5 h-2 bg-blue-500 rounded" />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    </div>
                  </div>
                ),
              },
            ].map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, footer_style: style.value }))}
                className={`rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  form.footer_style === style.value
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="rounded-lg bg-slate-800 border border-slate-700 overflow-hidden mb-2">
                  {style.wireframe}
                </div>
                <div className="text-sm font-bold text-slate-800">{style.label}</div>
                <div className="text-[10px] text-slate-500">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 8. Product Card Style */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<CreditCard className="w-5 h-5" />}
            title="Estilo de Tarjetas de Producto"
            desc="Selecciona cómo se muestran los productos en tu tienda."
            color="bg-orange-50 text-orange-600"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                value: 'standard',
                label: 'Estándar',
                desc: 'Imagen arriba, info abajo, botón completo',
                wireframe: (
                  <div className="w-full h-12 px-2 pt-1 space-y-1">
                    <div className="w-full h-5 bg-slate-300 rounded" />
                    <div className="w-3/4 h-1 bg-slate-600 rounded" />
                    <div className="w-1/2 h-1 bg-slate-400 rounded" />
                    <div className="w-full h-1.5 bg-blue-500 rounded" />
                  </div>
                ),
              },
              {
                value: 'compact',
                label: 'Compacto',
                desc: 'Tarjetas pequeñas sin botón, clic al producto',
                wireframe: (
                  <div className="flex gap-1 w-full h-12 px-2 pt-1">
                    <div className="flex-1 space-y-1">
                      <div className="w-full h-3 bg-slate-300 rounded" />
                      <div className="w-full h-1 bg-slate-600 rounded" />
                      <div className="w-2/3 h-0.5 bg-slate-400 rounded" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="w-full h-3 bg-slate-300 rounded" />
                      <div className="w-full h-1 bg-slate-600 rounded" />
                      <div className="w-2/3 h-0.5 bg-slate-400 rounded" />
                    </div>
                  </div>
                ),
              },
              {
                value: 'horizontal',
                label: 'Horizontal',
                desc: 'Imagen izquierda, info derecha (lado a lado)',
                wireframe: (
                  <div className="flex gap-1 w-full h-12 px-2 pt-1">
                    <div className="w-4 h-full bg-slate-300 rounded" />
                    <div className="flex-1 space-y-1 pt-0.5">
                      <div className="w-3/4 h-1 bg-slate-600 rounded" />
                      <div className="w-1/2 h-0.5 bg-slate-400 rounded" />
                      <div className="w-full h-1.5 bg-blue-500 rounded" />
                    </div>
                  </div>
                ),
              },
            ].map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, card_style: style.value }))}
                className={`rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  form.card_style === style.value
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="rounded-lg bg-white border border-slate-200 overflow-hidden mb-2">
                  {style.wireframe}
                </div>
                <div className="text-sm font-bold text-slate-800">{style.label}</div>
                <div className="text-[10px] text-slate-500">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 9. Social Media Links */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Instagram className="w-5 h-5" />}
            title="Redes Sociales"
            desc="Agrega los enlaces de tus redes sociales para que los clientes te encuentren."
            color="bg-rose-50 text-rose-600"
          />
          <div className="space-y-3">
            {[
              { key: 'social_instagram', label: 'Instagram', placeholder: '@tuinstagram o URL', icon: <Instagram className="w-4 h-4" /> },
              { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/tutienda', icon: <Facebook className="w-4 h-4" /> },
              { key: 'social_whatsapp', label: 'WhatsApp', placeholder: '+56 9 1234 5678', icon: <MessageCircle className="w-4 h-4" /> },
              { key: 'social_twitter', label: 'Twitter / X', placeholder: '@tuituente o URL', icon: <Twitter className="w-4 h-4" /> },
              { key: 'social_tiktok', label: 'TikTok', placeholder: '@tutienda o URL', icon: <Music className="w-4 h-4" /> },
            ].map(({ key, label, placeholder, icon }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                  {icon}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando cambios...' : 'Guardar apariencia'}
        </button>
      </form>
    </div>
  );
}
