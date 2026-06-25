'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Upload, Download, BookOpen, ChevronDown, ChevronUp, Star, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  category: Category | null;
  status: string;
  images: string[];
  is_featured?: boolean;
  is_new?: boolean;
  has_buy_now?: boolean;
  technical_specs?: Record<string, any>;
  has_shipping_info?: boolean;
  vertical_gallery?: boolean;
  has_zoom?: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    images: '',
    slug: '',
    is_featured: false,
    is_new: false,
    has_buy_now: true,
    technical_specs: '',
    has_shipping_info: true,
    vertical_gallery: false,
    has_zoom: true
  });
  const [loading, setLoading] = useState(false);
  const [sortCol, setSortCol] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Excel importer states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importProgress, setImportProgress] = useState<'idle' | 'reading' | 'uploading' | 'success' | 'error'>('idle');
  const [importStats, setImportStats] = useState({ total: 0, added: 0, updated: 0 });

  const load = () => {
    api.get<{ data: Product[] }>('/products?limit=100')
      .then((res) => setProducts(res.data || []))
      .catch((err) => {
        console.error('[Products] Error cargando productos:', err.message);
      });
    api.get<Category[]>('/categories')
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch((err) => {
        console.error('[Categories] Error cargando categorías:', err.message);
      });
  };

  useEffect(() => { load(); }, []);

  const downloadTemplate = () => {
    const headers = [["SKU", "Nombre del producto", "Descripción", "Precio costo", "Precio de venta"]];
    const sampleData = [
      ["PROD-001", "Zapatillas Alpha Run Pro", "Zapatillas deportivas con amortiguación reactiva y tejido transpirable.", 35000, 59990],
      ["PROD-002", "Cortaviento Trail Master", "Chaqueta impermeable ligera con bolsillos térmicos.", 18000, 29990]
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 45 },
      { wch: 15 },
      { wch: 15 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "Plantilla_Importar_Productos.xlsx");
  };

  const handleExcelImport = (file: File) => {
    if (!file) return;
    setImportProgress('reading');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          alert('El archivo no contiene filas de datos.');
          setImportProgress('error');
          return;
        }

        // Helper to parse Chilean-format prices: "$400.000" or "400.000" => 400000
        const parsePrice = (val: any): number => {
          if (typeof val === 'number') return val;
          const cleaned = String(val || '').replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
          return parseFloat(cleaned) || 0;
        };

        const parsedProducts = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || row.length === 0) continue;
          
          const sku = String(row[0] || '').trim();
          const name = String(row[1] || '').trim();
          const description = String(row[2] || '').trim();
          const cost_price = parsePrice(row[3]);
          const price = parsePrice(row[4]);
          
          if (!name) continue;
          if (isNaN(price) || price <= 0) continue;

          parsedProducts.push({
            sku: sku || null,
            name,
            description: description || '',
            cost_price: cost_price || 0,
            price,
            stock: 999,
          });
        }

        if (parsedProducts.length === 0) {
          alert('No se encontraron filas con datos de productos válidos.');
          setImportProgress('error');
          return;
        }

        setImportProgress('uploading');
        const res = await api.post<any>('/products/bulk', { products: parsedProducts });
        
        let added = 0;
        let updated = 0;
        if (res.data) {
          res.data.forEach((r: any) => {
            if (r.action === 'created') added++;
            else if (r.action === 'updated') updated++;
          });
        } else {
          added = parsedProducts.length;
        }
        
        setImportStats({ total: parsedProducts.length, added, updated });
        setImportProgress('success');
        load();
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Error al procesar el archivo Excel');
        setImportProgress('error');
      }
    };

    reader.onerror = () => {
      setImportProgress('error');
    };

    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelImport(e.dataTransfer.files[0]);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category?.id === filterCategory;
    return matchSearch && matchCat;
  });

  const handleSort = (col: 'name' | 'price' | 'stock') => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortCol === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortCol === 'price') return (a.price - b.price) * dir;
    if (sortCol === 'stock') return ((a.stock ?? 0) - (b.stock ?? 0)) * dir;
    return 0;
  });

  const SortIcon = ({ col }: { col: 'name' | 'price' | 'stock' }) => (
    <span className="ml-1 inline-block text-xs">
      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-slate-300">↕</span>}
    </span>
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      price: '',
      stock: '',
      category_id: '',
      images: '',
      slug: '',
      is_featured: false,
      is_new: false,
      has_buy_now: true,
      technical_specs: '',
      has_shipping_info: true,
      vertical_gallery: false,
      has_zoom: true
    });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    let specsText = '';
    if (p.technical_specs && typeof p.technical_specs === 'object') {
      specsText = Object.entries(p.technical_specs)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      category_id: p.category?.id || '',
      images: p.images?.join(', ') || '',
      slug: p.slug,
      is_featured: p.is_featured || false,
      is_new: p.is_new || false,
      has_buy_now: p.has_buy_now !== false,
      technical_specs: specsText,
      has_shipping_info: p.has_shipping_info !== false,
      vertical_gallery: !!p.vertical_gallery,
      has_zoom: p.has_zoom !== false
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const specsObj: Record<string, string> = {};
      if (form.technical_specs) {
        form.technical_specs.split('\n').forEach((line) => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            if (key && val) {
              specsObj[key] = val;
            }
          }
        });
      }

      const body = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: form.category_id || null,
        images: form.images ? form.images.split(',').map((s: string) => s.trim()) : [],
        is_featured: form.is_featured,
        is_new: form.is_new,
        has_buy_now: form.has_buy_now,
        technical_specs: specsObj,
        has_shipping_info: form.has_shipping_info,
        vertical_gallery: form.vertical_gallery,
        has_zoom: form.has_zoom,
      };
      if (editing) {
        await api.patch(`/products/${editing.id}`, body);
      } else {
        await api.post('/products', body);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.patch(`/products/${id}`, { is_featured: !current });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleNew = async (id: string, current: boolean) => {
    try {
      await api.patch(`/products/${id}`, { is_new: !current });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Productos</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/products/new" className="rounded-lg bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-primary/90">
            Agregar producto
          </Link>
          <button onClick={openNew} className="rounded-lg border border-dashed border-slate-300 px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-50">
            + Rápido
          </button>
          <button 
            onClick={() => setShowImportModal(true)} 
            className="rounded-lg border border-slate-300 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            <Upload size={14} />
            Importar Excel
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm w-full sm:w-64 outline-none focus:border-primary" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="Filtrar por categoría"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary w-full sm:w-auto">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">{editing ? 'Editar' : 'Nuevo'} producto</h2>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <input type="text" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
              <input type="text" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <div className="flex gap-3">
                <input type="number" step="0.01" placeholder="Precio" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" required />
                <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                aria-label="Categoría del producto"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="URLs de imágenes (separadas por coma)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded border-slate-300" />
                  <Star className="h-4 w-4 text-amber-400" /> Destacado
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="rounded border-slate-300" />
                  <Sparkles className="h-4 w-4 text-blue-400" /> Nuevo
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Especificaciones Técnicas (Llave: Valor, uno por línea)</label>
                <textarea rows={3} placeholder="Nivel: Profesional&#10;Tacto: Duro" value={form.technical_specs} onChange={(e) => setForm({ ...form, technical_specs: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="space-y-2 border-t pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.has_buy_now} onChange={(e) => setForm({ ...form, has_buy_now: e.target.checked })} className="rounded border-slate-300" />
                  Habilitar botón "Comprar Ahora" (Express Checkout)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.has_shipping_info} onChange={(e) => setForm({ ...form, has_shipping_info: e.target.checked })} className="rounded border-slate-300" />
                  Mostrar estimación de despacho dinámico
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.vertical_gallery} onChange={(e) => setForm({ ...form, vertical_gallery: e.target.checked })} className="rounded border-slate-300" />
                  Galería vertical en escritorio (Desktop)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.has_zoom} onChange={(e) => setForm({ ...form, has_zoom: e.target.checked })} className="rounded border-slate-300" />
                  Habilitar Zoom/Lightbox de imagen
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                📥 Importar Catálogo (XLSX)
              </h2>
              <button 
                onClick={() => { setShowImportModal(false); setImportProgress('idle'); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Plantilla Base Download */}
              <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Descargar Plantilla Base</h4>
                  <p className="text-xs text-slate-500 font-medium">Descarga la estructura básica de Excel para completar tus productos.</p>
                </div>
                <button 
                  onClick={downloadTemplate}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                >
                  <Download size={14} />
                  Descargar Excel
                </button>
              </div>

              {/* Drag and drop Area */}
              {importProgress === 'idle' || importProgress === 'error' ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <Upload className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Arrastra tu archivo Excel aquí</p>
                  <p className="text-xs text-slate-400 mt-1">Soporta formatos .xlsx y .xls</p>
                  <div className="mt-4">
                    <input 
                      type="file" 
                      id="excel-file" 
                      accept=".xlsx, .xls"
                      onChange={(e) => e.target.files && handleExcelImport(e.target.files[0])}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="excel-file"
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer shadow"
                    >
                      Seleccionar Archivo
                    </label>
                  </div>
                </div>
              ) : importProgress === 'reading' || importProgress === 'uploading' ? (
                <div className="border border-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm font-bold text-slate-700">
                    {importProgress === 'reading' ? 'Leyendo archivo Excel...' : 'Subiendo productos a la base de datos...'}
                  </p>
                </div>
              ) : (
                <div className="border border-emerald-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-emerald-50/30">
                  <span className="text-4xl">🎉</span>
                  <h4 className="text-base font-bold text-emerald-800">¡Importación Completada!</h4>
                  <p className="text-xs text-emerald-600 max-w-sm">
                    Se han procesado un total de {importStats.total} productos de forma exitosa.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold py-2 px-6 rounded-lg bg-white border border-emerald-100 shadow-sm w-full max-w-xs">
                    <div className="text-center">
                      <span className="block text-slate-400 text-[10px] uppercase">Nuevos</span>
                      <span className="text-slate-800 text-lg">{importStats.added}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-slate-400 text-[10px] uppercase">Actualizados</span>
                      <span className="text-slate-800 text-lg">{importStats.updated}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setShowImportModal(false); setImportProgress('idle'); }}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow transition-all"
                  >
                    Entendido
                  </button>
                </div>
              )}

              {/* Collapsible Manual */}
              <div className="border rounded-xl bg-white">
                <button 
                  type="button"
                  onClick={() => setShowManual(!showManual)}
                  className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-slate-400" />
                    Manual del Usuario (Columnas requeridas)
                  </span>
                  {showManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showManual && (
                  <div className="p-4 border-t bg-slate-50/50 space-y-3 text-xs text-slate-600 leading-relaxed font-sans">
                    <p>La primera fila del archivo Excel debe contener los nombres exactos de los campos. A continuación el detalle de cada columna:</p>
                    <table className="w-full border-collapse border bg-white rounded-lg overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b text-[10px] text-slate-400 font-bold uppercase text-left">
                          <th className="p-2">Columna</th>
                          <th className="p-2">Campo</th>
                          <th className="p-2">Requerido</th>
                          <th className="p-2">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr>
                          <td className="p-2 font-bold font-mono">A</td>
                          <td className="p-2">SKU</td>
                          <td className="p-2 text-slate-400">Opcional</td>
                          <td className="p-2 text-slate-500">Código único de barras o inventario. Si ya existe en tu catálogo, se actualizarán los datos de ese producto en vez de duplicarlo.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-mono">B</td>
                          <td className="p-2">Nombre del producto</td>
                          <td className="p-2 text-red-500 font-bold">Sí</td>
                          <td className="p-2 text-slate-500">Nombre comercial del producto. Se generará un enlace (slug) único basado en este campo.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-mono">C</td>
                          <td className="p-2">Descripción</td>
                          <td className="p-2 text-slate-400">Opcional</td>
                          <td className="p-2 text-slate-500">Descripción detallada del artículo.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-mono">D</td>
                          <td className="p-2">Precio costo</td>
                          <td className="p-2 text-slate-400">Opcional</td>
                          <td className="p-2 text-slate-500">Costo del producto (para reportes de ganancias).</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-mono">E</td>
                          <td className="p-2">Precio de venta</td>
                          <td className="p-2 text-red-500 font-bold">Sí</td>
                          <td className="p-2 text-slate-500">El precio al público con el cual se venderá el producto en la tienda.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-500">
              <th className="px-4 py-3 font-medium">Imagen</th>
              <th className="px-4 py-3 font-medium">
                <button onClick={() => handleSort('name')} className="flex items-center hover:text-slate-800">
                  Nombre<SortIcon col="name" />
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button onClick={() => handleSort('price')} className="flex items-center hover:text-slate-800">
                  Precio<SortIcon col="price" />
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button onClick={() => handleSort('stock')} className="flex items-center hover:text-slate-800">
                  Stock<SortIcon col="stock" />
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Destacado</th>
              <th className="px-4 py-3 font-medium">Nuevo</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-slate-100" />}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3">${p.price.toLocaleString('es-CL')}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-slate-500">{p.category?.name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${p.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleFeatured(p.id, p.is_featured || false)} className="transition-colors hover:scale-110" title={p.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}>
                    <Star className={`h-5 w-5 ${p.is_featured ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleNew(p.id, p.is_new || false)} className="transition-colors hover:scale-110" title={p.is_new ? 'Quitar de nuevos' : 'Marcar como nuevo'}>
                    <Sparkles className={`h-5 w-5 ${p.is_new ? 'fill-blue-400 text-blue-400' : 'text-slate-300 hover:text-blue-300'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs text-primary hover:underline">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedFiltered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No hay productos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
