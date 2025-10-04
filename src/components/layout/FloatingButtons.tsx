"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FloatingButtons() {
  const pathname = usePathname();
  
  // Hide floating buttons on admin routes
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/adminpanel'))) {
    return null;
  }
  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon" className="rounded-full h-14 w-14 bg-accent hover:bg-accent/90 shadow-lg">
              <Link href="#" aria-label="WhatsApp">
                <WhatsAppIcon className="h-7 w-7 text-accent-foreground" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Contáctanos en WhatsApp</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon" className="rounded-full h-14 w-14 bg-accent hover:bg-accent/90 shadow-lg">
              <Link href="#" aria-label="Instagram">
                <Instagram className="h-7 w-7 text-accent-foreground" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Síguenos en Instagram</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
