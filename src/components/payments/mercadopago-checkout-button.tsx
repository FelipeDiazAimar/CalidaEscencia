"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/products";

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

interface PreferenceResponse {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
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
  const [preference, setPreference] = useState<PreferenceResponse | null>(null);
  const [walletReady, setWalletReady] = useState(false);

  const environment = process.env.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT?.toLowerCase() ?? "sandbox";
  const preferSandboxCheckout = environment !== "production";
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const currencyId = process.env.NEXT_PUBLIC_MERCADOPAGO_CURRENCY_ID ?? "ARS";

  useEffect(() => {
    if (!publicKey) {
      setError("Falta configurar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY");
      return;
    }

    if (!(window as any).__mp_initialized) {
      try {
        initMercadoPago(publicKey, { locale: "es-AR" });
        (window as any).__mp_initialized = true;
      } catch (err) {
        console.error("Error inicializando Mercado Pago:", err);
        setError("No se pudo inicializar Mercado Pago en el navegador");
      }
    }
  }, [publicKey]);

  const handleCheckout = async () => {
    if (!items?.length) {
      setError("El carrito está vacío");
      return;
    }

    if (!publicKey) {
      setError("Falta configurar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreference(null);
    setWalletReady(false);

    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            ...item,
            currency_id: item.currency_id ?? currencyId,
          })),
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

      const preferenceResponse = await response.json();

      if (!preferenceResponse?.id) {
        throw new Error("No se recibió el ID de la preferencia de Mercado Pago");
      }

      setPreference(preferenceResponse);
      setWalletReady(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!walletReady && (
        <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
          {isLoading ? "Generando preferencia…" : label}
        </Button>
      )}

      {walletReady && preference?.id && !error && (
        <div className="space-y-2">
          <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
            Seleccioná tu medio de pago en Mercado Pago.
          </div>
          <Wallet
            key={preference.id}
            initialization={{ preferenceId: preference.id }}
            onError={(err) => {
              console.error("Wallet error", err);
              setError("No se pudo renderizar el checkout de Mercado Pago");
            }}
          />
          {(preference.init_point || preference.sandbox_init_point) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const fallbackUrl = (!preferSandboxCheckout && preference.init_point)
                  ? preference.init_point
                  : preference.sandbox_init_point ?? preference.init_point;

                if (!fallbackUrl) {
                  setError("No hay una URL alternativa disponible");
                  return;
                }

                window.open(fallbackUrl, "_blank");
              }}
            >
              Abrir checkout en ventana externa
            </Button>
          )}
        </div>
      )}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {walletReady
            ? "El botón oficial de Mercado Pago abrirá la ventana para elegir el medio de pago."
            : "Se generará una preferencia y luego podrás elegir el medio de pago."}
        </p>
      )}
    </div>
  );
}
