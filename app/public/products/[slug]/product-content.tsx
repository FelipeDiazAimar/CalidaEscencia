"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AddToCartButton from "./add-to-cart-button";
import { CreditCard, Truck, Shield, RefreshCw, Leaf, Sparkles, ShieldCheck } from 'lucide-react';
import { productAttributesApi } from '@/lib/api/productAttributes';
import { productApi } from '@/lib/api';
import type { ProductAttribute, ShippingMethod } from '@/types/database';
import * as LucideIcons from 'lucide-react';

interface Product {
  name: string;
  // API may return null for description; accept string|null to match backend types
  description: string | null;
  price: number;
  cover_image?: string | null;
  hover_image?: string | null;
  // product_images may be an array or a JSON string coming from the DB
  product_images?: string | string[] | null;
  category?: string | null;
  subcategory?: string | null;
  stock?: number | null;
  attribute_id?: string | null;
  // Nested category and subcategory from join
  categories?: { name: string } | null;
  subcategories?: { id: string; name: string } | null;
}

interface ProductGalleryProps {
  // optional overrides — if not provided we derive from `product`
  mainImage?: string;
  secondaryImages?: string[];
  product: Product;
}

export default function ProductGallery({
  mainImage,
  secondaryImages = [],
  product,
}: ProductGalleryProps) {
  // Derive gallery images from product fields when props are not provided
  const galleryImages: string[] = (() => {
    if (!product.product_images) return [];
    if (Array.isArray(product.product_images)) return product.product_images.filter(Boolean) as string[];
    try {
      const parsed = JSON.parse(product.product_images as string);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  })();

  const allImages = [product.cover_image, product.hover_image, ...galleryImages].filter(Boolean) as string[];

  const initialMain = mainImage ?? allImages[0];
  const [currentMain, setCurrentMain] = useState<string | undefined>(initialMain);

  // Attribute selection state
  const [availableAttributes, setAvailableAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);

  const hoverRef = useRef(false);
  const idxRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  
  // Touch/swipe functionality
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  // Pointer (mouse) drag functionality for desktop
  const pointerStartRef = useRef<number | null>(null);
  const pointerEndRef = useRef<number | null>(null);
  const isPointerDownRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    // pause autoplay while touching
    hoverRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      // Swipe left - next image
      const currentIndex = allImages.findIndex(img => img === currentMain);
      const nextIndex = (currentIndex + 1) % allImages.length;
      setCurrentMain(allImages[nextIndex]);
      idxRef.current = nextIndex;
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous image
      const currentIndex = allImages.findIndex(img => img === currentMain);
      const prevIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
      setCurrentMain(allImages[prevIndex]);
      idxRef.current = prevIndex;
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
    // resume autoplay
    hoverRef.current = false;
  };

  // Pointer (mouse) handlers to support dragging on desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary pointer (left mouse button)
    if (e.isPrimary) {
      isPointerDownRef.current = true;
      pointerStartRef.current = e.clientX;
      pointerEndRef.current = e.clientX;
      // pause autoplay while dragging
      hoverRef.current = true;
      // capture pointer to continue receiving events even if pointer leaves element
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !e.isPrimary) return;
    pointerEndRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !e.isPrimary) return;
    isPointerDownRef.current = false;
    
    const start = pointerStartRef.current;
    const end = pointerEndRef.current;
    
    if (start !== null && end !== null) {
      const distance = start - end;
      const minSwipeDistance = 50;
      
      if (distance > minSwipeDistance) {
        // Swipe left - next image
        const currentIndex = allImages.findIndex(img => img === currentMain);
        const nextIndex = (currentIndex + 1) % allImages.length;
        setCurrentMain(allImages[nextIndex]);
        idxRef.current = nextIndex;
      } else if (distance < -minSwipeDistance) {
        // Swipe right - previous image
        const currentIndex = allImages.findIndex(img => img === currentMain);
        const prevIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
        setCurrentMain(allImages[prevIndex]);
        idxRef.current = prevIndex;
      }
    }
    
    // cleanup
    pointerStartRef.current = null;
    pointerEndRef.current = null;
    // resume autoplay
    hoverRef.current = false;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (e.isPrimary) {
      isPointerDownRef.current = false;
      pointerStartRef.current = null;
      pointerEndRef.current = null;
      hoverRef.current = false;
    }
  };

  useEffect(() => {
    // Reset index when images change
    idxRef.current = allImages.findIndex(img => img === currentMain);
    if (idxRef.current === -1) idxRef.current = 0;
    
    if (allImages.length <= 1) return;

    const advance = () => {
      if (hoverRef.current) return; // pause on hover
      idxRef.current = (idxRef.current + 1) % allImages.length;
      setCurrentMain(allImages[idxRef.current]);
    };

    // Start autoplay interval
    intervalRef.current = window.setInterval(advance, 3500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [allImages, currentMain]);

  // Load available attributes for this product's subcategory
  useEffect(() => {
    const loadAttributes = async () => {
      if (!product.subcategories?.id) return;
      
      try {
        const response = await productAttributesApi.getBySubcategory(product.subcategories.id);
        const attributes = response.data || [];
        setAvailableAttributes(attributes);
        
        // If product has a pre-assigned attribute_id, select that specific attribute
        if (product.attribute_id && attributes.length > 0) {
          const preAssignedAttribute = attributes.find(attr => attr.id === product.attribute_id);
          if (preAssignedAttribute) {
            setSelectedAttribute(preAssignedAttribute);
          } else if (attributes.length > 0) {
            // Fallback to first attribute if pre-assigned not found
            setSelectedAttribute(attributes[0]);
          }
        } else if (attributes.length > 0) {
          // Auto-select first attribute if no pre-assigned attribute
          setSelectedAttribute(attributes[0]);
        }
      } catch (error) {
        console.error('Error loading product attributes:', error);
      }
    };

    loadAttributes();
  }, [product.subcategories?.id, product.attribute_id]);

  // Prepare product object for AddToCartButton
  const productSlug = product.name.toLowerCase().replace(/\s+/g, '-');
  
  // Debug: Log product data to see what's available
  console.log('Product data:', product);
  console.log('Categories:', product.categories);
  console.log('Subcategories:', product.subcategories);
  console.log('Category (flat):', product.category);
  console.log('Subcategory (flat):', product.subcategory);
  
  const productForCart = {
    id: (product as any).id ?? productSlug,
    slug: productSlug,
    name: product.name,
    price: product.price,
    images: allImages,
    category: product.categories?.name || product.category,
    subcategory: product.subcategories?.name || product.subcategory,
    attribute: selectedAttribute,
  };
  
  // Debug: Log productForCart to see what we're sending to AddToCartButton
  console.log('productForCart being sent to AddToCartButton:', productForCart);

  return (
    <div className="container py-10">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Columna izquierda - Imágenes (centradas) */}
      <div className="flex flex-col items-center">
        {/* Imagen principal con relación fija 9:16 */}
        <div
          className="relative aspect-[9/16] w-auto mx-auto overflow-hidden border bg-muted shadow-md mt-2"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
          onMouseEnter={() => (hoverRef.current = true)}
          onMouseLeave={() => (hoverRef.current = false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {currentMain ? (
            // Use a plain img tag for the main image to avoid Next/Image domain restrictions
            <img
              src={currentMain}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Sin imágenes disponibles
            </div>
          )}
        </div>

        {/* Indicadores de puntos */}
        {allImages.length > 1 && (
          <div className="mt-6 flex gap-3 justify-center">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentMain(img)}
                className={`w-3 h-3 rounded-full transition-all duration-300 border ${
                  currentMain === img 
                    ? 'bg-primary border-primary scale-110' 
                    : 'bg-muted-foreground/20 border-muted-foreground/40 hover:bg-muted-foreground/40 hover:scale-105'
                }`}
                aria-label={`Ver imagen ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Columna derecha - Info producto */}
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          {/* Breadcrumb / Category Navigation */}
          {(product.categories?.name || product.subcategories?.name || product.category || product.subcategory) && (
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              <span>Inicio</span>
              <span className="mx-1">/</span>
              <span>Productos</span>
              {(product.categories?.name || product.category) && (
                <>
                  <span className="mx-1">/</span>
                  <span className="text-foreground font-medium">
                    {product.categories?.name || product.category}
                  </span>
                </>
              )}
              {(product.subcategories?.name || product.subcategory) && (
                <>
                  <span className="mx-1">/</span>
                  <span className="text-foreground font-medium">
                    {product.subcategories?.name || product.subcategory}
                  </span>
                </>
              )}
            </nav>
          )}

          {/* Product Title and Basic Info */}
          <div className="space-y-3">
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight leading-tight">{product.name}</h1>
            
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-foreground">${product.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed mb-6">{product.description}</p>
            </div>
          )}
        </div>

        {/* Botón de carrito y stock alineados a la misma altura */}
        <div className="flex flex-col gap-3">
          {/* Layout móvil: todo en una fila horizontal */}
          <div className="md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <AddToCartButton product={productForCart as any} />
              </div>
              {/* Stock en móvil */}
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <span className="w-1.5 h-1.5 bg-current rounded-full mr-1"></span>
                  1 stock
                </span>
              </div>
            </div>
          </div>

          {/* Layout desktop: botón y stock separados */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex-1">
              <AddToCartButton product={productForCart as any} />
            </div>
            {/* Stock aligned to the right of the button and centered vertically */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></span>
                1 en stock
              </span>
            </div>
          </div>

          {/* Attribute Selection with Buttons */}
          {availableAttributes.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Elige una opción:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableAttributes.map((attribute) => (
                  <button
                    key={attribute.id}
                    onClick={() => setSelectedAttribute(attribute)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      selectedAttribute?.id === attribute.id
                        ? 'bg-gray-500 text-black border-gray-500 shadow-md'
                        : 'bg-background text-black border-border hover:bg-muted hover:border-primary/50'
                    }`}
                  >
                    {attribute.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3">Este producto se añadirá a tu pedido y se confirmará por WhatsApp. No es un pago inmediato.</p>
        </div>

          <Separator />

          {/* Feature cards - hidden on mobile */}
          <div className="hidden md:grid gap-4 md:grid-cols-3">
            <Feature icon={CreditCard} title="Pagos" desc="Tarjeta, transferencia o contra entrega." />
            <Feature icon={Truck} title="Envíos" desc="Local, nacional y retiro en tienda." />
            <Feature icon={Shield} title="Garantía" desc="Productos revisados y soporte personalizado." />
          </div>

          {/* Beneficios - Enhanced Design */}
          <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl border p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">¿Por qué elegir este producto?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Materiales Naturales</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Ingredientes de calidad premium</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Aromas Puros</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Esencias naturales y seguras</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Listo para Regalo</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Empaque elegante y sofisticado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Garantía de Satisfacción</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">7 días de cambio</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Product Details Section - Outside grid for full width */}
      <div className="container mt-16">
        <ProductDetailsSection />
      </div>
    </div>
    );
  }

// Product Details Section with Payment Methods, Mobile Accordion, Desktop Tabs
function ProductDetailsSection() {
  // Payment methods data
  const paymentMethods = [
    { icon: CreditCard, text: "Tarjetas" },
    { icon: Shield, text: "Transferencia" },
    { icon: Truck, text: "Contra entrega" }
  ];

  // Shipping methods state
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(true);

  // Returns policy state
  const [returnsPolicy, setReturnsPolicy] = useState<{
    title: string;
    subtitle: string;
    rules: string[];
  } | null>(null);
  const [loadingReturns, setLoadingReturns] = useState(true);

  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        const response = await productApi.shippingMethods.getAll();
        if (response.success && response.data) {
          setShippingMethods(response.data);
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error);
      } finally {
        setLoadingShipping(false);
      }
    };

    const loadReturnsPolicy = async () => {
      try {
        const response = await productApi.aboutContent.getBySection('returns');
        if (response.success && response.data) {
          const extraData = response.data.extra_data;
          const rules = Array.isArray(extraData?.policy?.rules)
            ? extraData.policy.rules.filter((rule: unknown): rule is string => typeof rule === 'string')
            : [];
          
          setReturnsPolicy({
            title: extraData?.policy?.title || response.data.title || 'Política de Cambios y Devoluciones',
            subtitle: response.data.subtitle || '',
            rules: rules
          });
        }
      } catch (error) {
        console.error('Error loading returns policy:', error);
      } finally {
        setLoadingReturns(false);
      }
    };

    loadShippingMethods();
    loadReturnsPolicy();
  }, []);

  const getIcon = (iconName?: string) => {
    if (!iconName) return Truck;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || Truck;
  };

  return (
    <div>
      {/* Payment Methods - Enhanced */}
      <div className="mb-12 mt-8">
        <div className="text-center md:text-left mb-6">
          <h3 className="text-lg font-semibold text-foreground" style={{marginTop: '25px'}}>Opciones de Pago Seguras</h3>
          <p className="text-sm text-muted-foreground">Elige la forma de pago que más te convenga</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map(method => (
            <div key={method.text} className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                <method.icon className="h-5 w-5 text-gray-300 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{method.text}</p>
                <p className="text-xs text-muted-foreground">
                  {method.text === 'Tarjetas' && 'Visa, Mastercard'}
                  {method.text === 'Transferencia' && 'Banco a banco'}
                  {method.text === 'Contra entrega' && 'Pago al recibir'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Accordion for Mobile */}
      <div className="md:hidden">
        <Accordion type="single" collapsible>
          <AccordionItem value="shipping">
            <AccordionTrigger><Truck className="mr-2 h-5 w-5"/> Envíos y Devoluciones</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              {loadingShipping ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              ) : shippingMethods.length > 0 ? (
                shippingMethods.map((method) => {
                  const IconComponent = getIcon(method.icon_name);
                  return (
                    <div key={method.id} className="flex items-start space-x-3">
                      <IconComponent className="h-4 w-4 mt-0.5 text-primary-foreground/60 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground text-sm mb-1">{method.title}</p>
                        <p className="text-xs leading-relaxed">{method.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <p><strong>Envíos Nacionales:</strong> 2-3 días hábiles. Tarifa de $3.50.</p>
                  <p><strong>Envíos Internacionales:</strong> Contáctanos para cotizar.</p>
                  <p><strong>Devoluciones:</strong> Aceptamos devoluciones hasta 7 días después de la entrega. El producto debe estar sin usar y en su empaque original.</p>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="warranty">
            <AccordionTrigger><ShieldCheck className="mr-2 h-5 w-5"/> Garantía</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>Ofrecemos 30 días de garantía por defectos de fabricación. No cubre desgaste normal, pérdida o daño por mal uso.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger><RefreshCw className="mr-2 h-5 w-5"/> Política de Devoluciones</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              {loadingReturns ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              ) : returnsPolicy ? (
                <>
                  {returnsPolicy.subtitle && (
                    <p className="text-sm mb-3">{returnsPolicy.subtitle}</p>
                  )}
                  <div className="space-y-2">
                    {returnsPolicy.rules.map((rule, index) => (
                      <p key={index} className="text-sm">• {rule}</p>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p>Puedes solicitar un cambio o devolución hasta 7 días después de recibir tu pedido.</p>
                  <p>El producto debe estar en perfectas condiciones, sin uso y en su empaque original.</p>
                  <p>Los costos de envío para devoluciones son cubiertos por el cliente, excepto en casos de defectos de fábrica.</p>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Details Tabs for Desktop */}
      <div className="hidden md:block mt-16">
        <Tabs defaultValue="shipping">
          <TabsList className="flex w-full h-auto p-1">
            <TabsTrigger value="shipping" className="flex-1"><Truck className="mr-2 h-4 w-4"/> Envíos y Devoluciones</TabsTrigger>
            <TabsTrigger value="warranty" className="flex-1"><ShieldCheck className="mr-2 h-4 w-4"/> Garantía</TabsTrigger>
            <TabsTrigger value="returns" className="flex-1"><RefreshCw className="mr-2 h-4 w-4"/> Política de Devoluciones</TabsTrigger>
          </TabsList>
          <TabsContent value="shipping" className="py-6 px-4">
            <h3 className="font-bold text-lg mb-4">Detalles de Envío</h3>
            {loadingShipping ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            ) : shippingMethods.length > 0 ? (
              <div className="space-y-4 mb-6">
                {shippingMethods.map((method) => {
                  const IconComponent = getIcon(method.icon_name);
                  return (
                    <div key={method.id} className="flex items-start space-x-3">
                      <IconComponent className="h-5 w-5 mt-0.5 text-primary-foreground/60 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground mb-1">{method.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{method.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li><strong>Envíos Nacionales (El Salvador):</strong> Tiempo de entrega de 2-3 días hábiles. Costo estándar de $3.50.</li>
                <li><strong>Envíos Internacionales:</strong> Contáctanos por WhatsApp para cotizar envíos a cualquier parte del mundo.</li>
                <li><strong>Empaque:</strong> Todos nuestros productos se envían en un empaque seguro y elegante, listos para regalar.</li>
              </ul>
            )}
            <Separator className="my-4"/>
            <h3 className="font-bold text-lg mb-2">Política de Devoluciones</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Puedes solicitar un cambio o devolución hasta 7 días después de recibir tu pedido.</li>
              <li>El producto debe estar en perfectas condiciones, sin uso y en su empaque original.</li>
              <li>Los costos de envío para devoluciones son cubiertos por el cliente, excepto en casos de defectos de fábrica.</li>
            </ul>
          </TabsContent>
          <TabsContent value="warranty" className="py-6 px-4">
            <h3 className="font-bold text-lg mb-2">Garantía de Calidad</h3>
            <p className="text-muted-foreground">
              En Calida Escencia, nos enorgullecemos de la calidad de nuestros productos. Ofrecemos una garantía de <strong>30 días</strong> a partir de la fecha de compra que cubre exclusivamente defectos de fabricación. Si encuentras algún problema con tu producto que no se deba al uso normal, contáctanos y con gusto lo repararemos o reemplazaremos.
              <br/><br/>
              Esta garantía no cubre:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
              <li>Desgaste natural por el uso diario.</li>
              <li>Daños causados por mal uso o exposición a condiciones extremas.</li>
              <li>Pérdida del producto o de alguno de sus componentes.</li>
              <li>Alteraciones o modificaciones no realizadas por nosotros.</li>
            </ul>
          </TabsContent>
          <TabsContent value="returns" className="py-6 px-4">
            <h3 className="font-bold text-lg mb-4">{returnsPolicy?.title || 'Política de Cambios y Devoluciones'}</h3>
            {loadingReturns ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            ) : returnsPolicy ? (
              <>
                {returnsPolicy.subtitle && (
                  <p className="text-muted-foreground mb-4">{returnsPolicy.subtitle}</p>
                )}
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {returnsPolicy.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Puedes solicitar un cambio o devolución hasta 7 días después de recibir tu pedido.</li>
                <li>El producto debe estar en perfectas condiciones, sin uso y en su empaque original.</li>
                <li>Los costos de envío para devoluciones son cubiertos por el cliente, excepto en casos de defectos de fábrica.</li>
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border p-5 group bg-transparent">
      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-1 text-muted-foreground ring-1 ring-border group-hover:shadow-sm transition-all">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-base font-medium leading-tight">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
