"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowLeft, Package } from "lucide-react";
import { productApi } from '@/lib/api';
import type { Product } from '@/types/database';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);
  const [totalResults, setTotalResults] = useState(0);

  // Load search results
  useEffect(() => {
    if (query) {
      loadSearchResults(query);
      setSearchQuery(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const loadSearchResults = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productApi.products.search(searchTerm, {
        limit: 50, // Show more results for search
        includeInactive: false
      });
      
      if (response.error) {
        console.error('Error searching products:', response.error);
        setError('Error al buscar productos');
        return;
      }

      setProducts(response.data || []);
      setTotalResults((response.data || []).length);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Error al buscar productos');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const generateSlug = (name: string, id: string) => {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}--${id}`;
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "https://picsum.photos/900/1600?v=1";
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // If it's a relative path, you might need to prefix with your storage URL
    return imageUrl;
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL to trigger new search
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-stone-100 to-warm-gray-50">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="group flex items-center text-neutral-600 hover:text-neutral-800 transition-colors duration-200">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Volver al inicio</span>
            </Link>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-800 via-gray-900 to-black bg-clip-text text-transparent mb-2">
                Búsqueda de Productos
              </h1>
              <p className="text-neutral-600 text-lg">Encuentra las joyas perfectas para ti</p>
            </div>
            
            {/* Enhanced Search Form */}
            <form onSubmit={handleNewSearch} className="flex justify-center">
              <div className="flex gap-3 max-w-lg w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
                  <Input
                    type="search"
                    placeholder="¿Qué joya estás buscando?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-lg border-2 border-neutral-300 rounded-xl focus:border-neutral-500 focus:ring-4 focus:ring-neutral-100 bg-white/90 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!searchQuery.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-neutral-700 to-gray-900 hover:from-neutral-800 hover:to-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buscar
                </Button>
              </div>
            </form>

            {query && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-4 border border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600 font-medium">Resultados para:</span>
                  <Badge variant="secondary" className="text-base px-4 py-2 bg-gradient-to-r from-neutral-100 to-gray-100 text-neutral-800 border-neutral-300 rounded-full font-medium">
                    "{query}"
                  </Badge>
                </div>
                {!loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                    <span className="text-neutral-600 font-medium">
                      {totalResults} {totalResults === 1 ? 'producto encontrado' : 'productos encontrados'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-neutral-300 border-t-neutral-700 rounded-full animate-spin mx-auto mb-6"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-gray-300 border-b-gray-800 rounded-full animate-spin mx-auto opacity-60" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
              <p className="text-neutral-700 text-lg font-medium">Buscando las mejores joyas para ti...</p>
              <p className="text-neutral-500 text-sm mt-2">Esto solo tomará un momento</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-neutral-200 max-w-md mx-auto p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-neutral-600 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">Oops, algo salió mal</h3>
              <p className="text-neutral-600 mb-6">{error}</p>
              <Button 
                onClick={() => loadSearchResults(query)} 
                className="bg-gradient-to-r from-neutral-700 to-gray-900 hover:from-neutral-800 hover:to-black text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && !query && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-neutral-200 max-w-lg mx-auto p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-neutral-600 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-3">Encuentra tu joya perfecta</h3>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Explora nuestra colección de anillos, collares, aretes y más. 
                <br />
                <span className="text-neutral-800 font-medium">¡Usa la búsqueda para descubrir tesoros únicos!</span>
              </p>
            </div>
          </div>
        )}

        {!loading && !error && query && products.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-neutral-200 max-w-lg mx-auto p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-neutral-500 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-3">No encontramos resultados</h3>
              <p className="text-neutral-600 mb-6 text-lg">
                No hay productos que coincidan con <span className="font-semibold text-neutral-800">"{query}"</span>
              </p>
              <div className="bg-neutral-50 rounded-2xl p-6 mb-6 text-left border border-neutral-200">
                <p className="text-neutral-700 font-medium mb-3">💡 Intenta con:</p>
                <ul className="space-y-2 text-neutral-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neutral-600 rounded-full"></div>
                    Términos más generales o sinónimos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    Verificar la ortografía
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neutral-600 rounded-full"></div>
                    Palabras como "anillo", "collar", "aretes", "oro", "plata"
                  </li>
                </ul>
              </div>
              <Link href="/public/products">
                <Button className="bg-gradient-to-r from-neutral-700 to-gray-900 hover:from-neutral-800 hover:to-black text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Explorar todos los productos
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-neutral-200 shadow-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-neutral-600 to-gray-800 rounded-full"></div>
                <p className="text-neutral-700 font-medium">
                  {products.length} {products.length === 1 ? 'joya encontrada' : 'joyas encontradas'} para "{query}"
                </p>
                <div className="w-3 h-3 bg-gradient-to-r from-gray-700 to-neutral-800 rounded-full"></div>
              </div>
            </div>

            {/* Enhanced Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const slug = generateSlug(product.name, product.id);
                
                return (
                  <Link key={product.id} href={`/public/products/${slug}`} className="block">
                    <Card className="group overflow-hidden transition-shadow duration-300 border-none bg-background shadow-none rounded-none">
                      <CardContent className="p-0">
                        <div className="aspect-[9/16] overflow-hidden relative">
                          <Image
                            src={getImageUrl(product.cover_image)}
                            alt={product.name}
                            width={400}
                            height={600}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${product.hover_image ? 'group-hover:opacity-0' : 'group-hover:opacity-100'}`}
                          />
                          {product.hover_image && (
                            <Image
                              src={getImageUrl(product.hover_image)}
                              alt={`${product.name} (hover)`}
                              width={400}
                              height={600}
                              className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                              onError={(e) => {
                                console.warn(`Failed to load hover image for product ${product.id}:`, product.hover_image);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {product.is_featured && (
                              <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600">
                                Destacado
                              </Badge>
                            )}
                            {product.is_new && (
                              <Badge className="text-xs bg-green-500 hover:bg-green-600">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      
                      <div className="p-3">
                        <CardHeader className="p-0">
                          <CardTitle className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardFooter className="p-0 pt-2">
                          <div className="flex items-center justify-between w-full">
                            <p className="text-sm font-bold text-primary">
                              {formatPrice(product.price)}
                            </p>
                            {product.stock > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                En stock
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                Sin stock
                              </Badge>
                            )}
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Enhanced Results Summary */}
            <div className="flex justify-center pt-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-8 py-4 border border-neutral-200 shadow-sm">
                <p className="text-neutral-600 font-medium text-center">
                  🎉 Has encontrado {products.length} {products.length === 1 ? 'joya perfecta' : 'joyas perfectas'} 
                  <br />
                  <span className="text-neutral-800 font-semibold">¡Explora y encuentra tu favorita!</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}