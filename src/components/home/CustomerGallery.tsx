'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { api } from '@/lib/api/products';
import type { CustomerTestimonial } from '@/types/database';

// Fallback data (same as original) for when API is not available
const fallbackGalleryImages = [
  {
    src: 'https://picsum.photos/400/800?v=50',
    alt: 'Comentario de cliente satisfecho en WhatsApp',
    dataAiHint: 'whatsapp chat',
    name: 'Maria Garcia',
    location: 'San Salvador',
  },
  {
    src: 'https://picsum.photos/400/800?v=51',
    alt: 'Comentario de cliente satisfecho en Instagram',
    dataAiHint: 'instagram chat',
    name: 'Ana Martinez',
    location: 'Santa Ana',
  },
  {
    src: 'https://picsum.photos/400/800?v=52',
    alt: 'Cliente mostrando su nueva joya',
    dataAiHint: 'whatsapp chat',
    name: 'Lucia Fernandez',
    location: 'San Miguel',
  },
  {
    src: 'https://picsum.photos/400/800?v=53',
    alt: 'Mensaje de agradecimiento de un cliente',
    dataAiHint: 'instagram chat',
    name: 'Sofia Lopez',
    location: 'La Libertad',
  },
  {
    src: 'https://picsum.photos/400/800?v=54',
    alt: 'Comentario de cliente satisfecho en WhatsApp',
    dataAiHint: 'whatsapp chat',
    name: 'Carmen Rodriguez',
    location: 'Ahuachapán',
  },
  {
    src: 'https://picsum.photos/400/800?v=55',
    alt: 'Comentario de cliente satisfecho en Instagram',
    dataAiHint: 'instagram chat',
    name: 'Elena Perez',
    location: 'Sonsonate',
  },
];

export default function CustomerGallery() {
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const response = await api.testimonials.getAll({ 
        includeInactive: false, // Only show active testimonials
        limit: 20 // Limit to reasonable number for gallery
      });
      
      if (response.error) {
        console.log('Error loading testimonials, using fallback data:', response.error);
        // Don't set error state, just use fallback data
      } else {
        setTestimonials(response.data || []);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      // Use fallback data on error
    } finally {
      setLoading(false);
    }
  };

  // Convert testimonials to gallery format or use fallback
  const galleryImages = testimonials.length > 0 
    ? testimonials.map((testimonial) => ({
        src: testimonial.image_url,
        alt: `Testimonio de ${testimonial.customer_name}`,
        dataAiHint: 'customer testimonial',
        name: testimonial.customer_name,
        location: testimonial.customer_location,
      }))
    : fallbackGalleryImages;

  return (
    <section id="customer-gallery" className="py-12 sm:py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Una selección de los comentarios y fotos que nos comparten nuestros clientes felices.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-8">
            {galleryImages.map((image, index) => (
              <div key={index}>
                <Card className="overflow-hidden border-none shadow-lg rounded-lg">
                  <CardContent className="p-0">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={400}
                      height={800}
                      data-ai-hint={image.dataAiHint}
                      className="w-full h-auto object-cover aspect-[9/16]"
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.currentTarget.src = 'https://picsum.photos/400/800?v=' + (index + 50);
                      }}
                    />
                  </CardContent>
                </Card>
                <div className="mt-4 text-center">
                  <p className="font-semibold text-lg">{image.name}</p>
                  <p className="text-muted-foreground text-sm">{image.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
