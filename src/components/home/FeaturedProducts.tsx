"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { api } from "@/lib/api/products";
import type { Product } from "@/types/database";

export default function FeaturedProducts() {
const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
loadFeaturedProducts();
}, []);

const loadFeaturedProducts = async () => {
setLoading(true);
try {
const response = await api.products.getFeatured(8);
if (response.success && response.data) {
setFeaturedProducts(response.data);
}
} catch (error) {
console.error('Error loading featured products:', error);
setFeaturedProducts([]);
} finally {
setLoading(false);
}
};

const generateSlug = (name: string, id: string) => {
return `${name
.toLowerCase()
.replace(/[^a-z0-9]+/g, "-")
.replace(/(^-|-$)/g, "")}--${id}`;
};

const formatPrice = (price: number) => {
return new Intl.NumberFormat('es-SV', {
style: 'currency',
currency: 'USD'
}).format(price);
};

if (loading) {
return (
<section className="py-10 sm:py-16 bg-background">
<div className="container">
<div className="text-center mb-8 sm:mb-12 px-2">
<h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
Productos Destacados
</h2>
<p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground px-1">
Cargando productos destacados...
</p>
</div>
</div>
</section>
);
}

if (featuredProducts.length === 0) {
return null;
}

return (
<section className="py-10 sm:py-16 bg-background">
<div className="container">
<div className="text-center mb-8 sm:mb-12 px-2">
<h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
Productos Destacados
</h2>
<p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground px-1">
Una selección de nuestras piezas más queridas, perfectas para cualquier
oportunidad.
</p>
</div>
</div>

<div className="px-0 md:container md:mx-auto">
<Carousel
plugins={[
Autoplay({
delay: 3000,
stopOnInteraction: false,
stopOnMouseEnter: false,
stopOnFocusIn: false,
}),
]}
opts={{
align: "start",
loop: true,
}}
className="w-full"
>
<CarouselContent className="-ml-1 md:-ml-4">
{featuredProducts.map((product) => {
const slug = generateSlug(product.name, product.id);

return (
<CarouselItem key={product.id} className="pl-1 md:pl-4 basis-1/2 md:basis-1/4">
                <Link href={`/public/products/${slug}`} className="block">
<Card className="group overflow-hidden transition-shadow duration-300 border-none bg-transparent shadow-none rounded-none">
<CardContent className="p-0">
<div className="aspect-[9/16] overflow-hidden relative">
{product.cover_image ? (
<>
<Image
src={product.cover_image}
alt={product.name}
width={900}
height={1600}
className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
priority={false}
/>
{product.hover_image && (
<Image
src={product.hover_image}
alt={`${product.name} - Vista alternativa`}
width={900}
height={1600}
className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
priority={false}
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
<CardFooter className="flex flex-col items-start p-0 pt-2 sm:pt-4 space-y-1">
<h3 className="font-medium text-xs sm:text-sm line-clamp-2 text-left w-full">
{product.name}
</h3>
<p className="text-xs sm:text-sm font-semibold">
{formatPrice(product.price)}
</p>
</CardFooter>
</Card>
</Link>
</CarouselItem>
);
})}
</CarouselContent>
<div className="hidden md:block">
<CarouselPrevious className="left-4" />
<CarouselNext className="right-4" />
</div>
</Carousel>
</div>
</section>
);
}
