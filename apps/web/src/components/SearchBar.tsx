'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Buscar productos...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary-500" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white text-slate-900 py-2.5 pl-9 pr-9 text-sm font-sans outline-none transition-all duration-200 ease-out hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:shadow-md placeholder:text-slate-400"
      />
      {query && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-400 transition-all duration-200 hover:bg-slate-200 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}
