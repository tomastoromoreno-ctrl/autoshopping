'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Upload, Move, ZoomIn, Sparkles } from 'lucide-react';

interface AppearanceConfig {
  logo_url: string;
  primary_color: string;
  slogan?: string;
  name?: string;
  font_family?: string;
  bg_color?: string;
  btn_color?: string;
  btn_text_color?: string;
  text_color?: string;
}

export default function AppearancePage() {
  const [form, setForm] = useState<AppearanceConfig>({
    logo_url: '',
    primary_color: '#3b82f6',
    slogan: '',
    name: '',
    font_family: 'Inter',
    bg_color: '#ffffff',
    btn_color: '#3b82f6',
    btn_text_color: '#ffffff',
    text_color: '#1e293b',
  });
  const [storeName, setStoreName] = useState('Mi Tienda');
  const [loading, setLoading] = useState(false);
  
  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [originalLogo, setOriginalLogo] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<any>('/config/appearance').then((res) => {
      setForm({
        logo_url: res.logo_url || '',
        primary_color: res.primary_color || '#3b82f6',
        slogan: res.slogan || '',
        name: res.name || '',
        font_family: res.font_family || 'Inter',
        bg_color: res.bg_color || '#ffffff',
        btn_color: res.btn_color || '#3b82f6',
        btn_text_color: res.btn_text_color || '#ffffff',
        text_color: res.text_color || '#1e293b',
      });
      if (res.name) setStoreName(res.name);
      if (res.logo_url) {
        setOriginalLogo(res.logo_url);
      }
    }).catch(() => {});
  }, []);

  // Update canvas cropped logo
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

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 200);

      const minScale = Math.max(200 / img.width, 200 / img.height);
      const scale = minScale * zoom;
      const w = img.width * scale;
      const h = img.height * scale;

      // Center + offsets
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/config/appearance', form);
      setOriginalLogo(form.logo_url);
      setImageSrc(null); // Clear cropper state once saved
      alert('Cambios guardados con éxito');
    } catch (err: any) {
      alert(err.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Apariencia</h1>
          <p className="text-xs sm:text-sm text-slate-500">Personaliza la identidad visual y marca de tu tienda online.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección del Slogan y Nombre */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Datos e Identidad</h2>
              <p className="text-xs text-slate-500">Define el nombre de tu tienda y el slogan que se mostrará en el navegador.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre de la Tienda</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setStoreName(e.target.value);
                }}
                placeholder="Ej: SportShop"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Slogan</label>
              <input
                type="text"
                value={form.slogan || ''}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                placeholder="Ej: La mejor tienda de calzado deportivo"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Simulación de la barra del navegador */}
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
                  {storeName} {form.slogan ? `| ${form.slogan}` : ''}
                </span>
                <span className="text-[8px] text-slate-400 ml-auto pl-2">✕</span>
              </div>
              <div className="h-4 bg-slate-200/30 border-t border-slate-300/50 rounded-b-lg flex items-center px-4">
                <div className="w-16 h-2 rounded bg-slate-300/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Sección del Logo y Encuadre */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Logo de la Tienda</h2>
              <p className="text-xs text-slate-500">Sube el logo de tu marca y ajústalo para que esté encuadrado siempre.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Controles de Carga y Edición */}
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
                  
                  {/* Control Zoom */}
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

                  {/* Control Horizontal Offset */}
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

                  {/* Control Vertical Offset */}
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

            {/* Previsualización del Encuadre */}
            <div className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Encuadre Resultante</span>
              
              {/* Cuadro de previsualización */}
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
                    {/* Guías visuales de corte */}
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
                    setForm({ ...form, logo_url: originalLogo });
                  }}
                  className="mt-3 text-xs text-red-500 font-semibold hover:underline"
                >
                  Cancelar cambios de imagen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Identidad Visual Avanzada */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Identidad Visual & Estilos</h2>
              <p className="text-xs text-slate-500">Personaliza la tipografía y los colores de la interfaz de tu tienda.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controles de Configuración */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-bold">Fuente Tipográfica</label>
                <select
                  value={form.font_family || 'Inter'}
                  onChange={(e) => setForm({ ...form, font_family: e.target.value })}
                  aria-label="Fuente tipográfica"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-800"
                >
                  <option value="Inter">Inter (Sans-serif moderna)</option>
                  <option value="Montserrat">Montserrat (Geométrica y elegante)</option>
                  <option value="Outfit">Outfit (Minimalista y estilizada)</option>
                  <option value="Poppins">Poppins (Redondeada y amigable)</option>
                  <option value="Playfair Display">Playfair Display (Clásica Serif)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-bold">Color de Fondo</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <input
                      type="color"
                      value={form.bg_color || '#ffffff'}
                      onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                      aria-label="Color de fondo"
                      className="h-8 w-8 cursor-pointer rounded-lg border-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">{form.bg_color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-bold">Color de Botones</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <input
                      type="color"
                      value={form.btn_color || '#3b82f6'}
                      onChange={(e) => setForm({ ...form, btn_color: e.target.value })}
                      aria-label="Color de botones"
                      className="h-8 w-8 cursor-pointer rounded-lg border-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">{form.btn_color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-bold">Color de Texto en Botones</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <input
                      type="color"
                      value={form.btn_text_color || '#ffffff'}
                      onChange={(e) => setForm({ ...form, btn_text_color: e.target.value })}
                      aria-label="Color de texto en botones"
                      className="h-8 w-8 cursor-pointer rounded-lg border-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">{form.btn_text_color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-bold">Color de Texto Principal</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <input
                      type="color"
                      value={form.text_color || '#1e293b'}
                      onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                      aria-label="Color de texto principal"
                      className="h-8 w-8 cursor-pointer rounded-lg border-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">{form.text_color}</span>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Previsualización en Vivo de la Tienda */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Previsualización de Componente</span>
              
              {/* Product Card Preview */}
              <div 
                className="p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 transition-colors"
                style={{ 
                  backgroundColor: form.bg_color || '#ffffff',
                  fontFamily: `${form.font_family || 'Inter'}, sans-serif`
                }}
              >
                <div className="aspect-square rounded-lg overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop" 
                    alt="Calzado deportivo premium" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold transition-colors" style={{ color: form.text_color || '#1e293b' }}>Calzado Running Flex</h4>
                  <p className="text-xs transition-colors line-clamp-1 opacity-75" style={{ color: form.text_color || '#1e293b' }}>Amortiguación reactiva de alto nivel</p>
                </div>
                <div className="flex items-center justify-between font-sans">
                  <span className="text-sm font-black transition-colors" style={{ color: form.text_color || '#1e293b' }}>$59.990</span>
                  <button 
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                    style={{ 
                      backgroundColor: form.btn_color || '#3b82f6',
                      color: form.btn_text_color || '#ffffff'
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-[1.01]"
        >
          {loading ? 'Guardando cambios...' : 'Guardar apariencia'}
        </button>
      </form>
    </div>
  );
}
