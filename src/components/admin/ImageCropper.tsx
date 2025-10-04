'use client';

import { useRef, useState, useCallback, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, RotateCcw, Image, Link, Crop } from 'lucide-react';
import { toast } from 'sonner';
import ImageCropperModal from '@/components/ui/image-cropper';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCropped: (croppedImageUrl: string) => void;
  aspectRatio?: number; // width/height ratio
  title: string;
  description?: string;
  isCircular?: boolean;
}

export default function ImageCropper({ 
  isOpen, 
  onClose, 
  onImageCropped, 
  aspectRatio = 1, 
  title,
  description,
  isCircular = false 
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert our aspectRatio format to the one expected by the ui/image-cropper
  const getCropperAspectRatio = (): '9:16' | '16:9' => {
    if (isCircular) return '9:16'; // For circular, we'll use portrait and handle the circle logic later
    return aspectRatio > 1 ? '16:9' : '9:16';
  };

  const onSelectFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || '';
        setTempImageForCrop(result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUrlLoad = useCallback(() => {
    if (urlInput.trim()) {
      setTempImageForCrop(urlInput.trim());
      setShowCropper(true);
    }
  }, [urlInput]);

  const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  }, []);

  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    setImageSrc(croppedImageUrl);
    setPreviewUrl(croppedImageUrl);
    setShowCropper(false);
    setTempImageForCrop('');
  }, []);

  const handleCropperClose = useCallback(() => {
    setShowCropper(false);
    setTempImageForCrop('');
  }, []);

  const handleUseImage = useCallback(() => {
    if (previewUrl) {
      onImageCropped(previewUrl);
      handleClose();
    }
  }, [previewUrl, onImageCropped]);

  const handleClose = () => {
    setImageSrc('');
    setPreviewUrl('');
    setUrlInput('');
    setInputMode('file');
    setShowCropper(false);
    setTempImageForCrop('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleReset = () => {
    setImageSrc('');
    setPreviewUrl('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPreviewStyle = () => {
    const baseStyle = "max-w-full h-auto border-2 border-dashed border-gray-300 rounded-lg";
    
    if (isCircular) {
      return `${baseStyle} rounded-full max-w-64 max-h-64 object-cover`;
    } else {
      // Para cards: 350.667x197.250 ratio ≈ 1.78:1
      return `${baseStyle} max-w-96 object-cover`;
    }
  };

  const getAspectRatioInfo = () => {
    if (isCircular) {
      return "Formato circular para historias";
    } else {
      return `Proporción para cards: ${(aspectRatio * 100).toFixed(1)}:100`;
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showCropper} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {/* Selector de modo de entrada */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={inputMode === 'file' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('file')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Archivo
              </Button>
              <Button
                variant={inputMode === 'url' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('url')}
                className="flex-1"
              >
                <Link className="h-4 w-4 mr-2" />
                URL
              </Button>
            </div>

            <div className="space-y-4">
              {inputMode === 'file' ? (
                <div>
                  <Label htmlFor="image-upload" className="block text-sm font-medium mb-2">
                    Seleccionar Imagen
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {getAspectRatioInfo()}
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="image-url" className="block text-sm font-medium mb-2">
                    URL de la Imagen
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={urlInput}
                      onChange={handleUrlChange}
                      className="flex-1"
                    />
                    <Button onClick={handleUrlLoad} disabled={!urlInput.trim()}>
                      Cargar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getAspectRatioInfo()}
                  </p>
                </div>
              )}
            </div>

            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                {inputMode === 'file' ? (
                  <>
                    <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      Sube una imagen
                    </p>
                  </>
                ) : (
                  <>
                    <Link className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      Ingresa una URL de imagen
                    </p>
                  </>
                )}
                <p className="text-sm text-gray-400 mb-4">
                  {isCircular 
                    ? 'La imagen se mostrará en formato circular para historias'
                    : 'La imagen se ajustará a la proporción de las cards'
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Crop className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">
                    Con herramienta de recorte avanzada
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium mb-3">Vista previa recortada:</p>
                  <div className="flex justify-center">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className={getPreviewStyle()}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cambiar Imagen
                  </Button>
                  <Button onClick={handleUseImage} className="bg-blue-600 hover:bg-blue-700">
                    <Image className="h-4 w-4 mr-2" />
                    Usar Esta Imagen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={showCropper}
        onClose={handleCropperClose}
        imageUrl={tempImageForCrop}
        aspectRatio={getCropperAspectRatio()}
        onCrop={handleCropComplete}
      />
    </>
  );
}