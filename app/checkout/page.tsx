'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MercadoPagoCheckoutButton, MercadoPagoItem } from '@/components/payments/mercadopago-checkout-button';
import { cartStore, CartItem } from '@/lib/cart-store';
import { Trash2, Minus, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const shippingOptions = [
  { id: 'retira', label: 'Retiro en el local', cost: 0 },
  { id: 'moto', label: 'Envío en moto (Zona Capital)', cost: 4 },
  { id: 'correo', label: 'Correo nacional', cost: 6 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState<string>('retira');
  const [isProcessing, setIsProcessing] = useState(false);
  const currencyId = process.env.NEXT_PUBLIC_MERCADOPAGO_CURRENCY_ID ?? 'ARS';

  useEffect(() => {
    cartStore.loadOnce();
    const unsub = cartStore.subscribe(s => setItems(s.items));
    return () => { unsub(); };
  }, []);

  const shippingCost = shippingOptions.find(o => o.id === shipping)?.cost ?? 0;
  const subtotal = items.reduce((acc, i) => acc + i.qty * i.price, 0);
  const total = Math.max(0, subtotal + shippingCost);

  const mercadoPagoItems: MercadoPagoItem[] = [
    ...items.map(item => ({
      id: item.id,
      title: item.variant ? `${item.name} - ${item.variant}` : item.name,
      quantity: item.qty,
      unit_price: item.price,
      currency_id: currencyId,
      description: item.variant || undefined,
    })),
    ...(shippingCost > 0 ? [{
      id: 'shipping',
      title: shippingOptions.find(o => o.id === shipping)?.label || 'Envío',
      quantity: 1,
      unit_price: shippingCost,
      currency_id: currencyId,
      description: 'Costo de envío',
    }] : [])
  ];

  const updateQty = (id: string, qty: number) => {
    cartStore.updateQty(id, Math.max(1, qty));
  };

  const removeItem = (id: string) => {
    cartStore.remove(id);
  };

  const handlePaymentSuccess = () => {
    setIsProcessing(false);
    // El redirect se maneja automáticamente por Mercado Pago
  };

  const handlePaymentError = () => {
    setIsProcessing(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
              <p className="text-muted-foreground mb-6">
                Agrega algunos productos antes de proceder al checkout.
              </p>
              <Button asChild>
                <Link href="/public/products">Ver productos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/public/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuar comprando
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carrito */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tu pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">IMG</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">{item.variant}</p>
                      )}
                      <p className="text-sm font-medium">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        disabled={item.qty <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.qty}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.qty * item.price).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Opciones de envío */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Opciones de envío</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label key={option.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={option.id}
                          checked={shipping === option.id}
                          onChange={(e) => setShipping(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <Badge variant="secondary">${option.cost.toFixed(2)}</Badge>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen y pago */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Envío</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <MercadoPagoCheckoutButton
                    items={mercadoPagoItems}
                  />
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  Serás redirigido al checkout seguro de Mercado Pago
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}