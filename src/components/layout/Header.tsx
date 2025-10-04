"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, ChevronLeft, ChevronDown, Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import CartButton from "@/components/cart/CartButton";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { cn } from "@/lib/utils";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { api } from '@/lib/api/products';
import type { Category, Subcategory } from '@/types/database';

// Fallback data in case API fails
const fallbackProductCategories: Record<string, string[]> = {
  "Aros": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
  "Collares": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
  "Anillos": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
  "Pulseras": ["Acero quirúrgico", "Acero blanco", "Acero dorado", "Plata 925"],
  "Piercings": ["Titanio", "Acero quirúrgico", "Oro blanco", "Plata"],
  "Accesorios": ["Varios materiales", "Acero inoxidable", "Aleaciones"],
};

const singleProductLinks: { title: string; href: string; description: string; }[] = [
  // Removed Piercings and Accesorios as they are already in productCategories
];

const navLinks = [
  { href: "/public/about", label: "Sobre Nosotros" },
  { href: "/public/gallery", label: "Nuestros Clientes" },
  { href: "/public/materials", label: "Materiales" },
  { href: "/public/contact", label: "Contacto" },
];

export default function Header() {
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductsExpanded, setMobileProductsExpanded] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  
  // New states for dynamic categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [productCategories, setProductCategories] = useState<Record<string, string[]>>(fallbackProductCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const productsButtonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load categories and subcategories from API
  useEffect(() => {
    const loadCategoriesData = async () => {
      setIsLoadingCategories(true);
      try {
        console.log('🔄 Loading categories and subcategories...');
        
        // Load categories and subcategories in parallel
        const [categoriesResponse, subcategoriesResponse] = await Promise.all([
          api.categories.getAll(),
          api.subcategories.getAll()
        ]);

        console.log('📋 Categories response:', categoriesResponse);
        console.log('📋 Subcategories response:', subcategoriesResponse);

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
          console.log('✅ Categories loaded:', categoriesResponse.data);
        }

        if (subcategoriesResponse.success && subcategoriesResponse.data) {
          setSubcategories(subcategoriesResponse.data);
          console.log('✅ Subcategories loaded:', subcategoriesResponse.data);
        }

        // Build the productCategories structure
        if (categoriesResponse.success && subcategoriesResponse.success && 
            categoriesResponse.data && subcategoriesResponse.data) {
          
          const categoryMap: Record<string, string[]> = {};
          
          categoriesResponse.data.forEach(category => {
            const categorySubcategories = subcategoriesResponse.data!
              .filter(sub => sub.category_id === category.id)
              .map(sub => sub.name);
            
            categoryMap[category.name] = categorySubcategories;
            console.log(`📂 Category "${category.name}" has subcategories:`, categorySubcategories);
          });

          console.log('🗂️ Final categoryMap:', categoryMap);

          // Only update if we have data, otherwise keep fallback
          if (Object.keys(categoryMap).length > 0) {
            setProductCategories(categoryMap);
            console.log('✅ ProductCategories updated with database data');
          } else {
            console.log('⚠️ No categories found, keeping fallback data');
          }
        }
      } catch (error) {
        console.error('❌ Error loading categories:', error);
        // Keep fallback data on error
      } finally {
        setIsLoadingCategories(false);
        console.log('🏁 Categories loading finished');
      }
    };

    loadCategoriesData();
  }, []);
  
  // Log state changes
  useEffect(() => {
    console.log('🔄 showCategories state changed to:', showCategories);
  }, [showCategories]);
  
  // Check if we're in admin panel
  const isAdminPanel = pathname?.startsWith('/admin');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const performSearch = () => {
    const value = searchQuery.trim();
    console.log('🔍 Performing search with value:', value);
    
    if (!value) {
      setIsSearchOpen(false);
      return;
    }
    
    // Check for admin access (case insensitive)
    if (value.toLowerCase() === 'admin') {
      console.log('🚀 Admin detected, redirecting to /admin');
      router.push('/admin');
    } else {
      console.log('🔍 Regular search, redirecting to search page');
      router.push(`/public/search?q=${encodeURIComponent(value)}`);
    }
    
    setIsSearchOpen(false);
    setSearchQuery(''); // Clear search after navigating
  };

  useEffect(() => {
    console.log('🚀 Component mounted, setting isClient to true');
    setIsClient(true);
  }, []);

  const handleProductsToggle = (e: React.MouseEvent) => {
    console.log('🖱️ =========================');
    console.log('🖱️ Button clicked!');
    console.log('🖱️ Current showCategories state:', showCategories);
    console.log('🖱️ Event type:', e.type);
    
    e.preventDefault();
    e.stopPropagation();
    
    if (showCategories) {
      console.log('🖱️ Categories are OPEN, attempting to CLOSE');
      setShowCategories(false);
    } else {
      console.log('🖱️ Categories are CLOSED, attempting to OPEN');
      setShowCategories(true);  
    }
    console.log('🖱️ =========================');
  };

  useEffect(() => { 
    console.log('🛣️ Pathname changed to:', pathname);
    if (isSearchOpen) {
      console.log('🛣️ Closing search due to pathname change');
      setIsSearchOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container relative flex h-16 md:h-20 items-center">
          {/* Mobile: Hamburger menu */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-transparent">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              
              {/* Admin Panel Sidebar Toggle - only visible in admin */}
              {isAdminPanel && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-transparent"
                  onClick={() => {
                    // Trigger sidebar toggle for admin panel
                    const event = new CustomEvent('admin-sidebar-toggle');
                    window.dispatchEvent(event);
                  }}
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              )}
              <SheetContent side="left" className="w-80 p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r" hideClose>
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <SheetDescription className="sr-only">Navegación principal del sitio</SheetDescription>
                <div className="flex flex-col h-full">
                  {/* Header with logo */}
                  <div className="flex items-center justify-center p-4 border-b relative">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                      <img src="/logo.png" alt="Algo Bonito SV" className="h-8" />
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:bg-transparent absolute right-4"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Navigation content */}
                  <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {/* Productos section - expandable */}
                      <div>
                        <button
                          onClick={() => setMobileProductsExpanded(!mobileProductsExpanded)}
                          className="w-full flex items-center justify-between p-3 text-left font-medium hover:bg-muted/50 rounded-md transition-colors"
                          aria-expanded={mobileProductsExpanded}
                        >
                          <span>Productos</span>
                          <ChevronDown 
                            className={`h-3 w-3 transition-transform ${mobileProductsExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                        
                        {mobileProductsExpanded && (
                          <div className="ml-4 mt-2 space-y-2">
                            {/* View all products - moved to top */}
                            <Link
                              href="/public/products"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block p-2 text-sm font-medium text-black hover:bg-muted/30 rounded-md transition-colors"
                            >
                              Ver todos los productos
                            </Link>
                            
                            {/* Category buttons */}
                            {Object.entries(productCategories).map(([category, subcategories]) => {
                              const categorySlug = category.toLowerCase().replace(/\s/g, '-');
                              const isExpanded = mobileExpandedCategory === category;
                              
                              return (
                                <div key={category}>
                                  <button
                                    onClick={() => setMobileExpandedCategory(isExpanded ? null : category)}
                                    className="w-full flex items-center justify-between p-2 text-left text-sm hover:bg-muted/30 rounded-md transition-colors"
                                    aria-expanded={isExpanded}
                                  >
                                    <span>{category}</span>
                                    <ChevronDown 
                                      className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                  </button>
                                  
                                  {isExpanded && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      <Link
                                        href={`/public/products?category=${categorySlug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block p-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-md transition-colors"
                                      >
                                        Ver todos los {category.toLowerCase()}
                                      </Link>
                                      {subcategories.map((subcategory) => (
                                        <Link
                                          key={subcategory}
                                          href={`/public/products?category=${categorySlug}&material=${subcategory.toLowerCase().replace(/\s/g, '-')}`}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                          className="block p-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-md transition-colors"
                                        >
                                          {subcategory}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Single product links */}
                            {singleProductLinks.map((item) => (
                              <Link
                                key={item.title}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block p-2 text-sm hover:bg-muted/30 rounded-md transition-colors"
                              >
                                {item.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Regular navigation links */}
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block p-3 font-medium hover:bg-muted/50 rounded-md transition-colors ${
                            pathname?.startsWith(link.href) ? 'bg-muted/50 text-foreground' : 'text-foreground/80'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </nav>
                  
                  {/* Social media footer */}
                  <div className="border-t p-4">
                    <div className="flex items-center justify-center gap-4 text-foreground/70">
                      <a href="https://www.instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/>
                        </svg>
                      </a>
                      <a href="https://www.facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.99H8.9V12h1.6V9.8c0-1.58.94-2.46 2.38-2.46.69 0 1.41.12 1.41.12v1.55h-.8c-.79 0-1.04.49-1.04 1V12h1.77l-.28 2.88h-1.5v6.99A10 10 0 0 0 22 12"/>
                        </svg>
                      </a>
                      <a href="https://www.tiktok.com" aria-label="TikTok" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13.5 3a7.5 7.5 0 0 0 .11 1.3 4.8 4.8 0 0 0 3.39 3.73 8 8 0 0 1-.06 1.5 6.3 6.3 0 0 1-3.06-.9v5.07a5.7 5.7 0 1 1-5-5.66v2.05a3.67 3.67 0 1 0 2.55 3.5V3h2.07Z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: Logo */}
          <div className="hidden md:flex flex-1 md:flex-none">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Algo Bonito SV" className="h-12" />
            </Link>
          </div>

          {/* Absolute centered mobile logo */}
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Algo Bonito SV" className="h-10" />
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 ml-auto">
            {/* Desktop nav (categories + links) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                ref={productsButtonRef}
                onClick={handleProductsToggle}
                aria-expanded={showCategories}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "bg-transparent flex items-center gap-1",
                  showCategories ? "text-foreground" : "text-foreground/60"
                )}
              >
                <span>Productos</span>
                <svg
                  className={cn("h-4 w-4 transition-transform duration-200", showCategories && "rotate-180")}
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.64645 6.64645C4.84171 6.45118 5.15829 6.45118 5.35355 6.64645L8 9.29289L10.6464 6.64645C10.8417 6.45118 11.1583 6.45118 11.3536 6.64645C11.5488 6.84171 11.5488 7.15829 11.3536 7.35355L8.35355 10.3536C8.15829 10.5488 7.84171 10.5488 7.64645 10.3536L4.64645 7.35355C4.45118 7.15829 4.45118 6.84171 4.64645 6.64645Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <NavigationMenu>
                <NavigationMenuList>
                  {navLinks.map(link => (
                    <NavigationMenuItem key={link.label}>
                      <NavigationMenuLink
                        href={link.href}
                        className={cn(navigationMenuTriggerStyle(), "bg-transparent", {
                          "text-foreground": pathname && pathname.startsWith(link.href),
                          "text-foreground/60": pathname && !pathname.startsWith(link.href)
                        })}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:bg-transparent">
              <Search className="h-5 w-5" />
              <span className="sr-only">Abrir búsqueda</span>
            </Button>
            <Button variant="ghost" size="icon" className="relative hover:bg-transparent" aria-label="Pedido" onClick={() => setIsCartOpen(true)}>
              <BagIcon />
              <CartBadge />
              <span className="sr-only">Pedido</span>
            </Button>
            {/* Back button hidden on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-transparent hidden md:inline-flex"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Button>
          </div>
        </div>
        {isSearchOpen && (
          <div className="absolute left-0 right-0 pb-4 w-full flex justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
            <div className="relative w-full max-w-xl mt-4 px-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar productos..."
                  className="pl-10 w-full border-none shadow-none focus-visible:ring-0 focus-visible:outline-none bg-background/70 backdrop-blur"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
              <Button 
                onClick={performSearch}
                disabled={!searchQuery.trim()}
                size="sm"
                className="px-4"
              >
                Buscar
              </Button>
            </div>
          </div>
        )}
      </header>
      {/* Desktop categories overlay */}
      {isClient && showCategories && (
        <div
          ref={categoriesRef}
          className="w-full fixed left-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-xl border-b z-40 flex flex-col items-center transition-colors"
          style={{ top: 'calc(var(--announcement-bar-height, 0px) + 5rem)' }}
        >
          <button
            onClick={() => {
              console.log('❌ Closing categories via X button');
              setShowCategories(false);
            }}
            aria-label="Cerrar categorías"
            className="absolute top-2 right-3 p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full flex justify-center mt-6 mb-1 pb-4 border-b">
            <Link href="/public/products" className="font-bold text-lg hover:underline" onClick={() => {
              console.log('🔗 Closing categories via "Ver todos los productos" link');
              setShowCategories(false);
            }}>
              Ver todos los productos
            </Link>
          </div>
          <div className="flex flex-row gap-8 min-h-[300px] px-8 py-6 items-start pb-16">
            {Object.entries(productCategories).map(([category, subcategories]) => (
              <div key={category} className="flex flex-col w-32">
                <Link
                  href={`/public/products?category=${category.toLowerCase().replace(/\s/g, '-')}`}
                  className="font-headline font-bold text-lg mb-4 text-left w-full hover:text-foreground/80 transition-colors"
                  onClick={() => {
                    console.log('🔗 Closing categories via category link:', category);
                    setShowCategories(false);
                  }}
                >
                  {category}
                </Link>
                <ul className="space-y-1">
                  {subcategories.map(subcategory => (
                    <li key={subcategory}>
                      <Link
                        href={`/public/products?category=${category.toLowerCase().replace(/\s/g, '-')}&material=${subcategory.toLowerCase().replace(/\s/g, '-')}`}
                        className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          console.log('🔗 Closing categories via subcategory link:', subcategory);
                          setShowCategories(false);
                        }}
                      >
                        {subcategory}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {singleProductLinks.map((item) => (
              <div key={item.title} className="flex flex-col w-32 -mt-4">
                <Link
                  href={item.href}
                  className="flex flex-1 items-center justify-between py-4 font-headline font-bold text-lg hover:underline transition-all text-left w-full"
                  onClick={() => {
                    console.log('🔗 Closing categories via single product link:', item.title);
                    setShowCategories(false);
                  }}
                >
                  {item.title}
                </Link>
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 right-4 flex items-center gap-4 text-foreground/70">
            <a href="https://www.instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>
            </a>
            <a href="https://www.facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.87v-6.99H8.9V12h1.6V9.8c0-1.58.94-2.46 2.38-2.46.69 0 1.41.12 1.41.12v1.55h-.8c-.79 0-1.04.49-1.04 1V12h1.77l-.28 2.88h-1.5v6.99A10 10 0 0 0 22 12"/></svg>
            </a>
            <a href="https://www.tiktok.com" aria-label="TikTok" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 3a7.5 7.5 0 0 0 .11 1.3 4.8 4.8 0 0 0 3.39 3.73 8 8 0 0 1-.06 1.5 6.3 6.3 0 0 1-3.06-.9v5.07a5.7 5.7 0 1 1-5-5.66v2.05a3.67 3.67 0 1 0 2.55 3.5V3h2.07Z"/></svg>
            </a>
          </div>
        </div>
      )}
      <CartOpenListener onOpen={() => setIsCartOpen(true)} />
      {isClient && showCategories && <OutsideCategoriesCloser 
        targetRef={categoriesRef} 
        productsButtonRef={productsButtonRef}
        onClose={() => {
          console.log('👆 Closing categories via outside click');
          setShowCategories(false);
        }} 
      />}
      
      {/* New Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}

function CartBadge() {
  const { itemCount } = useCart();
  
  if (itemCount <= 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center animate-in fade-in zoom-in">
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  );
}

function CartOpenListener({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-cart', handler);
    return () => window.removeEventListener('open-cart', handler);
  }, [onOpen]);
  return null;
}

function OutsideCategoriesCloser({ 
  targetRef, 
  productsButtonRef, 
  onClose 
}: { 
  targetRef: React.RefObject<HTMLElement>; 
  productsButtonRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void; 
}) {
  useEffect(() => {
    function handlePointer(e: MouseEvent | TouchEvent) {
      console.log('👆 Outside click detected, target:', e.target);
      const el = targetRef.current;
      const buttonEl = productsButtonRef.current;
      
      if (!el) {
        console.log('👆 No targetRef element found');
        return;
      }
      
      // Check if click is on the products button or inside the categories area
      if (e.target instanceof Node) {
        const isInsideCategories = el.contains(e.target);
        const isOnProductsButton = buttonEl && (buttonEl.contains(e.target) || buttonEl === e.target);
        
        if (isOnProductsButton) {
          console.log('👆 Click is on products button, ignoring');
          return;
        }
        
        if (!isInsideCategories) {
          console.log('👆 Click is outside categories area, closing');
          onClose();
        } else {
          console.log('👆 Click is inside categories area, not closing');
        }
      }
    }
    function handleKey(e: KeyboardEvent) { 
      if (e.key === 'Escape') {
        console.log('⌨️ Escape key pressed, closing categories');
        onClose(); 
      }
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [targetRef, onClose]);
  return null;
}

function BagIcon() {
  return (
    <span className="relative inline-flex items-center justify-center h-7 w-7">
      <img
        src="/bag.png"
        alt="Carrito"
        className="h-7 w-7 object-contain"
        loading="lazy"
        decoding="async"
      />
      <span className="sr-only">Carrito</span>
    </span>
  );
}


