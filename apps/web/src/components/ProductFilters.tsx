'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  priceRange: { min: string; max: string };
  sortBy: string;
  onCategoryChange: (categoryId: string | null) => void;
  onPriceChange: (min: string, max: string) => void;
  onSortChange: (sort: string) => void;
  onApply: () => void;
  onClear: () => void;
  productCount: number;
}

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name_asc', label: 'A - Z' },
  { value: 'name_desc', label: 'Z - A' },
];

export default function ProductFilters({
  categories,
  selectedCategory,
  priceRange,
  sortBy,
  onCategoryChange,
  onPriceChange,
  onSortChange,
  onApply,
  onClear,
  productCount,
}: FiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveFilters = selectedCategory || priceRange.min || priceRange.max || sortBy !== 'newest';

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="flex items-center gap-3 lg:hidden">
        <p className="text-sm text-slate-500 font-medium">{productCount} productos</p>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:border-gray-300"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary-500" />
          )}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-85 max-w-[85vw] bg-white shadow-soft-xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-slate-900">Filtros</h2>
              <button
                aria-label="Cerrar filtros"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-400 transition-all duration-200 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <FilterContent
                categories={categories}
                selectedCategory={selectedCategory}
                priceRange={priceRange}
                sortBy={sortBy}
                onCategoryChange={onCategoryChange}
                onPriceChange={onPriceChange}
                onSortChange={onSortChange}
              />
            </div>
            <div className="border-t border-gray-100 px-6 py-4 space-y-3">
              <button
                onClick={() => { onApply(); setMobileOpen(false); }}
                className="w-full rounded-2xl bg-primary-600 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-700 active:scale-[0.98] shadow-soft"
              >
                Aplicar filtros
              </button>
              <button
                onClick={() => { onClear(); setMobileOpen(false); }}
                className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Filtros</h2>
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
        <FilterContent
          categories={categories}
          selectedCategory={selectedCategory}
          priceRange={priceRange}
          sortBy={sortBy}
          onCategoryChange={onCategoryChange}
          onPriceChange={onPriceChange}
          onSortChange={onSortChange}
        />
      </div>
    </>
  );
}

function FilterContent({
  categories,
  selectedCategory,
  priceRange,
  sortBy,
  onCategoryChange,
  onPriceChange,
  onSortChange,
}: Omit<FiltersProps, 'onApply' | 'onClear' | 'productCount'>) {
  return (
    <div className="space-y-7">
      {/* Sort */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ordenar por</label>
        <div className="relative">
          <select
            aria-label="Ordenar por"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-gray-200 bg-white text-slate-900 px-4 py-3 pr-10 text-sm font-medium outline-none transition-all duration-200 shadow-soft hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Categorías</h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
              !selectedCategory
                ? 'bg-primary-50 text-primary-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
              !selectedCategory
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300'
            }`}>
              {!selectedCategory && <Check className="h-3 w-3 text-white" />}
            </span>
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedCategory === cat.id && <Check className="h-3 w-3 text-white" />}
              </span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rango de precio</h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              type="number"
              placeholder="Mín"
              value={priceRange.min}
              onChange={(e) => onPriceChange(e.target.value, priceRange.max)}
              className="w-full rounded-2xl border border-gray-200 bg-white text-slate-900 pl-7 pr-3 py-3 text-sm font-medium outline-none transition-all duration-200 shadow-soft hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 placeholder:text-slate-400"
            />
          </div>
          <span className="text-slate-300 font-medium">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              type="number"
              placeholder="Máx"
              value={priceRange.max}
              onChange={(e) => onPriceChange(priceRange.min, e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white text-slate-900 pl-7 pr-3 py-3 text-sm font-medium outline-none transition-all duration-200 shadow-soft hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}