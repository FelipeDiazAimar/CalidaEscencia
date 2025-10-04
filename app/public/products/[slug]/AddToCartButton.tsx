"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Check } from 'lucide-react';

interface ProductMinimal {
  slug: string;
  name: string;
  price: number;
  images: string[];
  description?: string;
}

export default function AddToCartButton({ product }: { product: ProductMinimal }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [cartMounted, setCartMounted] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mounted?: boolean } | undefined;
      if (detail && typeof detail.mounted === 'boolean') setCartMounted(detail.mounted);
    };
    window.addEventListener('cart-mounted', handler as EventListener);
    return () => window.removeEventListener('cart-mounted', handler as EventListener);
  }, []);

  const add = () => setQty(q => q + 1);
  const sub = () => setQty(q => Math.max(1, q - 1));

  const handleAdd = () => {
    const payload = {
      id: product.slug,
      name: product.name,
      price: product.price,
      qty,
      image: product.images?.[0],
    };

    if (cartMounted) {
      window.dispatchEvent(new CustomEvent('add-to-cart', { detail: payload }));
    } else {
      // Fallback: update localStorage directly
      try {
        const raw = window.localStorage.getItem('absv-cart');
        const parsed = raw ? JSON.parse(raw) as any[] : [];
        const idx = parsed.findIndex(i => i.id === payload.id);
        if (idx >= 0) {
          parsed[idx].qty += payload.qty;
        } else {
          parsed.push(payload);
        }
        window.localStorage.setItem('absv-cart', JSON.stringify(parsed));
        const count = parsed.reduce((acc, i) => acc + (i.qty||0), 0);
        window.dispatchEvent(new CustomEvent('cart-state', { detail: { count } }));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('open-cart'));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="flex items-center gap-3 rounded-full border bg-background px-3 py-2 w-auto min-w-[88px]">
        <button type="button" onClick={sub} aria-label="Disminuir" className="p-1 disabled:opacity-40" disabled={qty <= 1}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-base font-medium tabular-nums">{qty}</span>
        <button type="button" onClick={add} aria-label="Aumentar" className="p-1">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button type="button" onClick={handleAdd} className="flex-1 rounded-full text-base font-medium py-6 shadow-md hover:shadow-xl transition-all">
        {added ? <span className="flex items-center gap-2"><Check className="h-5 w-5" /> Añadido</span> : 'Añadir al pedido'}
      </Button>
    </div>
  );
}
