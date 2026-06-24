'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  btn_text?: string;
  bg_color?: string;
  text_color?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  storeName: string;
}

export default function BannerCarousel({ banners, storeName }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    intervalRef.current = setInterval(() => {
      goNext();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, goNext, banners.length]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setIsHovered(false);
  };

  if (!banners || banners.length === 0) {
    return (
      <section className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
        <div className="mx-auto max-w-7xl h-full flex flex-col items-center justify-center px-6 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            {storeName}
          </h2>
          <p className="text-lg sm:text-xl text-white opacity-90">
            Bienvenido a nuestra tienda
          </p>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section
      className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] rounded-2xl overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {banner.image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner.image_url})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: banner.bg_color || '#1e293b' }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-7xl h-full flex flex-col items-center justify-center px-6 py-16 text-center">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 flex flex-col items-center justify-center px-6 py-16 text-center transition-all duration-500 ${
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ color: b.text_color || '#ffffff' }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              {b.title}
            </h2>
            {b.subtitle && (
              <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-2xl">
                {b.subtitle}
              </p>
            )}
            {b.link_url && (
              <Link
                href={b.link_url}
                className="inline-flex items-center bg-white text-slate-900 rounded-full px-8 py-3 font-semibold hover:bg-gray-100 transition-all"
              >
                {b.btn_text || 'Ver más'}
              </Link>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Anterior"
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/40 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="Siguiente"
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/40 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => goTo(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-white w-8' : 'bg-white/50 w-2'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
