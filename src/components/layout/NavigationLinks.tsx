"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

// Slugify function for consistent URL generation
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const productCategories = {
    "Aros": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
    "Collares": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
    "Anillos": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
    "Pulseras": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
}

const singleProductLinks = [
    { title: "Piercings", href: "/public/products/piercings", description: "Ver todos los piercings" },
    { title: "Accesorios", href: "/public/products/accesorios", description: "Ver todos los accesorios" },
]

const navLinks = [
  { href: "/about", label: "Sobre Nosotros" },
  { href: "/gallery", label: "Nuestros Clientes" },
  { href: "/materials", label: "Materiales" },
  { href: "/contact", label: "Contacto" },
];

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SheetTitle className="sr-only">Menú principal</SheetTitle>
              <SheetDescription className="sr-only">Lista de enlaces de navegación principales del sitio.</SheetDescription>
              <Link href="/" className="flex items-center" onClick={() => setSheetOpen(false)}>
                <span className="font-bold font-headline text-xl tracking-wide">
                  Algo Bonito SV
                </span>
              </Link>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col space-y-3">
                    <Link href="/public/products" className="text-lg">Productos</Link>
                    {navLinks.map(({ href, label }) => (
                        <Link
                          key={label}
                          href={href}
                          onClick={() => setSheetOpen(false)}
                          className="text-lg"
                        >
                          {label}
                        </Link>
                      ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
           <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold font-headline text-lg tracking-wide">
              Algo Bonito SV
            </span>
          </Link>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold font-headline text-xl tracking-wide">
              Algo Bonito SV
            </span>
          </Link>
        </div>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-2">
          <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger 
            className={cn(navigationMenuTriggerStyle(), "bg-transparent", {
              "text-foreground": pathname?.startsWith("/products"),
              "text-foreground/60": !(pathname?.startsWith("/products")),
            })}
                    >
                      Productos
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid grid-cols-5 gap-4 p-4 w-full">
              <div className="col-span-5 mb-4 pb-4 border-b">
                <NavigationMenuLink href="/public/products" className="font-bold text-lg hover:underline">
                Ver todos los productos
                </NavigationMenuLink>
              </div>
                          {Object.entries(productCategories).map(([category, subcategories]) => (
                <div key={category} className="flex flex-col">
                  <NavigationMenuLink href={`/public/products?category=${slugify(category)}`} className="font-headline font-bold text-lg mb-2 hover:underline">
                  {category}
                  </NavigationMenuLink>
                                  <ul className="space-y-1">
                                      {subcategories.map(subcategory => (
                                          <li key={subcategory}>
                        <NavigationMenuLink href={`/public/products?category=${slugify(category)}&material=${slugify(subcategory)}`} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {subcategory}
                        </NavigationMenuLink>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                           <div className="flex flex-col col-span-1 grid grid-cols-1 gap-4">
                              {singleProductLinks.map((item) => (
                                  <div key={item.title}>
                    <NavigationMenuLink href={item.href} className="font-headline font-bold text-lg mb-2 hover:underline">
                    {item.title}
                    </NavigationMenuLink>
                                      <p className="font-body text-sm text-muted-foreground">
                                        {item.description}
                                      </p>
                                  </div>
                              ))}
                          </div>
                      </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                {navLinks.map(({ href, label }) => (
                  <NavigationMenuItem key={label}>
                    <NavigationMenuLink
                      href={href}
                      className={cn(navigationMenuTriggerStyle(), "bg-transparent", {
                        "text-foreground": pathname?.startsWith(href),
                        "text-foreground/60": !(pathname?.startsWith(href))
                      })}
                    >
                      {label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
            </NavigationMenuList>
          </NavigationMenu>

          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Abrir búsqueda</span>
          </Button>
          <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Shopping Cart</span>
          </Button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="container pb-4 absolute w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="pl-9 w-full"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}