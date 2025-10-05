"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { vistaPrincipalApi } from '@/lib/api';
import type { VistaPrincipal } from '@/types/database';

export default function VistaPrincipal() {
  const [vistaPrincipal, setVistaPrincipal] = useState<VistaPrincipal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVistaPrincipal = async () => {
      try {
        setLoading(true);
        const response = await vistaPrincipalApi.getActive();

        if (response.error) {
          console.error('Error loading vista principal:', response.error);
          setError('Error al cargar el contenido');
          return;
        }

        setVistaPrincipal(response.data);
        setError(null);
      } catch (err) {
        console.error('Error loading vista principal:', err);
        setError('Error al cargar el contenido');
      } finally {
        setLoading(false);
      }
    };

    loadVistaPrincipal();
  }, []);

  // Fallback content when no data is available
  const fallbackData = {
    titulo: 'Descubre la Belleza, Encuentra tu Estilo',
    descripcion: 'Explora nuestra exclusiva colección de joyas, diseñadas para capturar la esencia de la elegancia y la sofisticación. Cada pieza cuenta una historia.',
    enlace: '/products',
    enlace_texto: 'Ver Colección',
    imagen: 'https://picsum.photos/600/400'
  };

  // Use loaded data or fallback
  const displayData = vistaPrincipal || fallbackData;

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl || imageUrl.trim() === '') return fallbackData.imagen;

    // If it's already a full URL starting with http/https, validate it
    if (imageUrl.startsWith('http')) {
      try {
        new URL(imageUrl); // This will throw if invalid
        return imageUrl;
      } catch {
        // Invalid URL, fall back
        return fallbackData.imagen;
      }
    }

    // For relative paths or other cases, return fallback
    return fallbackData.imagen;
  };

  if (loading) {
    return (
      <section className="bg-muted/50">
        <div className="container py-10 sm:py-24">
          <div className="bg-background p-5 sm:p-8 rounded-lg shadow-lg">
            <div className="animate-pulse">
              <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-center">
                <div className="space-y-5 sm:space-y-6">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !displayData) {
    return null; // Don't show anything if there's an error or no data
  }

  return (
    <section className="bg-muted/50">
      <div className="container py-10 sm:py-24">
        <div className="bg-background p-5 sm:p-8 rounded-lg shadow-lg">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div className="space-y-5 sm:space-y-6 order-2 md:order-1">
              <h2 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {displayData.titulo.split(', ').map((part, index) => (
                  <span key={index}>
                    {part}
                    {index === 0 && displayData.titulo.includes(', ') && (
                      <br className="hidden sm:block" />
                    )}
                    {index > 0 && index < displayData.titulo.split(', ').length - 1 && ', '}
                  </span>
                ))}
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground">
                {displayData.descripcion}
              </p>
              <Button asChild className="h-10 bg-white hover:bg-gray-50 text-gray-900 px-4 w-full">
                <Link href={displayData.enlace}>
                  {displayData.enlace_texto}
                  <ArrowRight className="ml-2 h-5 w-5" style={{ color: 'white' }} />
                </Link>
              </Button>
            </div>
            <div className="order-1 md:order-2 mb-6 md:mb-0">
              <Image
                src={getImageUrl(displayData.imagen)}
                alt={displayData.titulo}
                width={600}
                height={400}
                className="rounded-lg object-cover shadow-md w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}