'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2, Crop } from 'lucide-react';
import { useFileUpload, FileUploadUtils } from '@/hooks/use-file-upload';
import ImageCropper from '@/components/ui/image-cropper';
import { tempImageStore, TempImageData, TempImageStore } from '@/lib/temp-image-store';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  label?: string;
  folder?: string;
  productId?: string;
  required?: boolean;
  className?: string;
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label = 'Imagen',
  folder = 'general',
  productId,
  required = false,
  className = '',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(() => {
    if (!currentImageUrl) return '';
    
    // Si es un ID temporal (sin prefijo temp_), obtener la URL del blob
    const tempImage = tempImageStore.getImage(currentImageUrl);
    if (tempImage) {
      return tempImage.previewUrl;
    }
    
    // Si es una URL normal, usarla directamente
    return currentImageUrl;
  });
  const [dragActive, setDragActive] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadFile, deleteFile } = useFileUpload();

  // Efecto para actualizar preview cuando cambie currentImageUrl
  useEffect(() => {
    console.log('🖼️ ImageUpload: currentImageUrl changed:', currentImageUrl);
    
    if (!currentImageUrl) {
      setPreview('');
      return;
    }
    
    // Clean up any malformed temp IDs with double prefix
    let cleanId = currentImageUrl;
    if (cleanId.startsWith('temp_temp_')) {
      cleanId = cleanId.replace('temp_temp_', '');
      console.log('🧹 ImageUpload: cleaned up malformed ID:', cleanId);
    }
    
    // Primero verificar si es un ID temporal (sin prefijo temp_)
    const tempImage = tempImageStore.getImage(cleanId);
    if (tempImage) {
      console.log('🖼️ ImageUpload: found temp image data:', tempImage);
      setPreview(tempImage.previewUrl);
      console.log('🖼️ ImageUpload: using blob URL:', tempImage.previewUrl);
    } else {
      // Si no es temporal, usar la URL directamente
      setPreview(currentImageUrl);
      console.log('🖼️ ImageUpload: using regular URL:', currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleFileSelect = async (file: File) => {
    console.log('🚀 ImageUpload: handleFileSelect started with file:', file.name, file.type, file.size);
    
    // Validar archivo
    const validation = FileUploadUtils.validateFile(file);
    console.log('🔍 ImageUpload: file validation result:', validation);
    if (!validation.valid) {
      console.error('❌ ImageUpload: file validation failed:', validation.error);
      alert(validation.error);
      return;
    }

    // Crear preview inmediatamente usando blob URL
    try {
      console.log('🖼️ ImageUpload: creating image preview...');
      const previewUrl = await FileUploadUtils.createImagePreview(file);
      console.log('✅ ImageUpload: preview URL created:', previewUrl.substring(0, 50) + '...');
      setPreview(previewUrl);

      // Crear datos de imagen temporal
      const tempId = tempImageStore.generateTempId();
      console.log('🆔 ImageUpload: generated temp ID:', tempId);
      
      const tempData: TempImageData = {
        id: tempId,
        file: file,
        previewUrl: previewUrl,
        type: folder?.includes('covers') ? 'cover' : 
              folder?.includes('hover') ? 'hover' : 'gallery'
      };
      console.log('📦 ImageUpload: temp data created:', { ...tempData, file: file.name });

      // Guardar en el almacén temporal
      tempImageStore.addImage(tempData);
      console.log('💾 ImageUpload: temp data saved to store');

      // Notificar al componente padre con solo el ID temporal (sin prefijo)
      console.log('📞 ImageUpload: calling onImageUploaded with tempId:', tempId);
      onImageUploaded(tempId);

      console.log('✅ ImageUpload: handleFileSelect completed successfully');
    } catch (error) {
      console.error('❌ ImageUpload: error in handleFileSelect:', error);
      alert('Error al crear vista previa de la imagen');
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;
    
    // Verificar si es un ID temporal (sin prefijo temp_)
    const tempImage = tempImageStore.getImage(currentImageUrl);
    if (tempImage) {
      // Es una imagen temporal, eliminarla del almacén
      tempImageStore.removeImage(currentImageUrl);
      console.log('📁 Imagen temporal eliminada:', currentImageUrl);
    } else {
      // Es una imagen ya subida a R2, intentar eliminarla
      try {
        await deleteFile(currentImageUrl);
      } catch (error) {
        console.warn('Error deleting image from R2:', error);
        // Continuar con la eliminación local aunque falle R2
      }
    }
    
    // Limpiar el preview y notificar al componente padre
    setPreview('');
    if (onImageRemoved) {
      onImageRemoved();
    }
    
    // Limpiar el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 ImageUpload: handleInputChange triggered');
    const file = e.target.files?.[0];
    console.log('📄 ImageUpload: selected file:', file ? file.name : 'no file selected');
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      alert('Por favor, selecciona solo archivos de imagen');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Función para manejar el recorte de imagen
  const handleCropComplete = (croppedImageUrl: string) => {
    setPreview(croppedImageUrl);
    onImageUploaded(croppedImageUrl);
    setShowCropper(false);
  };

  // Función para validar si la URL del preview es válida
  const isValidPreviewUrl = (url: string): boolean => {
    if (!url) {
      console.log('❌ Empty URL');
      return false;
    }
    
    console.log('🔍 Validating preview URL:', url);
    
    // Handle data URLs (base64 images)
    if (url.startsWith('data:')) {
      console.log('✅ Valid data URL');
      return true;
    }
    
    // Handle blob URLs
    if (url.startsWith('blob:')) {
      console.log('✅ Valid blob URL');
      return true;
    }
    
    // Handle temp IDs - these are not URLs, they should be converted to blob URLs
    if (TempImageStore.isTempUrl(url)) {
      console.log('⚠️ Temp ID detected, should use blob URL instead');
      return false; // This will force the component to use the blob URL
    }
    
    // Handle HTTP/HTTPS URLs
    try {
      const urlObj = new URL(url);
      const isValid = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      console.log(isValid ? '✅ Valid HTTP/HTTPS URL' : '❌ Invalid URL scheme');
      return isValid;
    } catch (error) {
      console.log('❌ Invalid URL format:', error);
      return false;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>
        <ImageIcon className="h-4 w-4 inline mr-2" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {preview && isValidPreviewUrl(preview) ? (
        <div className="relative group">
          <div 
            className="relative w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            style={{ aspectRatio: '9/16' }}
          >
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Subiendo...</span>
                </div>
              </div>
            )}
          </div>
          {/* Botones de acción */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCropper(true)}
              disabled={uploading}
              className="bg-white/90 hover:bg-white text-gray-700"
            >
              <Crop className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className={`mx-auto h-12 w-12 mb-4 ${dragActive ? 'text-primary' : 'text-gray-400'}`} />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {dragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WebP o GIF hasta 5MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />

      <p className="text-xs text-muted-foreground">
        Las imágenes se almacenan de forma segura en Cloudflare R2
      </p>
      
      {/* Modal de recorte */}
      {showCropper && preview && (
        <ImageCropper
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
          imageUrl={preview}
          aspectRatio="9:16"
          onCrop={handleCropComplete}
        />
      )}
    </div>
  );
}

export default ImageUpload;