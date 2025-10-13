import Link from "next/link";
import { Instagram } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export default function Footer() {
  return (
    <footer className="bg-[#e8d2c5]">
      <div className="container py-8">
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center text-sm text-[#9a7b68]">
          <p>&copy; {new Date().getFullYear()} CalidaEscencia. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="#" aria-label="Instagram">
              <Instagram className="h-6 w-6 text-[#9a7b68]/80 hover:text-[#9a7b68] transition-colors" />
            </Link>
            <Link href="#" aria-label="WhatsApp">
              <WhatsAppIcon className="h-6 w-6 text-[#9a7b68]/80 hover:text-[#9a7b68] transition-colors" />
            </Link>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-foreground">Términos y Condiciones</Link>
            <Link href="#" className="hover:text-foreground">Política de Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
