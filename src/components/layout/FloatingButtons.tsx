"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
            <Button asChild size="icon" className="rounded-full h-14 w-14 bg-[#25d366] hover:bg-[#25d366]/90 shadow-lg">
              <Link href="https://wa.me/5493564366523" aria-label="WhatsApp">
                <WhatsAppIcon className="h-7 w-7 text-white" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Contáctanos en WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
