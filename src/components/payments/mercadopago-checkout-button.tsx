"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MercadoPagoItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  description?: string;
  picture_url?: string;
}

export interface MercadoPagoPayer {
  name?: string;
  email?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
}

interface CheckoutButtonProps {
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  metadata?: Record<string, unknown>;
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  notificationUrl?: string;
  externalReference?: string;
  className?: string;
  label?: string;
}

export function MercadoPagoCheckoutButton({
  items,
  payer,
  metadata,
  backUrls,
  notificationUrl,
  externalReference,
  className,
  label = "Pagar con Mercado Pago",
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!items?.length) {
      setError("El carrito está vacío");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          payer,
          metadata,
          back_urls: backUrls,
          notification_url: notificationUrl,
          external_reference: externalReference,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo iniciar el pago");
      }

      const preference = await response.json();
      const redirectUrl = preference.init_point ?? preference.sandbox_init_point;

      if (!redirectUrl) {
        throw new Error("No se recibió la URL de checkout");
      }

      window.location.href = redirectUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
        {isLoading ? "Redirigiendo…" : label}
      </Button>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Serás redirigido al checkout seguro de Mercado Pago.
        </p>
      )}
    </div>
  );
}
