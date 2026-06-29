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
    }, 4000);

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
      <section       className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.25),0_4px_12px_rgb(0,0,0,0.15)] ring-1 ring-black/5">
        <div className="mx-auto max-w-7xl h-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
            {storeName}
          </h2>
          <p className="text-sm sm:text-base text-white opacity-90">
            Bienvenido a nuestra tienda
          </p>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section
      className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.25),0_4px_12px_rgb(0,0,0,0.15)] ring-1 ring-black/5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {banner.image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner.image_url})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: banner.bg_color || '#1e293b' }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-7xl h-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 text-center">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 text-center transition-all duration-500 ${
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ color: b.text_color || '#ffffff' }}
          >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-heading font-bold mb-1 sm:mb-2">
              {b.title}
            </h2>
            {b.subtitle && (
              <p className="text-xs sm:text-sm lg:text-base opacity-90 mb-3 sm:mb-4 max-w-lg">
                {b.subtitle}
              </p>
            )}
            {b.link_url && (
              <Link
                href={b.link_url}
                className="inline-flex items-center bg-white/90 text-slate-900 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold hover:bg-white transition-all"
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
            className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/40 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            aria-label="Siguiente"
            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/40 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => goTo(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-white w-5 sm:w-6' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
