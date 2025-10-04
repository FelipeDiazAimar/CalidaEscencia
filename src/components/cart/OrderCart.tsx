"use client";
import { useState, useMemo, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Minus, Plus } from 'lucide-react';
import { cartStore, CartItem } from '@/lib/cart-store';

const shippingOptions = [
  { id: 'retira', label: 'Retiro en el local', cost: 0 },
  { id: 'moto', label: 'Envío en moto (Zona Capital)', cost: 4 },
  { id: 'correo', label: 'Correo nacional', cost: 6 },
];

const paymentMethods = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia bancaria' },
  { id: 'sinpe', label: 'SINPE' },
  { id: 'paypal', label: 'PayPal' },
];

const WHATSAPP_NUMBER = '+50300000000';

export default function OrderCart() {
  const [items, setItems] = useState<CartItem[]>(cartStore.getItems());
  const [shipping, setShipping] = useState<string>(shippingOptions[0].id);
  const [payment, setPayment] = useState<string>(paymentMethods[0].id);

  // Subscribe to store once mounted
  useEffect(() => {
    cartStore.loadOnce();
    const unsub = cartStore.subscribe(s => setItems(s.items));
    return () => { unsub(); };
  }, []);

  const shippingCost = useMemo(() => shippingOptions.find(o => o.id === shipping)?.cost ?? 0, [shipping]);
  const subtotal = useMemo(() => items.reduce((acc, i) => acc + i.qty * i.price, 0), [items]);
  const total = useMemo(() => Math.max(0, subtotal + shippingCost), [subtotal, shippingCost]);

  const removeItem = (id: string) => cartStore.remove(id);
  const updateQty = (id: string, qty: number) => cartStore.updateQty(id, Math.max(1, qty));

  const whatsappMessage = useMemo(() => {
    const lines: string[] = [];
    lines.push('Hola! Quiero realizar un pedido:');
    lines.push('');
    items.forEach(i => {
      lines.push(`• ${i.name}${i.variant ? ' - ' + i.variant : ''} x${i.qty} = $${(i.qty * i.price).toFixed(2)}`);
    });
    lines.push('');
    lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
    lines.push(`Envío (${shippingOptions.find(o => o.id === shipping)?.label}): $${shippingCost.toFixed(2)}`);
    lines.push(`Total: $${total.toFixed(2)}`);
    lines.push('');
    lines.push(`Método de pago: ${paymentMethods.find(p => p.id === payment)?.label}`);
    return encodeURIComponent(lines.join('\n'));
  }, [items, subtotal, shippingCost, total, payment, shipping]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Pedido</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          {items.length > 0 && (
            <button
              onClick={() => { cartStore.clear(); try { window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', title: 'Carrito vaciado' } })); } catch {} }}
              className="text-[11px] px-2 py-1 rounded-md border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mr-4"
            >Vaciar</button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 pr-1">
        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.id} className="rounded-lg border bg-card/50 backdrop-blur-sm p-3 flex gap-3 group transition-colors">
              <div className="h-12 w-12 rounded-md bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center text-[10px] font-medium text-muted-foreground select-none overflow-hidden">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : 'IMG'}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    {item.variant && <p className="text-[11px] text-muted-foreground">{item.variant}</p>}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="p-1 disabled:opacity-40"
                      disabled={item.qty <= 1}
                      aria-label="Disminuir"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="mx-1 tabular-nums">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="p-1"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-medium tabular-nums">${(item.qty * item.price).toFixed(2)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground border rounded-md p-6 text-center mt-6">No hay productos en el pedido.</p>
        )}
      </ScrollArea>
      <Separator className="my-4" />
      <div className="mb-4 grid gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Envío</span>
          <div className="flex flex-wrap gap-2">
            {shippingOptions.map(o => {
              const active = o.id === shipping;
              return (
                <button
                  key={o.id}
                  onClick={() => setShipping(o.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${active ? 'bg-muted/90 text-foreground border-muted-foreground/40 shadow-inner' : 'hover:border-primary/50 hover:bg-muted/40'}`}
                >
                  {o.label}{o.cost > 0 && ` +$${o.cost}`}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pago</span>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map(p => {
              const active = p.id === payment;
              return (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 ${active ? 'bg-muted/90 text-foreground border-muted-foreground/40 shadow-inner' : 'hover:border-secondary/50 hover:bg-muted/40'}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-auto space-y-2 rounded-xl border bg-background/60 backdrop-blur-sm p-4">
        <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>Envío</span><span className="tabular-nums">${shippingCost.toFixed(2)}</span></div>
        <Separator className="my-1" />
        <div className="flex justify-between text-sm font-semibold"><span>Total</span><span className="tabular-nums">${total.toFixed(2)}</span></div>
        <Button asChild size="sm" className="w-full mt-2" disabled={items.length === 0}>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-sm">
            Confirmar pedido por WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
