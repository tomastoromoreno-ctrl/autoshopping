'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Upload, Move, ZoomIn, Sparkles, Palette, Type, Layout, CreditCard, Instagram, Facebook, MessageCircle, Twitter, Music } from 'lucide-react';

const GoogleFontsImport = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Montserrat:wght@400;500;600;700;900&family=Outfit:wght@400;500;600;700;900&family=Poppins:wght@400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;900&display=swap');
  ` }} />
);

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
];
const premiumTemplates = [
  { id: 'classic', name: 'Original Classic', desc: 'Diseño original limpio y dinámico con colores personalizables.', icon: '⚡', color: 'bg-blue-50 text-blue-600' },
  { id: 'minimalist', name: 'Minimal & Clean', desc: 'Alto espacio en blanco, fuentes elegantes y bordes ultra suaves.', icon: '🌿', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'streetwear', name: 'Streetwear Bold', desc: 'Bordes gruesos negros, sombras duras tipo neo-brutalismo.', icon: '🕶️', color: 'bg-amber-50 text-amber-600' },
  { id: 'luxury', name: 'Luxury Velvet', desc: 'Colores oscuros/beige, acentos dorados y tipografía serif.', icon: '💎', color: 'bg-purple-50 text-purple-600' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Base oscura con neones vibrantes rosados/celestes y efecto de brillo.', icon: '👾', color: 'bg-rose-50 text-rose-600' },
  { id: 'playful', name: 'Playful Pastel', desc: 'Bordes muy redondeados y colores pastel infantiles/divertidos.', icon: '🧸', color: 'bg-orange-50 text-orange-600' },
  { id: 'retro', name: 'Retro Sepia', desc: 'Fondo de pergamino cálido y texto marrón café retro.', icon: '🛹', color: 'bg-yellow-50 text-yellow-600' },
  { id: 'tech', name: 'Tech Grid', desc: 'Fondos grises mate estructurados con rejilla fina y fuente de código.', icon: '⚙️', color: 'bg-slate-100 text-slate-700' },
  { id: 'organic', name: 'Organic Earth', desc: 'Colores naturales de lino y hojas verdes naturales.', icon: '🍃', color: 'bg-teal-50 text-teal-600' },
  { id: 'sunset', name: 'Sunset Glow', desc: 'Degradados radiales cálidos emulando el atardecer.', icon: '🌅', color: 'bg-pink-50 text-pink-600' },
];

const templatePreviewConfig: Record<string, {
  bg: string; headerBg: string; headerBorder: string; brandColor: string;
  navColor: string; cardBg: string; cardBorder: string; cardRadius: string;
  btnBg: string; btnColor: string; btnRadius: string; btnShadow: string;
  textColor: string; fontFamily: string; bodyBg?: string;
}> = {
  classic: { bg: '#ffffff', headerBg: 'rgba(255,255,255,0.9)', headerBorder: '#e2e8f0', brandColor: '#2563eb', navColor: '#475569', cardBg: '#ffffff', cardBorder: '#e2e8f0', cardRadius: '12px', btnBg: '#3b82f6', btnColor: '#ffffff', btnRadius: '9999px', btnShadow: 'none', textColor: '#1e293b', fontFamily: 'Inter' },
  minimalist: { bg: '#f8fafc', headerBg: 'rgba(248,250,252,0.95)', headerBorder: '#e2e8f0', brandColor: '#0f172a', navColor: '#334155', cardBg: '#ffffff', cardBorder: '#f1f5f9', cardRadius: '6px', btnBg: '#0f172a', btnColor: '#ffffff', btnRadius: '6px', btnShadow: 'none', textColor: '#334155', fontFamily: 'Outfit' },
  streetwear: { bg: '#ffffff', headerBg: '#ffffff', headerBorder: '#000000', brandColor: '#000000', navColor: '#000000', cardBg: '#ffffff', cardBorder: '#000000', cardRadius: '0px', btnBg: '#facc15', btnColor: '#000000', btnRadius: '0px', btnShadow: '4px 4px 0px #000000', textColor: '#000000', fontFamily: 'Montserrat' },
  luxury: { bg: '#fcfaf7', headerBg: 'rgba(252,250,247,0.95)', headerBorder: '#e5d8c5', brandColor: '#b59410', navColor: '#1a0f00', cardBg: '#ffffff', cardBorder: '#e5d8c5', cardRadius: '0px', btnBg: '#1e3a1e', btnColor: '#fcfaf7', btnRadius: '0px', btnShadow: 'none', textColor: '#1a0f00', fontFamily: "'Playfair Display', serif" },
  cyberpunk: { bg: '#0b0416', headerBg: 'rgba(11,4,22,0.85)', headerBorder: '#2d1f4d', brandColor: '#00f3ff', navColor: '#e2d9f3', cardBg: 'rgba(18,10,36,0.7)', cardBorder: '#2d1f4d', cardRadius: '4px', btnBg: '#ff007f', btnColor: '#ffffff', btnRadius: '4px', btnShadow: '0 0 12px rgba(255,0,127,0.5)', textColor: '#e2d9f3', fontFamily: "'Orbitron', sans-serif", bodyBg: 'radial-gradient(circle at 50% 50%, #160a2c 0%, #0b0416 100%)' },
  playful: { bg: '#fffaf0', headerBg: 'rgba(255,250,240,0.95)', headerBorder: '#fed7aa', brandColor: '#ff6b6b', navColor: '#4a2c2c', cardBg: '#ffffff', cardBorder: '#fed7aa', cardRadius: '24px', btnBg: '#ff6b6b', btnColor: '#ffffff', btnRadius: '9999px', btnShadow: 'none', textColor: '#4a2c2c', fontFamily: 'Poppins' },
  retro: { bg: '#f4ede4', headerBg: 'rgba(244,237,228,0.95)', headerBorder: '#2e251b', brandColor: '#a0522d', navColor: '#2e251b', cardBg: '#fcfbf9', cardBorder: '#2e251b', cardRadius: '2px', btnBg: '#a0522d', btnColor: '#f4ede4', btnRadius: '2px', btnShadow: 'none', textColor: '#2e251b', fontFamily: 'monospace', bodyBg: 'radial-gradient(#d3c6b6 1px, transparent 1px)' },
  tech: { bg: '#0c0c0d', headerBg: '#0c0c0d', headerBorder: '#1f2937', brandColor: '#3b82f6', navColor: '#d1d5db', cardBg: '#121214', cardBorder: '#1f2937', cardRadius: '0px', btnBg: '#3b82f6', btnColor: '#ffffff', btnRadius: '0px', btnShadow: 'none', textColor: '#d1d5db', fontFamily: "'Fira Code', monospace" },
  organic: { bg: '#f5f4ee', headerBg: 'rgba(245,244,238,0.95)', headerBorder: '#d8d6cb', brandColor: '#2d4b3c', navColor: '#2c3531', cardBg: '#ffffff', cardBorder: '#d8d6cb', cardRadius: '16px', btnBg: '#2d4b3c', btnColor: '#f5f4ee', btnRadius: '12px', btnShadow: 'none', textColor: '#2c3531', fontFamily: 'Outfit' },
  sunset: { bg: '#200b2c', headerBg: 'rgba(32,11,44,0.8)', headerBorder: '#4c1d95', brandColor: '#f97316', navColor: '#fdf4ff', cardBg: 'rgba(32,11,44,0.6)', cardBorder: '#4c1d95', cardRadius: '12px', btnBg: 'linear-gradient(to right, #f97316, #db2777)', btnColor: '#ffffff', btnRadius: '8px', btnShadow: 'none', textColor: '#fdf4ff', fontFamily: 'Poppins', bodyBg: 'linear-gradient(to bottom, #200b2c, #4c1d95)' },
};

function TemplatePreview({ templateId, isHovered }: { templateId: string; isHovered: boolean }) {
  const cfg = templatePreviewConfig[templateId] || templatePreviewConfig.classic;
  const scale = isHovered ? 1.05 : 1;

  return (
    <div
      className="w-full rounded-lg overflow-hidden border border-slate-200 transition-transform duration-200"
      style={{
        height: 140,
        transform: `scale(${scale})`,
        fontFamily: cfg.fontFamily,
        color: cfg.textColor,
        background: cfg.bodyBg || cfg.bg,
      }}
    >
      {/* Mini Header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{ background: cfg.headerBg, borderBottom: `1px solid ${cfg.headerBorder}` }}
      >
        <div className="w-3 h-3 rounded-sm" style={{ background: cfg.brandColor }} />
        <span className="text-[7px] font-bold" style={{ color: cfg.brandColor }}>Tienda</span>
        <div className="flex-1" />
        <span className="text-[6px]" style={{ color: cfg.navColor }}>Inicio</span>
        <span className="text-[6px]" style={{ color: cfg.navColor }}>Productos</span>
      </div>

      {/* Content area */}
      <div className="p-2 flex gap-1.5">
        {/* Product cards */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 overflow-hidden"
            style={{
              background: cfg.cardBg,
              border: `1px solid ${cfg.cardBorder}`,
              borderRadius: cfg.cardRadius,
              opacity: isHovered ? 1 : 0.85,
            }}
          >
            {/* Image placeholder */}
            <div
              className="w-full"
              style={{
                height: 36,
                background: templateId === 'cyberpunk' ? '#160a2c' : templateId === 'tech' ? '#1a1a1e' : templateId === 'sunset' ? '#1a0a20' : '#f1f5f9',
              }}
            />
            {/* Text lines */}
            <div className="p-1.5">
              <div className="h-1.5 rounded-sm mb-1" style={{ background: cfg.textColor, opacity: 0.2, width: '80%' }} />
              <div className="h-1 rounded-sm mb-1.5" style={{ background: cfg.textColor, opacity: 0.1, width: '60%' }} />
              {/* Mini button */}
              <div
                className="h-3 w-full"
                style={{
                  background: cfg.btnBg,
                  color: cfg.btnColor,
                  borderRadius: cfg.btnRadius,
                  boxShadow: cfg.btnShadow,
                  fontSize: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: cfg.btnColor }}>$9.990</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppearancePage() {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
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
    template_id: 'classic',
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
        template_id: res.template_id || 'classic',
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

  const presetStylesHtml = colorPresets.map((preset, idx) => `
    .preset-bg-${idx} { background-color: ${preset.bg} !important; }
    .preset-btn-${idx} { background-color: ${preset.btn} !important; }
    .preset-text-${idx} { background-color: ${preset.text} !important; }
    .preset-text-color-${idx} { color: ${preset.text} !important; }
    .preset-primary-${idx} { background-color: ${preset.primary} !important; }
  `).join('\n') + fontOptions.map((font, idx) => `
    .font-option-${idx} { font-family: '${font.value}', sans-serif !important; }
  `).join('\n');

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <GoogleFontsImport />
      <style dangerouslySetInnerHTML={{ __html: presetStylesHtml }} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Apariencia</h1>
          <p className="text-xs sm:text-sm text-slate-500">Personaliza la identidad visual y marca de tu tienda online.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 0. Premium Storefront Template */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title="Plantilla de la Tienda (Premium)"
            desc="Selecciona el diseño y estilo estético para tu tienda pública."
            color="bg-amber-50 text-amber-600"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {premiumTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, template_id: tpl.id }))}
                onMouseEnter={() => setHoveredTemplate(tpl.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                className={`rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${
                  form.template_id === tpl.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <TemplatePreview templateId={tpl.id} isHovered={hoveredTemplate === tpl.id || form.template_id === tpl.id} />
                <div className="flex items-start gap-3 mt-3">
                  <div className={`p-2 rounded-lg ${tpl.color} text-lg flex-shrink-0`}>
                    {tpl.icon}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block mb-0.5">{tpl.name}</span>
                    <p className="text-xs text-slate-500 leading-relaxed">{tpl.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 1. Color Presets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={<Palette className="w-5 h-5" />}
            title="Paletas de Color"
            desc="Selecciona un preset visual para aplicar colores instantáneamente."
            color="bg-violet-50 text-violet-600"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colorPresets.map((preset, idx) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`relative rounded-xl border-2 p-3 transition-all hover:shadow-md preset-bg-${idx} ${
                  form.color_preset === preset.name
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex gap-1.5 mb-2 justify-center">
                  <span className={`w-4 h-4 rounded-full border border-slate-200 preset-bg-${idx}`} />
                  <span className={`w-4 h-4 rounded-full border border-slate-200 preset-btn-${idx}`} />
                  <span className={`w-4 h-4 rounded-full border border-slate-200 preset-text-${idx}`} />
                  <span className={`w-4 h-4 rounded-full border border-slate-200 preset-primary-${idx}`} />
                </div>
                <span className={`text-[10px] font-bold text-center block preset-text-color-${idx}`}>
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
            {fontOptions.map((font, idx) => (
              <button
                key={font.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, font_family: font.value }))}
                className={`w-full flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                  form.font_family === font.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-bold text-slate-700 mb-1 sm:mb-0">{font.label}</span>
                <span className={`text-lg sm:text-xl font-bold text-slate-800 leading-tight font-option-${idx}`}>
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
                    <style>{`
                      #logo-preview-image {
                        transform: scale(${zoom}) translate(${offsetX}px, ${offsetY}px);
                      }
                    `}</style>
                    <img
                      id="logo-preview-image"
                      src={imageSrc}
                      alt="Logo preview"
                      className="absolute inset-0 transition-transform duration-75 w-full h-full object-contain origin-center"
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
                <label htmlFor={`color-${key}`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="h-8 w-8 cursor-pointer rounded-lg border-0"
                    title={label}
                    placeholder={label}
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
