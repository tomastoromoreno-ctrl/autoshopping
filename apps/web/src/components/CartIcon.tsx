'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface CartIconProps {
  storeSubdomain: string;
}

export default function CartIcon({ storeSubdomain }: CartIconProps) {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    function updateCount() {
      const stored = localStorage.getItem(`cart_${storeSubdomain}`);
      if (stored) {
        try {
          const items = JSON.parse(stored);
          setItemCount(items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0));
        } catch {
          setItemCount(0);
        }
      } else {
        setItemCount(0);
      }
    }

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cart-updated', updateCount);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cart-updated', updateCount);
    };
  }, [storeSubdomain]);

  return (
    <Link
      href={`/store/${storeSubdomain}/cart`}
      className="relative flex items-center justify-center rounded-xl p-2 text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900"
      aria-label={`Carrito de compras${itemCount > 0 ? ` - ${itemCount} items` : ''}`}
    >
      <ShoppingBag className="h-5 w-5 transition-transform duration-200 ease-out" strokeWidth={1.75} />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm transition-all duration-300 ease-out">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
