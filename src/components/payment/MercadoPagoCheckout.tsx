"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import type { CartItem } from '@/types/database';

interface MercadoPagoCheckoutProps {
  items: CartItem[];
  total: number;
  customerName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export default function MercadoPagoCheckout({ 
  items, 
  total, 
  customerName, 
  onSuccess, 
  onError 
}: MercadoPagoCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!customerName.trim()) {
      onError?.('Por favor, ingrese su nombre');
      return;
    }

    if (items.length === 0) {
      onError?.('El carrito está vacío');
      return;
    }

    setIsLoading(true);

    try {
      // Crear la preferencia de pago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.product_id,
            title: item.name,
            unit_price: item.price,
            quantity: item.quantity,
            currency_id: 'USD', // Cambiar según tu moneda
          })),
          payer: {
            name: customerName,
          },
          metadata: {
            customer_name: customerName,
            order_total: total,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la preferencia de pago');
      }

      const preference: PaymentPreference = await response.json();

      // Redirigir a Mercado Pago
      // En desarrollo usa sandbox_init_point, en producción usa init_point
      const paymentUrl = process.env.NODE_ENV === 'development' 
        ? preference.sandbox_init_point 
        : preference.init_point;

      window.location.href = paymentUrl;

    } catch (error) {
      console.error('Error processing payment:', error);
      onError?.(error instanceof Error ? error.message : 'Error al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Pago con Mercado Pago</h3>
        </div>
        
        <div className="space-y-2 text-sm text-blue-700">
          <p>✓ Tarjetas de crédito y débito</p>
          <p>✓ Transferencias bancarias</p>
          <p>✓ Pago en efectivo (puntos de pago)</p>
          <p>✓ Compra protegida</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Total a pagar:</span>
          <span className="text-xl font-bold text-green-600">
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Cliente: {customerName}</p>
          <p>Artículos: {items.reduce((sum, item) => sum + item.quantity, 0)}</p>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading || !customerName.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar con Mercado Pago
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Al hacer clic en "Pagar con Mercado Pago" serás redirigido a la plataforma 
        segura de Mercado Pago para completar tu pago.
      </p>
    </div>
  );
}