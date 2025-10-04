"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

interface ProductMinimal {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  description?: string;
  variants?: string[]; // optional variant names
  category?: string;
  subcategory?: string;
}

export default function AddToCartButton({ product }: { product: ProductMinimal }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [variant, setVariant] = useState<string | undefined>(product.variants?.[0]);
  const { addItem } = useCart();

  const add = () => setQty(q => q + 1);
  const sub = () => setQty(q => Math.max(1, q - 1));

  const handleAdd = () => {
    // Use the actual product ID from the database
    const productId = variant ? `${product.id}__${variant}` : product.id;
    
    // Debug: Log product data being added to cart
    console.log('Adding to cart - product data:', product);
    console.log('Category:', product.category);
    console.log('Subcategory:', product.subcategory);
    
    const cartItem = {
      product_id: productId,
      slug: product.slug,
      name: variant ? `${product.name} (${variant})` : product.name,
      price: product.price,
      quantity: qty,
      image: product.images?.[0],
      category: product.category,
      subcategory: product.subcategory,
    };
    
    console.log('Cart item being added:', cartItem);
    
    addItem(cartItem);

    toast({ 
      title: 'Añadido al carrito', 
      description: `${qty} × ${product.name}${variant ? ' (' + variant + ')' : ''}` 
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {product.variants && product.variants.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {product.variants.map(v => {
            const active = v === variant;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/60'}`}
              >{v}</button>
            );
          })}
        </div>
      )}
      
      {/* Mobile-only compact layout */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between rounded-full border bg-background px-3 py-2 w-auto min-w-[110px]">
              <button type="button" onClick={sub} aria-label="Disminuir" className="p-1 disabled:opacity-40" disabled={qty <= 1}>
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium tabular-nums flex-1 text-center">{qty}</span>
              <button type="button" onClick={add} aria-label="Aumentar" className="p-1">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <Button type="button" onClick={handleAdd} className="flex-1 rounded-full text-sm font-medium py-3 shadow-md hover:shadow-xl transition-all">
            {added ? <span className="flex items-center gap-1"><Check className="h-4 w-4" /> Añadido</span> : 'Añadir'}
          </Button>
        </div>
      </div>

      {/* Desktop-only full layout */}
      <div className="hidden md:flex flex-row gap-3 w-full items-center">
        <label className="text-sm font-medium text-muted-foreground">Cantidad:</label>
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between rounded-full border bg-background px-4 py-2 w-auto min-w-[160px]">
            <button type="button" onClick={sub} aria-label="Disminuir" className="p-1 disabled:opacity-40" disabled={qty <= 1}>
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-base font-medium tabular-nums flex-1 text-center">{qty}</span>
            <button type="button" onClick={add} aria-label="Aumentar" className="p-1">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Button type="button" onClick={handleAdd} className="flex-1 rounded-full text-base font-medium py-4 shadow-md hover:shadow-xl transition-all">
          {added ? <span className="flex items-center gap-2"><Check className="h-5 w-5" /> Añadido</span> : 'Añadir al pedido'}
        </Button>
      </div>
    </div>
  );
}
