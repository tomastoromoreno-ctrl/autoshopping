'use client';

import { LayoutGrid, Package, Grid3x3 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
  subdomain: string;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryShowcase({
  categories,
  subdomain,
  selectedCategory,
  onSelectCategory,
}: CategoryShowcaseProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-slate-700" />
        <h2 className="text-2xl font-heading font-bold text-slate-900">Categorías</h2>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex min-w-[120px] sm:min-w-[140px] flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
            selectedCategory === null
              ? 'border-primary-500 bg-primary-50 shadow-soft scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-soft'
          }`}
        >
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <Grid3x3 className="h-6 w-6 text-slate-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Todos</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`flex min-w-[120px] sm:min-w-[140px] flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
              selectedCategory === category.id
                ? 'border-primary-500 bg-primary-50 shadow-soft scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-soft'
            }`}
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <Package className="h-6 w-6 text-slate-600" />
            </div>
            <span className="text-sm font-semibold text-slate-900">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
