'use client';

import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const hasActiveFilters = selectedCategory || priceRange.min || priceRange.max || sortBy !== 'newest';

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm text-slate-600">{productCount} productos</p>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold text-slate-900">Filtros</h2>
              <button aria-label="Cerrar filtros" onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <FilterContent
                categories={categories}
                selectedCategory={selectedCategory}
                priceRange={priceRange}
                sortBy={sortBy}
                onCategoryChange={onCategoryChange}
                onPriceChange={onPriceChange}
                onSortChange={onSortChange}
                categoriesOpen={categoriesOpen}
                priceOpen={priceOpen}
                onToggleCategories={() => setCategoriesOpen(!categoriesOpen)}
                onTogglePrice={() => setPriceOpen(!priceOpen)}
              />
            </div>
            <div className="border-t p-4 space-y-2">
              <button
                onClick={() => { onApply(); setMobileOpen(false); }}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Aplicar filtros
              </button>
              <button
                onClick={() => { onClear(); setMobileOpen(false); }}
                className="w-full rounded-lg border py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Filtros</h2>
          {hasActiveFilters && (
            <button onClick={onClear} className="text-xs text-blue-600 hover:underline">
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
          categoriesOpen={categoriesOpen}
          priceOpen={priceOpen}
          onToggleCategories={() => setCategoriesOpen(!categoriesOpen)}
          onTogglePrice={() => setPriceOpen(!priceOpen)}
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
  categoriesOpen,
  priceOpen,
  onToggleCategories,
  onTogglePrice,
}: Omit<FiltersProps, 'onApply' | 'onClear' | 'productCount'> & {
  categoriesOpen: boolean;
  priceOpen: boolean;
  onToggleCategories: () => void;
  onTogglePrice: () => void;
}) {
  return (
    <div className="mt-4 space-y-6">
      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Ordenar por</label>
        <select
          aria-label="Ordenar por"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <button
          onClick={onToggleCategories}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider"
        >
          Categorías
          {categoriesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {categoriesOpen && (
          <div className="mt-2 space-y-1">
            <button
              onClick={() => onCategoryChange(null)}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                !selectedCategory ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                  selectedCategory === cat.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price range */}
      <div>
        <button
          onClick={onTogglePrice}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider"
        >
          Rango de precio
          {priceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {priceOpen && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={priceRange.min}
              onChange={(e) => onPriceChange(e.target.value, priceRange.max)}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Máx"
              value={priceRange.max}
              onChange={(e) => onPriceChange(priceRange.min, e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
