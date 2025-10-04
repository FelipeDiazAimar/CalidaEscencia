'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from '@/lib/api/products';
import type { FAQ } from '@/types/database';

export default function Faq() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.faqs.getActive();
        
        if (response.success && response.data) {
          setFaqs(response.data);
        } else {
          setError('Error al cargar las preguntas frecuentes');
        }
      } catch (err) {
        console.error('Error loading FAQs:', err);
        setError('Error al cargar las preguntas frecuentes');
      } finally {
        setIsLoading(false);
      }
    };

    loadFaqs();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-muted-foreground">Cargando preguntas frecuentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-muted-foreground">No hay preguntas frecuentes disponibles.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq) => (
        <AccordionItem value={`item-${faq.id}`} key={faq.id}>
          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
