'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { ProductsControlsClient } from "@/components/products/ProductsControlsClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { productApi } from '@/lib/api/products_safe';
import { toast } from 'sonner';

const PRODUCTS_PER_PAGE = 12;

// Map material names from URL to database  
const materialMapping: Record<string, string> = {
  'acero-quirurgico': 'Acero quirúrgico',
  'acero-blanco': 'Acero blanco',
  'acero-dorado': 'Acero dorado', 
  'plata-925': 'Plata 925'
};

function ProductsContent() {
  const searchParams = useSearchParams();

  // Slugify function - same as in FiltersBarClient
  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // State management
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Get URL parameters
  const categoryParam = searchParams?.get('category') || '';
  const materialParam = searchParams?.get('material') || '';
  const sortParam = searchParams?.get('sort') || '';
  const pageParam = searchParams?.get('page') || '1';
  const minPriceParam = searchParams?.get('minPrice') || '';
  const maxPriceParam = searchParams?.get('maxPrice') || '';

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Filter products when parameters change
  useEffect(() => {
    filterProducts();
  }, [products, categories, subcategories, categoryParam, materialParam, sortParam, minPriceParam, maxPriceParam]);

  // Update page when pageParam changes
  useEffect(() => {
    const page = parseInt(pageParam);
    setCurrentPage(isNaN(page) || page < 1 ? 1 : page);
  }, [pageParam]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
        productApi.products.getAll(),
        productApi.categories.getAll(),
        productApi.subcategories.getAll()
      ]);

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (subcategoriesRes.success && subcategoriesRes.data) {
        setSubcategories(subcategoriesRes.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (categoryParam) {
      // Find category by name (case insensitive, using same slugify as URL generation)
      const category = categories.find(c => 
        c.name.toLowerCase() === categoryParam.toLowerCase() ||
        slugify(c.name) === categoryParam.toLowerCase()
      );
      if (category) {
        filtered = filtered.filter(p => p.category_id === category.id);
      }
    }

    // Filter by material/subcategory
    if (materialParam) {
      // First try with material mapping
      let materialName = materialMapping[materialParam.toLowerCase()] || materialParam;
      
      // Find subcategory by name (case insensitive, handling spaces/dashes)
      const subcategory = subcategories.find(s => {
        const dbName = s.name.toLowerCase();
        const paramName = materialName.toLowerCase();
        const dbNormalized = dbName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const paramNormalized = paramName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        return dbName === paramName || 
               dbNormalized === paramNormalized ||
               dbName.includes(paramName) || 
               paramName.includes(dbName);
      });
      
      if (subcategory) {
        filtered = filtered.filter(p => p.subcategory_id === subcategory.id);
      }
    }

    // Filter by price range
    if (minPriceParam) {
      const minPrice = parseFloat(minPriceParam);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(p => (p.price || 0) >= minPrice);
      }
    }

    if (maxPriceParam) {
      const maxPrice = parseFloat(maxPriceParam);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
      }
    }

    // Sort products
    const sortKey = sortParam.toLowerCase();
    switch (sortKey) {
      case 'nombre':
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
        break;
      case 'nombre-desc':
      case 'name-desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'es', { sensitivity: 'base' }));
        break;
      case 'nuevo':
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'antiguo':
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'precio':
      case 'price':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'precio-desc':
      case 'price-desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        // Default sort by newest
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    setFilteredProducts(filtered);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  const getSubcategoryName = (subcategoryId: string) => {
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    return subcategory?.name || '';
  };

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

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
      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);

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

  // Calculate price range for filters
  const allPrices = products.map(p => p.price || 0).filter(p => p > 0);
  const globalMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const globalMaxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 100;

  // Get unique categories and materials for filters
  const availableCategories = categories.map(c => c.name);
  const availableMaterials = [...new Set(subcategories.map(s => s.name))]; // Remove duplicates

  // Generate page title based on filters
  const getPageTitle = () => {
    // Buscar la categoría seleccionada en la lista dinámica
    let title = '';
    if (categoryParam) {
      const category = categories.find(c => c.name.toLowerCase() === categoryParam.toLowerCase());
      if (category) {
        title = category.name.charAt(0).toUpperCase() + category.name.slice(1);
      }
    }
    // Buscar la subcategoría seleccionada en la lista dinámica
    if (materialParam) {
      const subcategory = subcategories.find(s => s.name.toLowerCase() === materialParam.toLowerCase());
      if (subcategory) {
        title = title ? `${title} - ${subcategory.name}` : subcategory.name;
      }
    }
    return title || 'Nuestra Colección';
  };

  const getPageDescription = () => {
    if (categoryParam) {
      const category = categories.find(c => 
        c.name.toLowerCase() === categoryParam.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === categoryParam.toLowerCase()
      );
      if (category) {
        return `Descubre nuestros productos de ${category.name.toLowerCase()}`;
      }
    }
    return 'Descubre todos nuestros productos para el hogar y bienestar.';
  };

  if (loading) {
    return (
      <div className="bg-background">
        <div className="container pt-12 sm:pt-16 pb-8 sm:pb-12">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container pt-12 sm:pt-16 pb-8 sm:pb-12">
        <div className="mb-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight" style={{ paddingTop: "80px" }}>
              {getPageTitle()}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground pb-4">
              {getPageDescription()}
            </p>
            {filteredProducts.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground mb-4">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <ProductsControlsClient
              categories={availableCategories}
              materials={availableMaterials}
              currentCategory={categoryParam}
              currentMaterial={materialParam}
              currentMin={parseFloat(minPriceParam) || globalMinPrice}
              currentMax={parseFloat(maxPriceParam) || globalMaxPrice}
              globalMin={globalMinPrice}
              globalMax={globalMaxPrice}
              currentSort={sortParam}
            />
          </div>
        </div>
      </div>
      {/* Products Grid */}
      <div className="px-0 md:container">
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros o explora otras categorías
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 md:gap-6 bg-background mb-8">
              {paginatedProducts.map((product, index) => {
                const slug = `${(product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}--${product.id}`;
                const categoryName = getCategoryName(product.category_id);
                const subcategoryName = getSubcategoryName(product.subcategory_id);
                // Calculate padding based on position in grid for mobile
                const isLeftColumn = index % 2 === 0; // For mobile 2-column layout
                const paddingClasses = `md:p-0 ${isLeftColumn ? 'pr-1' : 'pl-1'}`; // Only apply padding on mobile
                return (
                  <div key={product.id} className={paddingClasses}>
                    <Link href={`/public/products/${slug}`} className="block">
                      <Card className="group overflow-hidden transition-shadow duration-300 border-none bg-background shadow-none rounded-none h-full flex flex-col">
                        <CardContent className="p-0 flex-grow">
                        <div className="aspect-[9/16] overflow-hidden relative h-full">
                          {product.cover_image ? (
                            <>
                              <Image
                                src={product.cover_image}
                                alt={product.name || 'Producto'}
                                width={900}
                                height={1600}
                                className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                              />
                              {product.product_images && product.product_images.length > 1 && (
                                <Image
                                  src={product.product_images[1]}
                                  alt={`${product.name} - vista alternativa`}
                                  width={900}
                                  height={1600}
                                  className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                />
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">Sin imagen</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <div className="py-3 sm:py-4 px-1.5 sm:px-2 bg-background">
                        <CardHeader className="p-0">
                          <CardTitle className="font-headline text-sm sm:text-xl tracking-normal text-left leading-snug line-clamp-2">
                            {product.name}
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="p-0 pt-1.5 sm:pt-2 justify-start">
                          <p className="text-sm sm:text-lg font-semibold">
                            ${(product.price || 0).toFixed(2)}
                          </p>
                        </CardFooter>
                      </div>
                    </Card>
                  </Link>
                  </div>
                );
              })}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="justify-center px-4 md:px-0 mb-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={validCurrentPage > 1 ? `/public/products?${new URLSearchParams({
                        ...Object.fromEntries(searchParams?.entries() || []),
                        page: String(validCurrentPage - 1)
                      }).toString()}` : "#"}
                      className={validCurrentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      onClick={validCurrentPage <= 1 ? (e) => e.preventDefault() : undefined}
                    />
                  </PaginationItem>
                  {paginationItems.map((item, index) => (
                    item === '...' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <span className="px-3 py-2 text-sm">...</span>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href={`/public/products?${new URLSearchParams({
                            ...Object.fromEntries(searchParams?.entries() || []),
                            page: String(item)
                          }).toString()}`}
                          isActive={item === validCurrentPage}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href={validCurrentPage < totalPages ? `/public/products?${new URLSearchParams({
                        ...Object.fromEntries(searchParams?.entries() || []),
                        page: String(validCurrentPage + 1)
                      }).toString()}` : "#"}
                      className={validCurrentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      onClick={validCurrentPage >= totalPages ? (e) => e.preventDefault() : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}