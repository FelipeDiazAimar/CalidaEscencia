"use client";

import { useEffect, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import type { CartItem } from '@/types/database';

interface MercadoPagoCheckoutProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  shippingLabel?: string;
  paymentSurcharge?: number;
  total: number;
  customerName: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface PaymentPreference {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

const mpEnvironment =
  process.env.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT?.toLowerCase() ?? 'sandbox';
const preferSandboxCheckout = mpEnvironment !== 'production';

export default function MercadoPagoCheckout({ 
  items, 
  subtotal,
  shippingCost,
  shippingLabel,
  paymentSurcharge = 0,
  total, 
  customerName, 
  paymentMethod = 'mercadopago',
  deliveryMethod = 'entrega',
  onSuccess, 
  onError 
}: MercadoPagoCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preference, setPreference] = useState<PaymentPreference | null>(null);
  const [mpError, setMpError] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const currencyId = process.env.NEXT_PUBLIC_MERCADOPAGO_CURRENCY_ID ?? 'ARS';

  useEffect(() => {
    if (!publicKey) {
      setMpError('No se encontró la clave pública de Mercado Pago (NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY).');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const globalWindow = window as typeof window & { __mp_initialized?: boolean };

    if (!globalWindow.__mp_initialized) {
      try {
        initMercadoPago(publicKey, { locale: 'es-AR' });
        globalWindow.__mp_initialized = true;
      } catch (error) {
        console.error('Error inicializando Mercado Pago:', error);
        setMpError('No se pudo inicializar Mercado Pago en el navegador.');
      }
    }
  }, [publicKey]);

  const walletPreferenceId = preference?.id ?? null;

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
  setMpError(null);

    try {
      const computedShippingLabel = shippingLabel ?? 'Envío';
      const normalizedSurcharge = Number(paymentSurcharge.toFixed(2));

      // Primero guardar la orden en la base de datos
      const orderData = {
        customer_name: customerName,
        customer_phone: '+503 0000-0000', // Placeholder ya que no pedimos teléfono
        customer_email: '', // Opcional
        payment_method: paymentMethod,
        shipping_method: deliveryMethod,
        shipping_cost: shippingCost,
        payment_surcharge: normalizedSurcharge,
        total_amount: total,
        notes: `Método de entrega: ${computedShippingLabel}.`,
        metadata: {
          subtotal,
          shipping_label: computedShippingLabel,
          payment_surcharge: normalizedSurcharge,
        },
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        }))
      };

      // Guardar orden en la base de datos
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error('Error al crear la orden: ' + orderResult.error);
      }

      const orderId = orderResult.data?.id;

      // Crear la lista de items para Mercado Pago, incluyendo envío y recargo
      const preferenceItems = [
        ...items.map(item => ({
          id: item.product_id,
          title: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          currency_id: currencyId,
        })),
        ...(shippingCost > 0
          ? [{
              id: 'shipping',
              title: `Envío - ${computedShippingLabel}`,
              unit_price: Number(shippingCost.toFixed(2)),
              quantity: 1,
              currency_id: currencyId,
            }]
          : []),
        ...(normalizedSurcharge > 0
          ? [{
              id: 'mercadopago_surcharge',
              title: 'Recargo Mercado Pago (10%)',
              unit_price: normalizedSurcharge,
              quantity: 1,
              currency_id: currencyId,
            }]
          : []),
      ];

      // Crear la preferencia de pago con el ID de la orden como referencia externa
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: preferenceItems,
          payer: {
            name: customerName,
          },
          metadata: {
            customer_name: customerName,
            order_total: total,
            subtotal,
            shipping_cost: shippingCost,
            shipping_label: computedShippingLabel,
            payment_surcharge: normalizedSurcharge,
            order_id: orderId,
          },
          external_reference: orderId, // Usar el ID de la orden como referencia externa
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la preferencia de pago');
      }

      const preferenceResponse: PaymentPreference = await response.json();

      if (!preferenceResponse.id) {
        throw new Error('La respuesta de Mercado Pago no incluyó un ID de preferencia');
      }

      setPreference(preferenceResponse);

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
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío ({shippingLabel ?? 'Envío'})</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          {paymentSurcharge > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Recargo Mercado Pago (10%)</span>
              <span>${paymentSurcharge.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-medium">Total a pagar:</span>
            <span className="text-xl font-bold text-green-600">
              ${total.toFixed(2)}
            </span>
          </div>
          <div>
            <p>Cliente: {customerName}</p>
            <p>Artículos: {items.reduce((sum, item) => sum + item.quantity, 0)}</p>
          </div>
        </div>
      </div>

      {!walletPreferenceId && (
        <Button
          onClick={handlePayment}
          disabled={isLoading || !customerName.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando preferencia...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Generar checkout de Mercado Pago
            </>
          )}
        </Button>
      )}

      {walletPreferenceId && !mpError && (
        <div className="space-y-2">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Elegí tu método de pago seguro haciendo clic en el botón de Mercado Pago. Se abrirá una ventana donde podés iniciar sesión o pagar como invitado.
            </p>
          </div>
          <Wallet
            key={walletPreferenceId}
            initialization={{ preferenceId: walletPreferenceId }}
            onError={(error) => {
              console.error('Wallet error:', error);
              setMpError('No se pudo renderizar el checkout de Mercado Pago.');
            }}
          />
          {(preference?.init_point || preference?.sandbox_init_point) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const fallbackUrl = (!preferSandboxCheckout && preference?.init_point)
                  ? preference?.init_point
                  : preference?.sandbox_init_point ?? preference?.init_point;

                if (!fallbackUrl) {
                  onError?.('No se encontró una URL de checkout alternativa.');
                  return;
                }

                window.open(fallbackUrl, '_blank');
              }}
            >
              Abrir checkout en nueva pestaña (opcional)
            </Button>
          )}
        </div>
      )}

      {mpError && (
        <p className="text-sm text-destructive text-center">{mpError}</p>
      )}

      {!walletPreferenceId && (
        <p className="text-xs text-gray-500 text-center">
          Al hacer clic en "Generar checkout" se abrirá el botón oficial de Mercado Pago para elegir tu medio de pago.
        </p>
      )}
    </div>
  );
}