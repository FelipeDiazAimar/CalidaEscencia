'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, ShieldCheck, Wrench } from 'lucide-react';
import { api } from '@/lib/api/products';
import type { WebsiteMaterial, MaterialsContent } from '@/types/database';

// Datos de respaldo en caso de que no haya conexión con el admin
const fallbackMaterials = [
  {
    title: 'Oro de Calidad',
    description: 'Utilizamos oro de 14k y 18k, conocido por su durabilidad y brillo atemporal. Perfecto para piezas que durarán toda la vida.',
    image: 'https://picsum.photos/500/300?v=20',
    dataAiHint: 'gold texture',
  },
  {
    title: 'Plata de Ley 925',
    description: 'Nuestra plata de ley es 92.5% plata pura, ofreciendo un balance ideal entre belleza y resistencia. Ideal para diseños modernos y elegantes.',
    image: 'https://picsum.photos/500/300?v=21',
    dataAiHint: 'silver texture',
  },
  {
    title: 'Piedras Preciosas y Semipreciosas',
    description: 'Seleccionamos cuidadosamente cada gema, desde diamantes hasta cuarzos, por su color, corte y claridad para añadir un toque especial a cada joya.',
    image: 'https://picsum.photos/500/300?v=22',
    dataAiHint: 'gemstone background',
  },
];

const fallbackContent = [
  {
    section_type: 'care_tips' as const,
    title: 'Cuidado de tus Joyas',
    content: '• Guarda tus piezas individualmente para evitar que se rayen.\n• Evita el contacto con perfumes, cremas y productos de limpieza.\n• Quítate las joyas antes de nadar, bañarte o hacer ejercicio.\n• Límpialas suavemente con un paño seco y suave después de usarlas.',
    icon_name: 'ShieldCheck',
  },
  {
    section_type: 'maintenance' as const,
    title: 'Mantenimiento',
    content: 'Para una limpieza más profunda, puedes usar agua tibia y un jabón neutro. Usa un cepillo de dientes suave para llegar a las zonas difíciles y seca completamente la pieza antes de guardarla. Para piezas con piedras preciosas, recomendamos una limpieza profesional una vez al año.',
    icon_name: 'Wrench',
  },
];

// Helper para obtener el componente de icono
function getIconComponent(iconName?: string) {
  switch (iconName) {
    case 'ShieldCheck':
      return ShieldCheck;
    case 'Wrench':
      return Wrench;
    case 'Gem':
      return Gem;
    default:
      return Gem;
  }
}

// Helper para renderizar contenido con formato
function formatContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    if (line.trim().startsWith('•')) {
      return (
        <li key={index} className="list-disc list-inside">
          {line.trim().substring(1).trim()}
        </li>
      );
    }
    return line.trim() ? <p key={index}>{line.trim()}</p> : null;
  }).filter(Boolean);
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<WebsiteMaterial[]>([]);
  const [contents, setContents] = useState<MaterialsContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar materiales del admin
        const materialsResponse = await api.websiteMaterials.getAll();
        if (materialsResponse.data && materialsResponse.data.length > 0) {
          setMaterials(materialsResponse.data.filter(m => m.is_active));
        } else {
          // Usar datos de respaldo si no hay datos del admin
          console.log('📦 Usando datos de respaldo para materiales');
          setMaterials([]);
        }

        // Cargar contenido adicional del admin
        const contentsResponse = await api.materialsContent.getAll();
        if (contentsResponse.data && contentsResponse.data.length > 0) {
          setContents(contentsResponse.data.filter(c => c.is_active));
        } else {
          // Usar datos de respaldo si no hay datos del admin
          console.log('📦 Usando datos de respaldo para contenido');
          setContents([]);
        }
      } catch (error) {
        console.error('Error loading materials data:', error);
        setMaterials([]);
        setContents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Decidir qué datos usar (admin o respaldo)
  const displayMaterials = materials.length > 0 ? materials : fallbackMaterials;
  const displayContents = contents.length > 0 ? contents : fallbackContent;

  // Separar contenido por tipo
  const careContent = displayContents.find(c => c.section_type === 'care_tips');
  const maintenanceContent = displayContents.find(c => c.section_type === 'maintenance');

  if (loading) {
    return (
      <div className="bg-background">
        <div className="container py-12 sm:py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando materiales...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight">
            Nuestros Materiales
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Calidad y transparencia en cada pieza que creamos.
          </p>
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32 pb-8" style={{ paddingBottom: "48px" }}>
          {displayMaterials.map((material, index) => {
            // Para materiales del admin usar datos del admin, para respaldo usar formato original
            const isAdminData = materials.length > 0;
            
            return (
              <Card key={isAdminData ? (material as WebsiteMaterial).id : index} className="overflow-hidden border-none bg-primary/20">
                <Image
                  src={isAdminData ? (material as WebsiteMaterial).image_url : (material as any).image}
                  alt={material.title}
                  width={500}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center">
                    <Gem className="mr-3 h-6 w-6 text-primary-foreground/80" />
                    {material.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{material.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-lg px-4 md:px-0">
          {/* Sección de cuidado */}
          <div className="space-y-4 mb-8 md:mb-0">
            {careContent ? (
              <>
                <h2 className="font-headline text-3xl flex items-center">
                  {(() => {
                    const IconComponent = getIconComponent(careContent.icon_name);
                    return <IconComponent className="mr-3 h-8 w-8 text-primary-foreground/80" />;
                  })()}
                  {careContent.title}
                </h2>
                <div className="text-muted-foreground space-y-2">
                  {formatContent(careContent.content)}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-headline text-3xl flex items-center">
                  <ShieldCheck className="mr-3 h-8 w-8 text-primary-foreground/80"/>
                  Cuidado de tus Joyas
                </h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Guarda tus piezas individualmente para evitar que se rayen.</li>
                  <li>Evita el contacto con perfumes, cremas y productos de limpieza.</li>
                  <li>Quítate las joyas antes de nadar, bañarte o hacer ejercicio.</li>
                  <li>Límpialas suavemente con un paño seco y suave después de usarlas.</li>
                </ul>
              </>
            )}
          </div>

          {/* Sección de mantenimiento */}
          <div className="space-y-4">
            {maintenanceContent ? (
              <>
                <h2 className="font-headline text-3xl flex items-center">
                  {(() => {
                    const IconComponent = getIconComponent(maintenanceContent.icon_name);
                    return <IconComponent className="mr-3 h-8 w-8 text-primary-foreground/80" />;
                  })()}
                  {maintenanceContent.title}
                </h2>
                <div className="text-muted-foreground space-y-2">
                  {formatContent(maintenanceContent.content)}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-headline text-3xl flex items-center">
                  <Wrench className="mr-3 h-8 w-8 text-primary-foreground/80"/>
                  Mantenimiento
                </h2>
                <p className="text-muted-foreground">
                  Para una limpieza más profunda, puedes usar agua tibia y un jabón neutro. Usa un cepillo de dientes suave para llegar a las zonas difíciles y seca completamente la pieza antes de guardarla. Para piezas con piedras preciosas, recomendamos una limpieza profesional una vez al año.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
