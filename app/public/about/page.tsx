'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { api } from '@/lib/api/products';
import type { AboutContent, ShippingMethod } from '@/types/database';
import * as LucideIcons from "lucide-react";

export default function AboutPage() {
  const [aboutSections, setAboutSections] = useState<AboutContent[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Datos fallback por si no hay contenido en admin
  const fallbackData = {
    hero: {
      title: 'Sobre Nosotros',
      subtitle: 'Conoce la historia detrás de cada joya.',
    },
    mission: {
      title: 'Nuestra Misión',
      content: 'En Calida Escencia, creemos que la joyería es más que un simple accesorio; es una forma de expresión, un recuerdo y una celebración de los momentos especiales de la vida. Nacimos en el corazón de El Salvador con la misión de crear piezas atemporales y de alta calidad que te acompañen en tu día a día.\n\nCada una de nuestras joyas es diseñada y elaborada con una meticulosa atención al detalle, utilizando materiales nobles como el oro, la plata de ley y piedras preciosas. Nos inspiramos en la belleza de lo simple y en la elegancia de lo minimalista para ofrecerte diseños que perduren en el tiempo.\n\nSomos más que una marca; somos una comunidad de amantes de la belleza y el buen gusto. Gracias por ser parte de nuestra historia.',
      image_url: 'https://picsum.photos/600/800'
    },
    payment: {
      title: 'Paga con total seguridad y comodidad',
      subtitle: 'Ofrecemos múltiples métodos de pago para que elijas el que mejor se adapte a ti. Todas las transacciones son 100% seguras.',
      extra_data: {
        methods: [
          'Tarjetas de Crédito/Débito',
          'Transferencia Bancaria',
          'Pago Contra Entrega (San Salvador)'
        ]
      }
    },
    returns: {
      title: 'Tu satisfacción es nuestra prioridad',
      subtitle: 'Queremos que ames tus joyas. Si por alguna razón no estás completamente satisfecha, te facilitamos el proceso de cambio o devolución.',
      extra_data: {
        policy: {
          title: 'Política de Cambios y Devoluciones',
          rules: [
            'Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.',
            'La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.',
            'Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.',
            'Para iniciar el proceso, simplemente contáctanos con tu número de orden.'
          ]
        }
      }
    }
  };

  useEffect(() => {
    const loadAboutContent = async () => {
      try {
        const response = await api.aboutContent.getAll();
        if (response.success && response.data) {
          setAboutSections(response.data);
        }
      } catch (error) {
        console.error('Error loading about content:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadShippingMethods = async () => {
      try {
        const response = await api.shippingMethods.getAll();
        if (response.success && response.data) {
          setShippingMethods(response.data);
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error);
      }
    };

    loadAboutContent();
    loadShippingMethods();
  }, []);

  const getSection = (type: string) => {
    const adminSection = aboutSections.find(section => section.section_type === type && section.is_active);
    return adminSection || (fallbackData[type as keyof typeof fallbackData] as any);
  };

  const heroSection = getSection('hero') as AboutContent;
  const missionSection = getSection('mission') as AboutContent;
  const paymentSection = getSection('payment') as AboutContent;
  const returnsSection = getSection('returns') as AboutContent;

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || null;
  };

  if (loading) {
    return (
      <div className="bg-background">
        <div className="container py-12 sm:py-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4 max-w-md mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded max-w-lg mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="container pt-16 md:pt-20 pb-12 md:pb-16 px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6" style={{ paddingTop: "48px" }}>
            {heroSection?.title || 'Sobre Nosotros'}
          </h1>
          <p className="mt-2 md:mt-4 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground px-4 md:px-0">
            {heroSection?.subtitle || 'Conoce la historia detrás de cada joya.'}
          </p>
          
          {/* Imagen hero eliminada. La imagen intercambiable estará solo en la misión. */}
        </div>
      </div>

      {/* Mission Section */}
      <div className="relative py-32 md:py-40 mb-24 md:mb-32 overflow-hidden rounded-3xl">
        <Image
          src={missionSection?.background_image_url || "https://picsum.photos/800/600"}
          alt="Fondo de misión"
          fill
          className="object-cover blur-sm"
          quality={100}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container text-center text-white px-4 md:px-6" style={{ paddingTop: "30px", paddingBottom: "30px", marginBottom: "0px" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">
              {missionSection?.title || 'Nuestra Misión'}
            </h2>
            <div className="space-y-4 md:space-y-6 text-base md:text-lg leading-relaxed">
              {missionSection?.content ? (
                missionSection.content.split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="max-w-3xl mx-auto">{paragraph}</p>
                ))
              ) : (
                <>
                  <p className="max-w-3xl mx-auto">
                    En Calida Escencia, creemos que la joyería es más que un simple accesorio; es una forma de expresión, un recuerdo y una celebración de los momentos especiales de la vida. Nacimos en el corazón de El Salvador con la misión de crear piezas atemporales y de alta calidad que te acompañen en tu día a día.
                  </p>
                  <p className="max-w-3xl mx-auto">
                    Cada una de nuestras joyas es diseñada y elaborada con una meticulosa atención al detalle, utilizando materiales nobles como el oro, la plata de ley y piedras preciosas. Nos inspiramos en la belleza de lo simple y en la elegancia de lo minimalista para ofrecerte diseños que perduren en el tiempo.
                  </p>
                  <p className="max-w-3xl mx-auto">
                    Somos más que una marca; somos una comunidad de amantes de la belleza y el buen gusto. Gracias por ser parte de nuestra historia.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Methods Section */}
      <div className="container py-20 md:py-28">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4 md:mb-6" style={{ marginTop: "30px" }}>
            Información de Envío
          </h2>
          <p className="mt-2 md:mt-4 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
            Conoce nuestros métodos de envío y cómo recibir tus joyas de forma segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {shippingMethods.length > 0 ? (
            shippingMethods.map((method) => {
              const IconComponent = getIcon(method.icon_name);
              return (
                <div key={method.id} className="bg-card border border-border rounded-lg p-6 md:p-8 text-center hover:shadow-lg transition-shadow">
                  {IconComponent && (
                    <IconComponent className="mx-auto h-8 w-8 md:h-10 md:w-10 mb-4" style={{ color: "rgba(232, 210, 197, var(--tw-bg-opacity, 1))" }} />
                  )}
                  <h3 className="font-headline text-lg md:text-xl font-semibold mb-3 text-foreground">
                    {method.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {method.description}
                  </p>
                </div>
              );
            })
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
                <div className="h-8 w-8 md:h-10 md:w-10 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded mb-1 animate-pulse"></div>
                <div className="h-3 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
                <div className="h-8 w-8 md:h-10 md:w-10 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded mb-1 animate-pulse"></div>
                <div className="h-3 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
                <div className="h-8 w-8 md:h-10 md:w-10 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded mb-1 animate-pulse"></div>
                <div className="h-3 bg-muted rounded animate-pulse"></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="container py-12 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4 md:mb-6">
            {paymentSection?.title || 'Métodos de Pago'}
          </h2>
          <p className="mt-2 md:mt-4 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
            {paymentSection?.subtitle || 'Ofrecemos múltiples métodos de pago para que elijas el que mejor se adapte a ti. Todas las transacciones son 100% seguras.'}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border p-6 md:p-8" style={{ borderRadius: "9999px" }}>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {(paymentSection?.extra_data?.methods || ['Tarjetas de Crédito/Débito', 'Transferencia Bancaria', 'Pago Contra Entrega (San Salvador)']).map((method: string, index: number) => (
                <div key={index} className="bg-primary text-primary-foreground py-3 md:py-4 px-6 md:px-8 rounded-full font-medium shadow-sm text-sm md:text-base text-center">
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Returns Section */}
      <div className="container py-12 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4 md:mb-6">
            {returnsSection?.title || 'Política de Cambios y Devoluciones'}
          </h2>
          <p className="mt-2 md:mt-4 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
            {returnsSection?.subtitle || 'Queremos que ames tus joyas. Si por alguna razón no estás completamente satisfecha, te facilitamos el proceso de cambio o devolución.'}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h3 className="font-headline text-lg md:text-xl font-semibold mb-6 text-center text-foreground">
              {returnsSection?.extra_data?.policy?.title || 'Política de Cambios y Devoluciones'}
            </h3>
            <ul className="space-y-4">
              {(returnsSection?.extra_data?.policy?.rules || [
                'Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.',
                'La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.',
                'Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.',
                'Para iniciar el proceso, simplemente contáctanos con tu número de orden.'
              ]).map((rule: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground text-sm md:text-base leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
