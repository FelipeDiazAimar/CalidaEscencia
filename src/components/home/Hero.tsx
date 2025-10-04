"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import { api } from '@/lib/api/products';
import type { CarouselImage } from '@/types/database';

// Fallback items en caso de que no haya imágenes en la base de datos
const fallbackItems = [
  {
    src: "https://picsum.photos/1200/800?v=1",
    alt: "Elegante collar de oro",
    title: "Colección Verano",
    description: "Brilla con nuestra nueva colección de verano.",
    link_url: "",
  },
  {
    src: "https://picsum.photos/1200/800?v=2",
    alt: "Anillos de plata con gemas",
    title: "Anillos Únicos",
    description: "Encuentra el anillo perfecto para cada ocasión.",
    link_url: "",
  },
  {
    src: "https://picsum.photos/1200/800?v=3",
    alt: "Aretes minimalistas",
    title: "Detalles que Enamoran",
    description: "Aretes diseñados para resaltar tu belleza.",
    link_url: "",
  },
];

export default function Hero() {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar imágenes del carrusel desde la base de datos
  useEffect(() => {
    const loadCarouselImages = async () => {
      try {
        const response = await api.carouselImages.getActive();
        if (response.success && response.data && response.data.length > 0) {
          // Ordenar por order_index
          const sortedImages = response.data.sort((a, b) => a.order_index - b.order_index);
          setCarouselImages(sortedImages);
        } else {
          // Si no hay imágenes en la base de datos, usar fallback
          console.log('No hay imágenes activas en la base de datos, usando imágenes de respaldo');
        }
      } catch (error) {
        console.error('Error loading carousel images:', error);
        // En caso de error, usar fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadCarouselImages();
  }, []);

  // Determinar qué imágenes mostrar
  const imagesToShow = carouselImages.length > 0 ? carouselImages : fallbackItems;

  if (isLoading) {
    return (
      <section className="w-full h-screen md:h-[80vh] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando carrusel...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
          }),
        ]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {imagesToShow.map((item, index) => {
            // Determinar si es un elemento de CarouselImage o fallback
            const isCarouselImage = 'id' in item;
            const imageUrl = isCarouselImage ? (item as CarouselImage).image_url : (item as any).src;
            const altText = isCarouselImage ? (item as CarouselImage).alt_text || (item as CarouselImage).title : (item as any).alt;
            const title = item.title;
            const description = item.description;
            const linkUrl = isCarouselImage ? (item as CarouselImage).link_url : (item as any).link_url;

            return (
              <CarouselItem key={isCarouselImage ? (item as CarouselImage).id : index}>
                <div className="relative h-screen md:h-[80vh] w-full">
                  <Image
                    src={imageUrl}
                    alt={altText}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl drop-shadow-md">
                        {title}
                      </h1>
                      <p className="mt-4 max-w-lg text-lg md:text-xl drop-shadow">
                        {description}
                      </p>
                      <Button 
                        size="lg" 
                        className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={linkUrl ? () => window.open(linkUrl, '_blank') : undefined}
                      >
                        {linkUrl ? 'Ver Más' : 'Ver Colección'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
      </Carousel>
    </section>
  );
}
