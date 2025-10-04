import { CreditCard, Truck, Landmark, HandCoins, HelpCircle } from "lucide-react";
import Faq from "./Faq";

export default function InformationSection() {
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
              <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                <p><strong>Envíos Nacionales:</strong> Entregas en todo El Salvador en 2-3 días hábiles. Costo de envío estándar de $3.50.</p>
                <p><strong>Envíos Internacionales:</strong> Contáctanos para cotizar tu envío a cualquier parte del mundo. Los tiempos y costos varían según el destino.</p>
                <p><strong>Empaque Seguro:</strong> Todas tus joyas se envían en un empaque seguro y elegante para garantizar que lleguen en perfectas condiciones.</p>
              </div>
            </div>

            <div>
              <h3 className="font-headline flex items-center text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
                <CreditCard className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground/80" />
                Métodos de Pago
              </h3>
              <ul className="space-y-2.5 sm:space-y-3 text-muted-foreground text-sm sm:text-base">
                <li className="flex items-start"><CreditCard className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" /> Tarjetas de crédito/débito (pago en línea seguro).</li>
                <li className="flex items-start"><Landmark className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" /> Transferencia bancaria (Banco Agrícola, BAC).</li>
                <li className="flex items-start"><HandCoins className="mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground/60" /> Pago contra entrega (disponible en San Salvador).</li>
              </ul>
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
