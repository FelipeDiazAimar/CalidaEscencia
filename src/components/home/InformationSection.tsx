"use client";

import { CreditCard, Truck, Landmark, HandCoins, HelpCircle, MapPin, Shield } from "lucide-react";
import Faq from "./Faq";
import { useState, useEffect } from "react";
import { productApi } from "@/lib/api";
import type { ShippingMethod } from "@/types/database";
import * as LucideIcons from "lucide-react";

export default function InformationSection() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{title: string, subtitle: string, methods: string[]}>({
    title: 'Métodos de Pago',
    subtitle: 'Paga de forma rápida y segura.',
    methods: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(true);

  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        const response = await productApi.shippingMethods.getAll();
        if (response.success && response.data) {
          setShippingMethods(response.data);
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadPaymentMethods = async () => {
      try {
        setLoadingPayment(true);
        const response = await productApi.aboutContent.getBySection('payment');
        if (response.success && response.data) {
          const methods = Array.isArray(response.data.extra_data?.methods)
            ? response.data.extra_data.methods.filter((method: unknown): method is string => typeof method === 'string')
            : [];
          setPaymentMethods({
            title: response.data.title || 'Métodos de Pago',
            subtitle: response.data.subtitle || 'Paga de forma rápida y segura.',
            methods: methods
          });
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
      } finally {
        setLoadingPayment(false);
      }
    };

    loadShippingMethods();
    loadPaymentMethods();
  }, []);

  const getIcon = (iconName?: string) => {
    if (!iconName) return Truck;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || Truck;
  };

  return (
    <section className="pt-0 pb-10 sm:pb-16 bg-background">
      <div className="container py-10 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
          <div className="space-y-10 sm:space-y-12">
            <div>
              <h3 className="font-headline flex items-center text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
                <Truck className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground/80" />
                Detalles de Envío
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                ) : shippingMethods.length > 0 ? (
                  shippingMethods.map((method) => {
                    const IconComponent = getIcon(method.icon_name);
                    return (
                      <div key={method.id} className="flex items-start space-x-3">
                        <IconComponent className="h-5 w-5 mt-0.5 text-primary-foreground/60 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-foreground mb-1">{method.title}</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed">{method.description}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                    <p><strong>Envíos Nacionales:</strong> Entregas en todo El Salvador en 2-3 días hábiles. Costo de envío estándar de $3.50.</p>
                    <p><strong>Envíos Internacionales:</strong> Contáctanos para cotizar tu envío a cualquier parte del mundo. Los tiempos y costos varían según el destino.</p>
                    <p><strong>Empaque Seguro:</strong> Todas tus joyas se envían en un empaque seguro y elegante para garantizar que lleguen en perfectas condiciones.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-headline flex items-center text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
                <CreditCard className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground/80" />
                {paymentMethods.title}
              </h3>
              {loadingPayment ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              ) : paymentMethods.methods.length > 0 ? (
                <>
                  <p className="text-muted-foreground text-sm sm:text-base mb-3">{paymentMethods.subtitle}</p>
                  <ul className="space-y-2.5 sm:space-y-3 text-muted-foreground text-sm sm:text-base">
                    {paymentMethods.methods.map((method, index) => {
                      const getPaymentIcon = (methodText: string) => {
                        const lowerMethod = methodText.toLowerCase();
                        if (lowerMethod.includes('tarjeta') || lowerMethod.includes('crédito') || lowerMethod.includes('débito')) {
                          return CreditCard;
                        } else if (lowerMethod.includes('transferencia') || lowerMethod.includes('bancaria') || lowerMethod.includes('banco')) {
                          return Landmark;
                        } else if (lowerMethod.includes('contra entrega') || lowerMethod.includes('efectivo')) {
                          return HandCoins;
                        }
                        return CreditCard;
                      };

                      const IconComponent = getPaymentIcon(method);
                      return (
                        <li key={index} className="flex items-start">
                          <IconComponent className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" />
                          {method}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <ul className="space-y-2.5 sm:space-y-3 text-muted-foreground text-sm sm:text-base">
                  <li className="flex items-start"><CreditCard className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" /> Tarjetas de crédito/débito (pago en línea seguro).</li>
                  <li className="flex items-start"><Landmark className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" /> Transferencia bancaria (Banco Agrícola, BAC).</li>
                  <li className="flex items-start"><HandCoins className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" /> Pago contra entrega (disponible en San Salvador).</li>
                </ul>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-headline flex items-center text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
              <HelpCircle className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground/80" />
              Preguntas Frecuentes
            </h3>
            <Faq />
          </div>
        </div>
      </div>
    </section>
  );
}
