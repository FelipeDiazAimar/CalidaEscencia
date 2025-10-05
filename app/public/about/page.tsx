'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { CreditCard, Truck, Gem, ShieldCheck, Gift } from "lucide-react";
import { api } from '@/lib/api/products';
import type { AboutContent } from '@/types/database';

export default function AboutPage() {
  const [aboutSections, setAboutSections] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Datos fallback por si no hay contenido en admin
  const fallbackData = {
    hero: {
      title: 'Sobre Nosotros',
      subtitle: 'Conoce la historia detrás de cada joya.',
    },
    mission: {
      title: 'Nuestra Misión',
      content: 'En Algo Bonito SV, creemos que la joyería es más que un simple accesorio; es una forma de expresión, un recuerdo y una celebración de los momentos especiales de la vida. Nacimos en el corazón de El Salvador con la misión de crear piezas atemporales y de alta calidad que te acompañen en tu día a día.\n\nCada una de nuestras joyas es diseñada y elaborada con una meticulosa atención al detalle, utilizando materiales nobles como el oro, la plata de ley y piedras preciosas. Nos inspiramos en la belleza de lo simple y en la elegancia de lo minimalista para ofrecerte diseños que perduren en el tiempo.\n\nSomos más que una marca; somos una comunidad de amantes de la belleza y el buen gusto. Gracias por ser parte de nuestra historia.',
      image_url: 'https://picsum.photos/600/800'
    },
    shipping: {
      title: 'Envíos a todo el país y más allá',
      subtitle: 'Llevamos nuestras joyas hasta la puerta de tu casa. Rápido, seguro y con el cuidado que tus piezas merecen.',
      background_image_url: 'https://picsum.photos/1200/400?v=60',
      extra_data: {
        national: {
          title: 'Envíos Nacionales (El Salvador)',
          delivery_time: '2-3 días hábiles',
          cost: '$3.50 tarifa estándar',
          packaging: 'Tus joyas viajan seguras en nuestro empaque de regalo'
        },
        international: {
          title: 'Envíos Internacionales',
          description: '¿Vives fuera de El Salvador? ¡No hay problema! Contáctanos directamente por WhatsApp para cotizar tu envío a cualquier parte del mundo.'
        }
      }
    },
    payment: {
      title: 'Paga con total seguridad y comodidad',
      subtitle: 'Ofrecemos múltiples métodos de pago para que elijas el que mejor se adapte a ti. Todas las transacciones son 100% seguras.',
      background_image_url: 'https://picsum.photos/1200/400?v=61',
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
      background_image_url: 'https://picsum.photos/1200/400?v=62',
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

    loadAboutContent();
  }, []);

  const getSection = (type: string) => {
    const adminSection = aboutSections.find(section => section.section_type === type && section.is_active);
    return adminSection || (fallbackData[type as keyof typeof fallbackData] as any);
  };

  const heroSection = getSection('hero') as AboutContent;
  const missionSection = getSection('mission') as AboutContent;
  const shippingSection = getSection('shipping') as AboutContent;
  const paymentSection = getSection('payment') as AboutContent;
  const returnsSection = getSection('returns') as AboutContent;

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

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center mb-16 md:mb-20">
          <div className="order-2 md:order-1">
            {missionSection?.image_url && (
              <Image 
                src={missionSection.image_url}
                alt="Fundadora de Algo Bonito SV"
                width={600}
                height={800}
                className="rounded-lg shadow-lg object-cover aspect-[3/4] w-full"
              />
            )}
            {!missionSection?.image_url && (
              <Image 
                src="https://picsum.photos/600/800"
                alt="Fundadora de Algo Bonito SV"
                width={600}
                height={800}
                className="rounded-lg shadow-lg object-cover aspect-[3/4] w-full"
              />
            )}
          </div>
          <div className="space-y-4 md:space-y-6 text-base md:text-lg text-muted-foreground order-1 md:order-2 ml-0 md:ml-8 px-4 md:px-0">
            <h2 className="font-headline text-2xl md:text-3xl text-foreground mb-4 md:mb-6">
              {missionSection?.title || 'Nuestra Misión'}
            </h2>
            {missionSection?.content ? (
              missionSection.content.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="leading-relaxed">{paragraph}</p>
              ))
            ) : (
              <>
                <p className="leading-relaxed">
                  En Algo Bonito SV, creemos que la joyería es más que un simple accesorio; es una forma de expresión, un recuerdo y una celebración de los momentos especiales de la vida. Nacimos en el corazón de El Salvador con la misión de crear piezas atemporales y de alta calidad que te acompañen en tu día a día.
                </p>
                <p className="leading-relaxed">
                  Cada una de nuestras joyas es diseñada y elaborada con una meticulosa atención al detalle, utilizando materiales nobles como el oro, la plata de ley y piedras preciosas. Nos inspiramos en la belleza de lo simple y en la elegancia de lo minimalista para ofrecerte diseños que perduren en el tiempo.
                </p>
                <p className="leading-relaxed">
                  Somos más que una marca; somos una comunidad de amantes de la belleza y el buen gusto. Gracias por ser parte de nuestra historia.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Service Sections */}
      <div className="space-y-0 mt-12 md:mt-16">
        {/* Shipping Section */}
        <section className="relative py-16 md:py-24 overflow-hidden mt-8 md:mt-12">
          <Image 
            src={shippingSection?.background_image_url || "https://picsum.photos/1200/400?v=60"}
            alt="Mapa de envíos"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="container relative text-white text-center z-10 px-4 md:px-6">
            <Truck className="mx-auto h-12 w-12 md:h-16 md:w-16 mb-4 md:mb-6 mt-4 md:mt-8" />
            <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 px-4 md:px-0">
              {shippingSection?.title || 'Envíos a todo el país y más allá'}
            </h2>
            <p className="max-w-3xl mx-auto text-base md:text-lg mb-8 md:mb-12 leading-relaxed px-4 md:px-0">
              {shippingSection?.subtitle || 'Llevamos nuestras joyas hasta la puerta de tu casa. Rápido, seguro y con el cuidado que tus piezas merecen.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mt-6 md:mt-8 mb-6 md:mb-8 px-4 md:px-0">
              <div className="bg-white/15 backdrop-blur-sm p-6 md:p-8 rounded-lg text-left">
                <h3 className="font-bold text-lg md:text-xl mb-3 md:mb-4 text-white">
                  {shippingSection?.extra_data?.national?.title || 'Envíos Nacionales (El Salvador)'}
                </h3>
                <div className="space-y-2 text-white/90 text-sm md:text-base">
                  <p><strong>Tiempo de entrega:</strong> {shippingSection?.extra_data?.national?.delivery_time || '2-3 días hábiles'}</p>
                  <p><strong>Costo:</strong> {shippingSection?.extra_data?.national?.cost || '$3.50 tarifa estándar'}</p>
                  <p><strong>Empaque:</strong> {shippingSection?.extra_data?.national?.packaging || 'Tus joyas viajan seguras en nuestro empaque de regalo'}</p>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm p-6 md:p-8 rounded-lg text-left">
                <h3 className="font-bold text-lg md:text-xl mb-3 md:mb-4 text-white">
                  {shippingSection?.extra_data?.international?.title || 'Envíos Internacionales'}
                </h3>
                <p className="text-white/90 leading-relaxed text-sm md:text-base">
                  {shippingSection?.extra_data?.international?.description || '¿Vives fuera de El Salvador? ¡No hay problema! Contáctanos directamente por WhatsApp para cotizar tu envío a cualquier parte del mundo.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="relative py-16 md:py-24 overflow-hidden mt-8 md:mt-12">
          <Image 
            src={paymentSection?.background_image_url || "https://picsum.photos/1200/400?v=61"}
            alt="Métodos de pago seguros"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/85" />
          <div className="container relative text-primary-foreground text-center z-10 px-4 md:px-6">
            <CreditCard className="mx-auto h-12 w-12 md:h-16 md:w-16 mb-4 md:mb-6 mt-4 md:mt-8" style={{ color: 'white' }} />
            <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 px-4 md:px-0">
              {paymentSection?.title || 'Paga con total seguridad y comodidad'}
            </h2>
            <p className="max-w-3xl mx-auto text-base md:text-lg mb-8 md:mb-12 leading-relaxed px-4 md:px-0">
              {paymentSection?.subtitle || 'Ofrecemos múltiples métodos de pago para que elijas el que mejor se adapte a ti. Todas las transacciones son 100% seguras.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-base md:text-lg px-4 md:px-0 mb-8">
              {(paymentSection?.extra_data?.methods || ['Tarjetas de Crédito/Débito', 'Transferencia Bancaria', 'Pago Contra Entrega (San Salvador)']).map((method: string, index: number) => (
                <span key={index} className="bg-primary-foreground text-gray-800 py-2 md:py-3 px-4 md:px-6 rounded-full font-medium shadow-sm text-sm md:text-base">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Returns Section */}
        <section className="relative py-16 md:py-24 overflow-hidden mt-8 md:mt-12">
          <Image 
            src={returnsSection?.background_image_url || "https://picsum.photos/1200/400?v=62"}
            alt="Empaque de regalo"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="container relative text-white text-center z-10 px-4 md:px-6">
            <Gift className="mx-auto h-12 w-12 md:h-16 md:w-16 mb-4 md:mb-6 mt-4 md:mt-8" />
            <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 px-4 md:px-0">
              {returnsSection?.title || 'Tu satisfacción es nuestra prioridad'}
            </h2>
            <p className="max-w-3xl mx-auto text-base md:text-lg mb-8 md:mb-12 leading-relaxed px-4 md:px-0">
              {returnsSection?.subtitle || 'Queremos que ames tus joyas. Si por alguna razón no estás completamente satisfecha, te facilitamos el proceso de cambio o devolución.'}
            </p>
            <div className="bg-white/15 backdrop-blur-sm p-6 md:p-10 rounded-lg max-w-3xl mx-auto text-left mt-6 md:mt-8 mb-6 md:mb-8 mx-4 md:mx-auto">
              <h3 className="font-bold text-lg md:text-xl mb-4 md:mb-6 text-white text-center">
                {returnsSection?.extra_data?.policy?.title || 'Política de Cambios y Devoluciones'}
              </h3>
              <ul className="space-y-3 md:space-y-4 text-white/90">
                {(returnsSection?.extra_data?.policy?.rules || [
                  'Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.',
                  'La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.',
                  'Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.',
                  'Para iniciar el proceso, simplemente contáctanos con tu número de orden.'
                ]).map((rule: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 bg-white/20 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-white mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-sm md:text-base">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
