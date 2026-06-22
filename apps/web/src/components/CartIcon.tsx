'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

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
      className="relative flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
