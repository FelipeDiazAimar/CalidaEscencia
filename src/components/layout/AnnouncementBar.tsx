"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Gem } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  text: string;
  is_active: boolean;
  order_position: number;
}

export default function AnnouncementBar() {
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const barRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data: AnnouncementItem[] = await response.json();
          const activeAnnouncements = data
            .filter(item => item.is_active)
            .sort((a, b) => a.order_position - b.order_position)
            .map(item => item.text);
          
          setAnnouncements(activeAnnouncements);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        // Fallback to default announcements
        setAnnouncements([
          'Tarjetas de Crédito / Débito',
          'Transferencia Bancaria', 
          'Pago en Efectivo',
          'ENVÍO GRATIS desde $70.00',
          'Hecho con amor en El Salvador'
        ]);
      }
    };

    fetchAnnouncements();
  }, []);

  React.useEffect(() => {
    const updateHeight = (visible: boolean) => {
      if (barRef.current && visible) {
        const height = barRef.current.offsetHeight;
        document.body.style.setProperty('--announcement-bar-height', `${height}px`);
      } else {
        document.body.style.setProperty('--announcement-bar-height', '0px');
      }
    };
    let lastVisible = true;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        updateHeight(entry.isIntersecting);
        lastVisible = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    if (barRef.current) {
      observer.observe(barRef.current);
      // Inicializa el valor
      updateHeight(true);
    }
    window.addEventListener('resize', () => updateHeight(lastVisible));
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', () => updateHeight(lastVisible));
      document.body.style.setProperty('--announcement-bar-height', '0px');
    };
  }, []);

  // Hide announcement bar on admin routes
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/adminpanel'))) {
    return null;
  }

  if (announcements.length === 0) {
    return null;
  }

  // Calcular repeticiones basado en la cantidad de mensajes únicos
  // Si hay pocos mensajes, repetimos más para llenar el ancho
  let repetitions = 1;
  let spacing = 'mx-4 md:mx-8'; // Espaciado por defecto (móvil: 16px, desktop: 32px)

  if (announcements.length === 1) {
    repetitions = 6; // Un solo mensaje se repite 6 veces
    spacing = 'mx-8 md:mx-32'; // Móvil: 32px, Desktop: 128px
  } else if (announcements.length === 2) {
    repetitions = 3; // Dos mensajes se repiten 3 veces cada uno (6 total)
    spacing = 'mx-6 md:mx-24'; // Móvil: 24px, Desktop: 96px
  } else if (announcements.length === 3) {
    repetitions = 2; // 3 mensajes se repiten 2 veces cada uno
    spacing = 'mx-5 md:mx-20'; // Móvil: 20px, Desktop: 80px
  } else if (announcements.length === 4) {
    repetitions = 2; // 4 mensajes se repiten 2 veces cada uno
    spacing = 'mx-4 md:mx-16'; // Móvil: 16px, Desktop: 64px
  } else if (announcements.length <= 6) {
    repetitions = 1; // 5-6 mensajes aparecen una vez cada uno
    spacing = 'mx-3 md:mx-12'; // Móvil: 12px, Desktop: 48px
  } else {
    repetitions = 1; // 7+ mensajes solo aparecen una vez cada uno
    spacing = 'mx-2 md:mx-8'; // Móvil: 8px, Desktop: 32px
  }

  // Crear el array con las repeticiones necesarias
  const repeatedAnnouncements: string[] = [];
  for (let i = 0; i < repetitions; i++) {
    repeatedAnnouncements.push(...announcements);
  }

  return (
    <div ref={barRef} className="bg-muted text-muted-foreground">
      <div className="relative flex overflow-hidden w-full h-10">
        <div className="py-2 animate-marquee whitespace-nowrap flex items-center">
          {repeatedAnnouncements.map((text, index) => (
            <span key={index} className={`flex items-center ${spacing} text-sm font-semibold`}>
              <Gem className="mr-2 h-4 w-4" style={{ color: '#E9DCC8' }} />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
