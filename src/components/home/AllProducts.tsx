"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState, useEffect } from "react";
import { productApi } from '@/lib/api';
import type { Product } from '@/types/database';

const PRODUCTS_PER_PAGE = 8;

export default function AllProducts() {
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.products.getAll();
        
        if (response.error) {
          console.error('Error loading products:', response.error);
          setError('Error al cargar los productos');
          return;
        }

        // Filter active products only
        const activeProducts = (response.data || []).filter(product => product.is_active);
        setProducts(activeProducts);
        setError(null);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const section = document.getElementById('all-products-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const generatePaginationItems = (): (number | string)[] => {
    const items: (number | string)[] = [];
    const maxVisiblePages = 5; // Maximum number of page numbers to show

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      // Calculate range around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        items.push('...');
      }

      // Add pages around current page
      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        items.push('...');
      }

      // Always show last page (if different from first)
      if (totalPages > 1) {
        items.push(totalPages);
      }
    }

    return items;
  };

  const paginationItems = generatePaginationItems();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "https://picsum.photos/900/1600?v=1";
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // If it's a relative path, you might need to prefix with your storage URL
    // For now, return the URL as is
    return imageUrl;
  };

  if (loading) {
    return (
      <div id="all-products-section" className="bg-background py-10 sm:py-16">
        <div className="container">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
              Nuestra Colección
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground px-1">
              Descubre todos nuestros productos para el hogar y el bienestar.
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="all-products-section" className="bg-background py-10 sm:py-16">
        <div className="container">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
              Nuestra Colección
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground px-1">
              Descubre todos nuestros productos para el hogar y el bienestar.
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg text-red-500">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Por favor, intenta recargar la página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div id="all-products-section" className="bg-background py-10 sm:py-16">
        <div className="container">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
              Nuestra Colección
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground px-1">
              Descubre todos nuestros productos para el hogar y el bienestar.
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No hay productos disponibles en este momento.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="all-products-section" className="bg-background py-10 sm:py-16">
      <div className="container">
        <div className="text-center mb-8 sm:mb-12 px-2">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
            Nuestra Colección
          </h2>
          <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground px-1">
            Descubre todos nuestros productos para el hogar y el bienestar.
          </p>
        </div>
      </div>
      
      {/* Grid without container for mobile full width */}
      <div className="px-0 md:container md:mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 md:gap-6">
          {paginatedProducts.map((product, index) => {
            const slug = generateSlug(product.name);
            
            // Calculate padding based on position in grid for mobile
            const isLeftColumn = index % 2 === 0; // For mobile 2-column layout
            const paddingClasses = `md:p-0 ${isLeftColumn ? 'pr-1' : 'pl-1'}`; // Only apply padding on mobile
            
            return (
              <div key={product.id} className={paddingClasses}>
                <Link href={`/public/products/${slug}`} className="block">
                  <Card className="group overflow-hidden transition-shadow duration-300 border-none bg-background shadow-none rounded-none h-full flex flex-col">
                  <CardContent className="p-0 flex-grow">
                    <div className="aspect-[9/16] overflow-hidden relative h-full">
                      <Image
                        src={getImageUrl(product.cover_image)}
                        alt={product.name}
                        width={900}
                        height={1600}
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                      />
                      <Image
                        src={getImageUrl(product.hover_image || product.cover_image)}
                        alt={`${product.name} (hover)`}
                        width={900}
                        height={1600}
                        className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    </div>
                  </CardContent>
                  <div className="py-3 sm:py-4 px-1.5 sm:px-2 bg-background">
                    <CardHeader className="p-0">
                      <CardTitle className="font-headline text-sm sm:text-xl tracking-normal text-left leading-snug line-clamp-2">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="p-0 pt-1.5 sm:pt-2 justify-start">
                      <p className="text-sm sm:text-lg font-semibold">{formatPrice(product.price)}</p>
                    </CardFooter>
                  </div>
                </Card>
              </Link>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Pagination with container */}
      <div className="container">
        <div className="mt-12 sm:mt-16">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50 disabled:pointer-events-none"
                >
                  <PaginationPrevious href="#" onClick={(e) => e.preventDefault()} />
                </button>
              </PaginationItem>
              {paginationItems.map((item, index) => (
                item === '...' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <span className="px-3 py-2 text-sm">...</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === item}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(item as number);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              ))}
              <PaginationItem>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-50 disabled:pointer-events-none"
                >
                  <PaginationNext href="#" onClick={(e) => e.preventDefault()} />
                </button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
