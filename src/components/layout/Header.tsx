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
  { href: "/public/contact", label: "Contacto" },
];

export default function Header() {
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

  useEffect(() => { 
    console.log('🛣️ Pathname changed to:', pathname);
    if (isSearchOpen) {
      console.log('🛣️ Closing search due to pathname change');
      setIsSearchOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchOpen) {
        const target = event.target as Element;
        const searchArea = document.querySelector('[data-search-area]');
        const searchButton = document.querySelector('[data-search-button]');
        
        if (searchArea && !searchArea.contains(target) && searchButton && !searchButton.contains(target)) {
          setIsSearchOpen(false);
        }
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-[#e8d2c5] backdrop-blur supports-[backdrop-filter]:bg-[#e8d2c5] relative">
        <div className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="hover:bg-transparent !h-14 !w-14 p-0">
                <Menu size={20} className="text-[#9a7b68]" style={{ width: '20px', height: '20px' }} />
                <span className="sr-only">Abrir menú de navegación</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent side="left" className="w-80 p-0 bg-[#e8d2c5]/70 backdrop-blur supports-[backdrop-filter]:bg-[#e8d2c5]/70 border-r" hideClose>
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
                            className={`h-5 w-5 transition-transform ${mobileProductsExpanded ? 'rotate-180' : ''}`}
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
                                      className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                    </div>
                  </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="container relative flex h-16 md:h-20 items-center pl-12">

          {/* Desktop: Logo - centered */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Algo Bonito SV" className="h-12" />
            </Link>
          </div>

          {/* Absolute centered mobile logo */}
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Algo Bonito SV" className="h-10" />
            </Link>
          </div>

        </div>
        {/* Right side buttons - positioned absolutely at the right */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:bg-transparent" data-search-button>
              <Search className="!h-5 !w-5 text-[#9a7b68]" />
              <span className="sr-only">Abrir búsqueda</span>
            </Button>
            <Button variant="ghost" className="hover:bg-transparent !h-[30px] !w-[30px] p-0 relative" aria-label="Pedido" onClick={() => setIsCartOpen(true)}>
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
              <ChevronLeft className="!h-5 !w-5 text-[#9a7b68]" />
              <span className="sr-only">Volver</span>
            </Button>
        </div>
        {isSearchOpen && (
          <div className="absolute left-0 right-0 pb-4 w-full flex justify-center bg-[#e8d2c5] backdrop-blur supports-[backdrop-filter]:bg-[#e8d2c5] border-b z-50" data-search-area>
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
      <CartOpenListener onOpen={() => setIsCartOpen(true)} />
      
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

function BagIcon() {
  return (
    <span className="relative inline-flex items-center justify-center h-[30px] w-[30px] translate-y-[2px]">
      <img
        src="/bag.png"
        alt="Carrito"
        className="h-[30px] w-[30px] object-contain"
        loading="lazy"
        decoding="async"
      />
      <span className="sr-only">Carrito</span>
    </span>
  );
}


