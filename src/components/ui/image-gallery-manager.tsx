'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import ImagePreview from './image-preview';

interface ImageGalleryManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  aspectRatio: '9:16' | '16:9';
  title: string;
  maxImages?: number;
}

export default function ImageGalleryManager({
  images,
  onChange,
  aspectRatio,
  title,
  maxImages = 10
}: ImageGalleryManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addImage = () => {
    if (images.length < maxImages) {
      const newImages = [...images, ''];
      onChange(newImages);
      setEditingIndex(newImages.length - 1);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="w-full" style={{ maxWidth: '100%', width: '100%', overflow: 'hidden' }}>
      <Card className="w-full" style={{ maxWidth: '100%', width: '100%', overflow: 'hidden' }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {title}
            </div>
            <span className="text-sm text-muted-foreground">
              {images.length}/{maxImages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent 
          className="space-y-4 w-full overflow-hidden" 
          style={{ maxWidth: '100%', width: '100%', overflowX: 'hidden' }}
        >
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay imágenes agregadas</p>
            <p className="text-sm">Haz clic en "Agregar imagen" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {images.map((image, index) => (
              <div 
                key={index} 
                className="w-full border rounded-lg overflow-hidden"
                style={{ 
                  maxWidth: '100%', 
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr auto',
                  gap: '12px',
                  padding: '12px',
                  overflowX: 'hidden'
                }}
              >
                {/* Thumbnail fijo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 border rounded-lg overflow-hidden bg-muted">
                    {image ? (
                      <img
                        src={image}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido principal con ancho limitado */}
                <div 
                  className="min-w-0"
                  style={{ 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    width: '100%'
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-sm font-medium">
                      Imagen {index + 1}
                    </Label>
                    {image && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ✓ Configurada
                      </span>
                    )}
                  </div>
                  
                  {editingIndex === index ? (
                    <div 
                      className="space-y-2"
                      style={{ 
                        maxWidth: '100%', 
                        width: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        className="w-full"
                        style={{ 
                          maxWidth: '200px',
                          width: '100%'
                        }}
                      >
                        <ImagePreview
                          label=""
                          value={image}
                          onChange={(value) => updateImage(index, value)}
                          aspectRatio={aspectRatio}
                          placeholder={`URL de la imagen ${index + 1}`}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingIndex(null)}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-sm text-muted-foreground truncate"
                      style={{ 
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {image || 'Sin configurar'}
                    </div>
                  )}
                </div>

                {/* Controles fijos */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  {/* Controles de orden */}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Editar/Eliminar */}
                  <div className="flex gap-1">
                    {editingIndex !== index && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingIndex(index)}
                        className="h-8 text-xs px-2"
                      >
                        Editar
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={addImage}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar imagen ({images.length}/{maxImages})
          </Button>
        )}

        {images.length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>• Usa las flechas para reordenar las imágenes</p>
            <p>• La primera imagen será la principal en la galería</p>
            <p>• Recomendado: {aspectRatio === '9:16' ? 'Imágenes verticales' : 'Imágenes horizontales'}</p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}