"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { api } from "@/lib/api/products";
import type { Category } from "@/types/database";

// Fallback categories for when database is not available
const fallbackCategories = [
  {
    name: "Anillos",
    href: "/products?category=anillos",
    image: "https://picsum.photos/200/200?v=70",
    hoverImage: "https://picsum.photos/200/200?v=80",
    dataAiHint: "rings collection",
  },
  {
    name: "Collares",
    href: "/products?category=collares",
    image: "https://picsum.photos/200/200?v=71",
    hoverImage: "https://picsum.photos/200/200?v=81",
    dataAiHint: "necklaces collection",
  },
  {
    name: "Pulseras",
    href: "/products?category=pulseras",
    image: "https://picsum.photos/200/200?v=72",
    hoverImage: "https://picsum.photos/200/200?v=82",
    dataAiHint: "bracelets collection",
  },
  {
    name: "Aros",
    href: "/products?category=aros",
    image: "https://picsum.photos/200/200?v=73",
    hoverImage: "https://picsum.photos/200/200?v=83",
    dataAiHint: "earrings collection",
  },
  {
    name: "Piercings",
    href: "/public/products/piercings",
    image: "https://picsum.photos/200/200?v=74",
    hoverImage: "https://picsum.photos/200/200?v=84",
    dataAiHint: "piercings collection",
  },
  {
    name: "Accesorios",
    href: "/public/products/accesorios",
    image: "https://picsum.photos/200/200?v=75",
    hoverImage: "https://picsum.photos/200/200?v=85",
    dataAiHint: "accessories collection",
  },
];

export default function CategoryCarousel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const response = await api.categories.getAll();
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          console.error('Failed to load categories:', response.error);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  const getCategoryHref = (category: Category) => {
    return `/products?category=${encodeURIComponent(category.name.toLowerCase())}`;
  };

  const getCategoryImage = (category: Category) => {
  return category.portada_historias || "https://img.freepik.com/foto-gratis/fondo-textura-abstracta_1258-30553.jpg?semt=ais_hybrid&w=740&q=80";
  };

  const getCategoryHoverImage = (category: Category) => {
  // Use portada_cards as hover o mismo placeholder si no hay
  return category.portada_cards || "https://img.freepik.com/foto-gratis/fondo-textura-abstracta_1258-30553.jpg?semt=ais_hybrid&w=740&q=80";
  };

  if (isLoading) {
    return (
      <section className="py-10 sm:py-16 bg-primary/10">
        <div className="container">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
              Nuestras Categorías
            </h2>
            <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground">
              Encuentra la joya perfecta para cada estilo.
            </p>
          </div>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="py-10 sm:py-16 bg-primary/10">
      <div className="container">
        <div className="text-center mb-8 sm:mb-12 px-2">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold tracking-tight">
            Nuestras Categorías
          </h2>
          <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground">
            Encuentra la joya perfecta para cada estilo.
          </p>
        </div>
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {categories.map((category) => (
              <CarouselItem key={category.id} className="basis-1/4 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 px-1 sm:px-2">
                <Link href={getCategoryHref(category)}>
                  <div className="flex flex-col items-center gap-1.5 sm:gap-4 group">
                    <div className="w-14 h-14 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border border-accent sm:border-4 transition-all duration-300">
                      <div className="w-12 h-12 sm:w-28 sm:h-28 rounded-full overflow-hidden relative transition-all duration-300 group-hover:scale-105">
                        <Image
                          src={getCategoryImage(category)}
                          alt={`Categoría ${category.name}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                          data-ai-hint={`${category.name.toLowerCase()} collection`}
                        />
                        <Image
                          src={getCategoryHoverImage(category)}
                          alt={`Categoría ${category.name}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          data-ai-hint={`${category.name.toLowerCase()} collection`}
                        />
                      </div>
                    </div>
                    <h3 className="font-headline text-[10px] leading-tight sm:text-xl text-center font-semibold tracking-tight">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious variant="ghost" className="top-[40%] -left-4 sm:-left-6" />
          <CarouselNext variant="ghost" className="top-[40%] -right-4 sm:-right-6" />
        </Carousel>
      </div>
    </section>
  );
}
