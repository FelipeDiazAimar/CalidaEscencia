import ContactForm from '@/components/contact/ContactForm';
import { Button } from '@/components/ui/button';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { Instagram, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="bg-background">
      <div className="container py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight">
              Contáctanos
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              ¿Tienes alguna pregunta o un proyecto en mente? Nos encantaría saber de ti.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-24 items-start">
            <div className="space-y-8" style={{ paddingRight: "20px" }}>
              <h2 className="font-headline text-2xl">Envíanos un mensaje</h2>
              <ContactForm />
            </div>
            <div className="space-y-8" style={{ paddingLeft: "20px" }}>
              <h2 className="font-headline text-2xl">O encuéntranos en redes</h2>
              <p className="text-muted-foreground">
                Para una respuesta más rápida o para ver nuestras últimas creaciones, síguenos en nuestras redes sociales.
              </p>
              <p className="text-muted-foreground" style={{ paddingBottom: "20px" }}>
              </p>
              <div className="flex flex-col space-y-4">
                <Button asChild size="lg" variant="outline">
                  <Link href="#">
                    <MessageCircle className="mr-3 h-5 w-5" />
                    Chatea en WhatsApp
                  </Link>
                </Button>
                 <Button asChild size="lg" variant="outline">
                  <Link href="#">
                    <Instagram className="mr-3 h-5 w-5" />
                    Síguenos en Instagram
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
