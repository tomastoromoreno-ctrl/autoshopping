'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, Package, Grid3x3 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
  subdomain: string;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const fallbackGradients = [
  'from-pink-500 to-rose-500',
  'from-purple-600 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-violet-600 to-fuchsia-600',
];

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
        <LayoutGrid className="h-5 w-5 store-text" />
        <h2 className="text-2xl font-heading font-bold store-text">Categorías</h2>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectCategory(null)}
          className={`relative w-40 sm:w-48 h-24 sm:h-28 flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
            selectedCategory === null
              ? 'ring-2 ring-[var(--store-btn)] ring-offset-2 scale-[1.03]'
              : 'hover:shadow-md'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
          <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors duration-200" />
          <div className="relative z-10 flex flex-col items-center gap-1.5 p-3 text-center">
            <Grid3x3 className="h-5 w-5 text-white/90 drop-shadow-md" />
            <span className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md">Todos</span>
          </div>
        </motion.button>

        {categories.map((category, i) => {
          const gradient = fallbackGradients[i % fallbackGradients.length];
          const isSelected = selectedCategory === category.id;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(category.id)}
              className={`relative w-40 sm:w-48 h-24 sm:h-28 flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
                isSelected
                  ? 'ring-2 ring-[var(--store-btn)] ring-offset-2 scale-[1.03]'
                  : 'hover:shadow-md'
              }`}
            >
              {category.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}
              <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors duration-200" />
              <div className="relative z-10 flex flex-col items-center gap-1.5 p-3 text-center">
                <Package className="h-5 w-5 text-white/90 drop-shadow-md" />
                <span className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md line-clamp-2">
                  {category.name}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
