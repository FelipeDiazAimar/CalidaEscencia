
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/layout/FloatingButtons";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { CartProvider } from "@/contexts/CartContext";

const metadata: Metadata = {
  title: "Algo Bonito SV - Joyería Exclusiva",
  description: "Descubre joyería elegante y minimalista. Hecho a mano en El Salvador.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={metadata.description || ''} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground antialiased overflow-x-hidden">
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <main>{children}</main>
          <FloatingButtons />
          <Footer />
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
