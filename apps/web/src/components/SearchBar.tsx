'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  subdomain?: string;
  apiUrl?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Buscar productos...', subdomain, apiUrl }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2 || !subdomain || !apiUrl) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/products/${subdomain}?search=${encodeURIComponent(q.trim())}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || data.products || [];
        setResults(items);
        setIsOpen(true);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [subdomain, apiUrl]);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      search(value);
      onSearch(value.trim());
    }, 250);
  }, [search, onSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSearch('');
  };

  const handleResultClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL').format(price);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={(e) => e.preventDefault()} className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary-500" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="store-input w-full rounded-xl bg-white py-2.5 pl-9 pr-9 text-sm font-sans outline-none transition-all duration-200 ease-out hover:border-gray-300 focus:shadow-md placeholder:text-slate-400 store-text"
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

      {/* Live results dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-100 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/store/${subdomain}/product/${product.slug}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-b-0"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-sm font-bold text-primary">${formatPrice(product.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {results.length >= 6 && (
                <button
                  onClick={() => { onSearch(query.trim()); setIsOpen(false); }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-slate-100"
                >
                  Ver todos los resultados
                </button>
              )}
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-500">No se encontraron productos</p>
              <p className="text-xs text-slate-400 mt-1">Intenta con otro término</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
