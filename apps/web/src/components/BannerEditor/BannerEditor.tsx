'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

const BANNER_SIZES = [
  { label: 'Banner Principal (1200×400)', width: 1200, height: 400 },
  { label: 'Banner Medio (800×300)', width: 800, height: 300 },
  { label: 'Banner Pequeño (600×200)', width: 600, height: 200 },
  { label: 'Cuadrado (600×600)', width: 600, height: 600 },
  { label: 'Story (1080×1920)', width: 1080, height: 1920 },
];

const FONTS = [
  'Arial', 'Verdana', 'Helvetica', 'Georgia', 'Times New Roman',
  'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS',
  'Palatino Linotype', 'Lucida Console',
];

const PRESET_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea',
  '#ec4899', '#06b6d4', '#f59e0b', '#6366f1', '#14b8a6',
  '#000000', '#ffffff', '#6b7280', '#1f2937', '#f3f4f6',
];

interface BannerEditorProps {
  onSave: (dataUrl: string) => void;
  initialWidth?: number;
  initialHeight?: number;
  initialBg?: string;
  initialImageUrl?: string;
}

export default function BannerEditor({
  onSave,
  initialWidth = 1200,
  initialHeight = 400,
  initialBg = '#2563eb',
  initialImageUrl,
}: BannerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const imageLoadedRef = useRef<string | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: initialWidth, height: initialHeight });
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);
  const [bgColor, setBgColor] = useState(initialBg);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'shape' | 'bg'>('text');
  const [scale, setScale] = useState(1);
  const [historyLength, setHistoryLength] = useState(0);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Save history helper (stable ref)
  const saveHistory = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    setHistoryLength(historyRef.current.length);
    setHistoryIdx(historyIndexRef.current);
  }, []);

  // Initialize canvas ONCE
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const maxW = container.clientWidth - 32;
    const s = Math.min(maxW / canvasSize.width, 0.8);
    setScale(s);

    const c = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width * s,
      height: canvasSize.height * s,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
    });

    fabricRef.current = c;
    imageLoadedRef.current = null;

    c.on('selection:created', (e) => setSelectedObj(e.selected?.[0] || null));
    c.on('selection:updated', (e) => setSelectedObj(e.selected?.[0] || null));
    c.on('selection:cleared', () => setSelectedObj(null));

    saveHistory();

    return () => {
      c.dispose();
      fabricRef.current = null;
    };
  }, []); // ← empty deps: create canvas ONCE

  // Resize canvas display on window resize
  useEffect(() => {
    const onResize = () => {
      const c = fabricRef.current;
      const container = containerRef.current;
      if (!c || !container) return;
      const maxW = container.clientWidth - 32;
      const s = Math.min(maxW / canvasSize.width, 0.8);
      setScale(s);
      c.setDimensions({ width: canvasSize.width * s, height: canvasSize.height * s });
      c.renderAll();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [canvasSize]);

  // Resize canvas when canvasSize changes (without re-creating)
  useEffect(() => {
    const c = fabricRef.current;
    const container = containerRef.current;
    if (!c || !container) return;
    const maxW = container.clientWidth - 32;
    const s = Math.min(maxW / canvasSize.width, 0.8);
    setScale(s);
    c.setDimensions({ width: canvasSize.width * s, height: canvasSize.height * s });
    c.backgroundColor = bgColor;
    c.renderAll();
  }, [canvasSize, bgColor]);

  // Load initial image when it becomes available
  useEffect(() => {
    if (!initialImageUrl || imageLoadedRef.current === initialImageUrl) return;
    const c = fabricRef.current;
    if (!c) return;

    imageLoadedRef.current = initialImageUrl;

    // Clear canvas before loading new image
    c.getObjects().forEach((obj) => c.remove(obj));

    fabric.FabricImage.fromURL(initialImageUrl)
      .then((img) => {
        // Scale image to fit canvas logical dimensions
        const scaleX = canvasSize.width / (img.width || 1);
        const scaleY = canvasSize.height / (img.height || 1);
        const fitScale = Math.min(scaleX, scaleY, 1);

        img.scale(fitScale);
        img.set({
          left: canvasSize.width / 2,
          top: canvasSize.height / 2,
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
        });

        c.add(img);
        c.renderAll();
        saveHistory();
      })
      .catch((err) => {
        console.error('Failed to load banner image:', err);
      });
  }, [initialImageUrl, canvasSize.width, canvasSize.height, saveHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const c = fabricRef.current;
        const obj = c?.getActiveObject();
        if (c && obj && !(obj instanceof fabric.IText && (obj as fabric.IText).isEditing)) {
          c.remove(obj);
          c.renderAll();
          setSelectedObj(null);
          saveHistory();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveHistory]);

  // Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const c = fabricRef.current;
        if (!c || historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
          c.renderAll();
          setHistoryIdx(historyIndexRef.current);
        });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const c = fabricRef.current;
        if (!c || historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current++;
        c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
          c.renderAll();
          setHistoryIdx(historyIndexRef.current);
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // --- Actions ---
  const addText = () => {
    const c = fabricRef.current;
    if (!c) return;
    const text = new fabric.IText('Texto aquí', {
      left: canvasSize.width * 0.1,
      top: canvasSize.height * 0.4,
      fontSize,
      fontFamily,
      fill: textColor,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 }),
    });
    c.add(text);
    c.setActiveObject(text);
    c.renderAll();
    saveHistory();
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const c = fabricRef.current;
        if (!c) return;
        const img = new fabric.FabricImage(imgEl, { left: 20, top: 20 });
        const maxW = canvasSize.width * 0.5;
        const maxH = canvasSize.height * 0.5;
        const ratio = Math.min(maxW / imgEl.width, maxH / imgEl.height, 1);
        img.scale(ratio);
        c.add(img);
        c.setActiveObject(img);
        c.renderAll();
        saveHistory();
      };
      imgEl.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addShape = (type: 'rect' | 'circle' | 'line') => {
    const c = fabricRef.current;
    if (!c) return;
    let obj: fabric.Object;
    const common = {
      left: canvasSize.width * 0.3,
      top: canvasSize.height * 0.3,
      fill: textColor,
      stroke: '',
      strokeWidth: 0,
    };

    if (type === 'rect') {
      obj = new fabric.Rect({ ...common, width: 150, height: 100, rx: 8, ry: 8 });
    } else if (type === 'circle') {
      obj = new fabric.Circle({ ...common, radius: 60 });
    } else {
      obj = new fabric.Line([0, 0, 200, 0], {
        left: canvasSize.width * 0.3,
        top: canvasSize.height * 0.5,
        stroke: textColor,
        strokeWidth: 4,
      });
    }
    c.add(obj);
    c.setActiveObject(obj);
    c.renderAll();
    saveHistory();
  };

  const changeBg = (color: string) => {
    setBgColor(color);
    const c = fabricRef.current;
    if (c) { c.backgroundColor = color; c.renderAll(); saveHistory(); }
  };

  const updateSelectedProp = (prop: string, value: any) => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!obj) return;
    if (prop === 'fill') {
      if (obj instanceof fabric.IText || obj instanceof fabric.Textbox) {
        obj.set('fill', value);
        setTextColor(value);
      } else {
        obj.set('fill', value);
      }
    } else if (prop === 'fontSize') {
      obj.set('fontSize', value);
      setFontSize(value);
    } else if (prop === 'fontFamily') {
      obj.set('fontFamily', value);
      setFontFamily(value);
    } else if (prop === 'fontWeight') {
      obj.set('fontWeight', value ? 'bold' : 'normal');
      setBold(value);
    } else if (prop === 'fontStyle') {
      obj.set('fontStyle', value ? 'italic' : 'normal');
      setItalic(value);
    } else {
      obj.set(prop, value);
    }
    c?.renderAll();
    saveHistory();
  };

  const bringForward = () => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (obj) { c?.bringObjectForward(obj); c?.renderAll(); saveHistory(); }
  };

  const sendBackward = () => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (obj) { c?.sendObjectBackwards(obj); c?.renderAll(); saveHistory(); }
  };

  const deleteSelected = () => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (obj) { c?.remove(obj); c?.renderAll(); setSelectedObj(null); saveHistory(); }
  };

  const handleExport = () => {
    const c = fabricRef.current;
    if (!c) return;
    c.discardActiveObject();
    c.renderAll();

    const multiplier = scale > 0 ? Math.min(1 / scale, 3) : 1;
    const dataUrl = c.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
    });

    onSave(dataUrl);
  };

  const changeSize = (w: number, h: number) => {
    setCanvasSize({ width: w, height: h });
  };

  const isTextSelected = selectedObj instanceof fabric.IText || selectedObj instanceof fabric.Textbox;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Left Panel - Tools */}
      <div className="w-64 flex-shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['text', 'image', 'shape', 'bg'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                activeTab === tab ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              {tab === 'text' ? 'Texto' : tab === 'image' ? 'Imagen' : tab === 'shape' ? 'Formas' : 'Fondo'}
            </button>
          ))}
        </div>

        {/* Text Panel */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <button onClick={addText} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90">
              + Agregar Texto
            </button>
            {isTextSelected && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Fuente</label>
                  <select value={fontFamily} onChange={(e) => updateSelectedProp('fontFamily', e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Tamaño: {fontSize}</label>
                  <input type="range" min="12" max="120" value={fontSize} onChange={(e) => updateSelectedProp('fontSize', parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button key={c} onClick={() => updateSelectedProp('fill', c)} className={`h-6 w-6 rounded-full border-2 ${textColor === c ? 'border-primary' : 'border-slate-200'}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateSelectedProp('fontWeight', !bold)} className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${bold ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200'}`}>B</button>
                  <button onClick={() => updateSelectedProp('fontStyle', !italic)} className={`rounded-lg border px-3 py-1.5 text-sm italic ${italic ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200'}`}>I</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Image Panel */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-primary hover:text-primary">
              Subir Imagen
              <input type="file" accept="image/*" onChange={addImage} className="hidden" />
            </label>
            <p className="text-xs text-slate-400">La imagen se agregará al centro y podrás redimensionarla</p>
          </div>
        )}

        {/* Shape Panel */}
        {activeTab === 'shape' && (
          <div className="space-y-2">
            <button onClick={() => addShape('rect')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <span className="h-4 w-6 border-2 border-slate-400" /> Rectángulo
            </button>
            <button onClick={() => addShape('circle')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <span className="h-5 w-5 rounded-full border-2 border-slate-400" /> Círculo
            </button>
            <button onClick={() => addShape('line')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <span className="h-0.5 w-6 bg-slate-400" /> Línea
            </button>
            {selectedObj && (
              <div className="pt-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Color de forma</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => updateSelectedProp('fill', c)} className="h-6 w-6 rounded-full border-2 border-slate-200" style={{ background: c }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Background Panel */}
        {activeTab === 'bg' && (
          <div className="space-y-3">
            <label className="mb-1 block text-xs font-medium text-slate-500">Color de fondo</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => changeBg(c)} className={`h-7 w-7 rounded-full border-2 ${bgColor === c ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'}`} style={{ background: c }} />
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Color personalizado</label>
              <input type="color" value={bgColor} onChange={(e) => changeBg(e.target.value)} className="h-8 w-full cursor-pointer rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tamaño del banner</label>
              <select value={`${canvasSize.width}x${canvasSize.height}`} onChange={(e) => { const [w, h] = e.target.value.split('x').map(Number); changeSize(w, h); }} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                {BANNER_SIZES.map((s) => <option key={s.label} value={`${s.width}x${s.height}`}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Layers */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-xs font-semibold text-slate-500 uppercase">Capas</h3>
          <div className="flex gap-1">
            <button onClick={bringForward} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50" title="Traer adelante">↑</button>
            <button onClick={sendBackward} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50" title="Enviar atrás">↓</button>
            <button onClick={deleteSelected} disabled={!selectedObj} className="flex-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-30" title="Eliminar">🗑</button>
          </div>
        </div>
      </div>

      {/* Center - Canvas */}
      <div ref={containerRef} className="flex flex-1 flex-col items-center overflow-auto bg-slate-50 p-4">
        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <button onClick={() => {
            const c = fabricRef.current;
            if (!c || historyIndexRef.current <= 0) return;
            historyIndexRef.current--;
            c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
              c.renderAll();
              setHistoryIdx(historyIndexRef.current);
            });
          }} disabled={historyIdx <= 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Deshacer (Ctrl+Z)">
            ↩️
          </button>
          <button onClick={() => {
            const c = fabricRef.current;
            if (!c || historyIndexRef.current >= historyRef.current.length - 1) return;
            historyIndexRef.current++;
            c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
              c.renderAll();
              setHistoryIdx(historyIndexRef.current);
            });
          }} disabled={historyIdx >= historyLength - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Rehacer (Ctrl+Y)">
            ↪️
          </button>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <span className="text-xs text-slate-400">{canvasSize.width}×{canvasSize.height}</span>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <button onClick={handleExport} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
            Guardar Banner
          </button>
        </div>

        {/* Canvas */}
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
