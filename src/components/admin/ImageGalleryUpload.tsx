'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface ImageGalleryUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  title?: string;
  maxImages?: number;
  folder?: string;
  productId?: string;
}

export function ImageGalleryUpload({
  images,
  onChange,
  title = 'Galería de Imágenes',
  maxImages = 8,
  folder = 'products/gallery',
  productId
}: ImageGalleryUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Añadir nueva imagen
  const addImage = () => {
    if (images.length < maxImages) {
      const newImages = [...images, ''];
      onChange(newImages);
    }
  };

  // Eliminar imagen por índice
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Actualizar imagen en un índice específico
  const updateImage = (index: number, imageUrl: string) => {
    const newImages = [...images];
    newImages[index] = imageUrl;
    onChange(newImages);
  };

  // Mover imagen hacia arriba
  const moveImageUp = (index: number) => {
    if (index > 0) {
      const newImages = [...images];
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      onChange(newImages);
    }
  };

  // Mover imagen hacia abajo
  const moveImageDown = (index: number) => {
    if (index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onChange(newImages);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {images.filter(img => img.trim()).length} / {maxImages}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de imágenes existentes */}
        {images.map((imageUrl, index) => (
          <div key={index} className="relative border rounded-lg p-4">
            <div className="flex items-center gap-4">
              {/* Número de imagen */}
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              {/* Componente de subida de imagen */}
              <div className="flex-1 max-w-md">
                <ImageUpload
                  currentImageUrl={imageUrl}
                  onImageUploaded={(url) => updateImage(index, url)}
                  onImageRemoved={() => updateImage(index, '')}
                  label={`Imagen ${index + 1}`}
                  folder={folder}
                  productId={productId}
                />
              </div>

              {/* Controles de orden */}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveImageUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveImageDown(index)}
                  disabled={index === images.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Botón eliminar */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeImage(index)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Botón para añadir nueva imagen */}
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={addImage}
            className="w-full h-20 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Añadir imagen ({images.length}/{maxImages})</span>
            </div>
          </Button>
        )}

        {/* Información sobre las imágenes */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Las imágenes se suben automáticamente a Cloudflare R2</p>
          <p>• Usa las flechas para reordenar las imágenes</p>
          <p>• La primera imagen aparecerá como principal en la galería</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ImageGalleryUpload;
