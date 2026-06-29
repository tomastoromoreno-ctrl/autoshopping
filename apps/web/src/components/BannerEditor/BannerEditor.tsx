'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

const BANNER_SIZES = [
  { label: '1200×600 (Recomendado)', width: 1200, height: 600 },
  { label: '1200×400', width: 1200, height: 400 },
  { label: '800×400', width: 800, height: 400 },
  { label: '800×300', width: 800, height: 300 },
  { label: '600×300', width: 600, height: 300 },
  { label: 'Cuadrado 600×600', width: 600, height: 600 },
];

const FONTS = [
  'Arial', 'Verdana', 'Helvetica', 'Georgia', 'Times New Roman',
  'Courier New', 'Impact', 'Trebuchet MS',
];

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea',
  '#ec4899', '#06b6d4', '#f59e0b', '#6366f1', '#14b8a6',
  '#000000', '#ffffff', '#6b7280', '#1f2937', '#f3f4f6',
];

interface BannerEditorProps {
  onSave: (payload: { dataUrl: string; canvasJson: string }) => void;
  initialWidth?: number;
  initialHeight?: number;
  initialBg?: string;
  initialCanvasJson?: string;
}

export default function BannerEditor({
  onSave,
  initialWidth = 1200,
  initialHeight = 600,
  initialBg = '#2563eb',
  initialCanvasJson,
}: BannerEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const readyRef = useRef(false);
  const loadedJsonRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIdx = useRef(-1);
  const skipHistory = useRef(false);

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
  const [ready, setReady] = useState(false);

  const getScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0.5;
    const maxW = container.clientWidth - 32;
    return Math.min(maxW / canvasSize.width, 0.8);
  }, [canvasSize.width]);

  const saveHistory = useCallback(() => {
    if (skipHistory.current) return;
    const c = fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(json);
    historyIdx.current = historyRef.current.length - 1;
  }, []);

  const doUndo = useCallback(() => {
    const c = fabricRef.current;
    if (!c || historyIdx.current <= 0) return;
    historyIdx.current--;
    skipHistory.current = true;
    c.loadFromJSON(JSON.parse(historyRef.current[historyIdx.current])).then(() => {
      c.renderAll();
      skipHistory.current = false;
    });
  }, []);

  const doRedo = useCallback(() => {
    const c = fabricRef.current;
    if (!c || historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current++;
    skipHistory.current = true;
    c.loadFromJSON(JSON.parse(historyRef.current[historyIdx.current])).then(() => {
      c.renderAll();
      skipHistory.current = false;
    });
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;

    const s = getScale();
    setScale(s);

    const c = new fabric.Canvas(canvasElRef.current, {
      width: canvasSize.width * s,
      height: canvasSize.height * s,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
    });

    fabricRef.current = c;
    readyRef.current = true;
    loadedJsonRef.current = false;
    setReady(true);

    c.on('selection:created', (e) => setSelectedObj(e.selected?.[0] || null));
    c.on('selection:updated', (e) => setSelectedObj(e.selected?.[0] || null));
    c.on('selection:cleared', () => setSelectedObj(null));

    // Load from JSON if editing
    if (initialCanvasJson) {
      try {
        const json = JSON.parse(initialCanvasJson);
        c.loadFromJSON(json).then(() => {
          c.renderAll();
          loadedJsonRef.current = true;
          saveHistory();
        });
      } catch {}
    } else {
      saveHistory();
    }

    return () => {
      c.dispose();
      fabricRef.current = null;
      readyRef.current = false;
      setReady(false);
    };
  }, [canvasSize.width, canvasSize.height]); // eslint-disable-line

  // Resize display on window resize
  useEffect(() => {
    const onResize = () => {
      const c = fabricRef.current;
      if (!c || !containerRef.current) return;
      const s = getScale();
      setScale(s);
      c.setDimensions({ width: canvasSize.width * s, height: canvasSize.height * s });
      c.renderAll();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [canvasSize, getScale]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const c = fabricRef.current;
      if (!c) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        doRedo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const obj = c.getActiveObject();
        if (obj && !(obj instanceof fabric.IText && (obj as fabric.IText).isEditing)) {
          c.remove(obj);
          c.renderAll();
          setSelectedObj(null);
          saveHistory();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doUndo, doRedo, saveHistory]);

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
        const ratio = Math.min(canvasSize.width * 0.5 / imgEl.width, canvasSize.height * 0.5 / imgEl.height, 1);
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
    const common = { left: canvasSize.width * 0.3, top: canvasSize.height * 0.3, fill: textColor };

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
    if (c) { c.backgroundColor = color; c.renderAll(); }
  };

  const updateSelected = (prop: string, value: any) => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!obj) return;
    if (prop === 'fill') {
      obj.set('fill', value);
      if (obj instanceof fabric.IText || obj instanceof fabric.Textbox) setTextColor(value);
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
    }
    c?.renderAll();
  };

  const handleExport = () => {
    const c = fabricRef.current;
    if (!c) return;
    c.discardActiveObject();
    c.renderAll();

    const multiplier = scale > 0 ? Math.min(1 / scale, 3) : 1;
    const dataUrl = c.toDataURL({ format: 'png', quality: 1, multiplier });
    const canvasJson = JSON.stringify(c.toJSON());

    onSave({ dataUrl, canvasJson });
  };

  const isText = selectedObj instanceof fabric.IText || selectedObj instanceof fabric.Textbox;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Tools */}
      <div className="w-64 flex-shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['text', 'image', 'shape', 'bg'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${activeTab === tab ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>
              {tab === 'text' ? 'Texto' : tab === 'image' ? 'Imagen' : tab === 'shape' ? 'Formas' : 'Fondo'}
            </button>
          ))}
        </div>

        {activeTab === 'text' && (
          <div className="space-y-3">
            <button onClick={addText} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90">
              + Agregar Texto
            </button>
            {isText && (
              <>
                <select value={fontFamily} onChange={(e) => updateSelected('fontFamily', e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <input type="range" min="12" max="120" value={fontSize} onChange={(e) => updateSelected('fontSize', parseInt(e.target.value))} className="w-full" />
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => updateSelected('fill', c)} className={`h-6 w-6 rounded-full border-2 ${textColor === c ? 'border-primary' : 'border-slate-200'}`} style={{ background: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateSelected('fontWeight', !bold)} className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${bold ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200'}`}>B</button>
                  <button onClick={() => updateSelected('fontStyle', !italic)} className={`rounded-lg border px-3 py-1.5 text-sm italic ${italic ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200'}`}>I</button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'image' && (
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-primary hover:text-primary">
            Subir Imagen
            <input type="file" accept="image/*" onChange={addImage} className="hidden" />
          </label>
        )}

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
          </div>
        )}

        {activeTab === 'bg' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => changeBg(c)} className={`h-7 w-7 rounded-full border-2 ${bgColor === c ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'}`} style={{ background: c }} />
              ))}
            </div>
            <input type="color" value={bgColor} onChange={(e) => changeBg(e.target.value)} className="h-8 w-full cursor-pointer rounded-lg border border-slate-200" />
            <select value={`${canvasSize.width}x${canvasSize.height}`} onChange={(e) => { const [w, h] = e.target.value.split('x').map(Number); setCanvasSize({ width: w, height: h }); }} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
              {BANNER_SIZES.map((s) => <option key={s.label} value={`${s.width}x${s.height}`}>{s.label}</option>)}
            </select>
          </div>
        )}

        {selectedObj && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex gap-1">
              <button onClick={() => { const c = fabricRef.current; if (c && selectedObj) { c.bringObjectForward(selectedObj); c.renderAll(); } }} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50">↑</button>
              <button onClick={() => { const c = fabricRef.current; if (c && selectedObj) { c.sendObjectBackwards(selectedObj); c.renderAll(); } }} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50">↓</button>
              <button onClick={() => { const c = fabricRef.current; if (c && selectedObj) { c.remove(selectedObj); c.renderAll(); setSelectedObj(null); saveHistory(); } }} className="flex-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">🗑</button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex flex-1 flex-col items-center overflow-auto bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <button onClick={doUndo} disabled={!ready} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↩️</button>
          <button onClick={doRedo} disabled={!ready} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↪️</button>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <span className="text-xs text-slate-400">{canvasSize.width}×{canvasSize.height}</span>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <button onClick={handleExport} disabled={!ready} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            Guardar Banner
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
}
