import { useState } from 'react';

interface UseFileUploadResult {
  uploading: boolean;
  uploadFile: (file: File, options?: UploadOptions) => Promise<UploadResponse>;
  deleteFile: (imageUrl: string) => Promise<DeleteResponse>;
}

interface UploadOptions {
  folder?: string;
  productId?: string;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
}

export function useFileUpload(): UseFileUploadResult {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, options: UploadOptions = {}): Promise<UploadResponse> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.productId) {
        formData.append('productId', options.productId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al subir el archivo');
      }

      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al subir el archivo'
      };
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (imageUrl: string): Promise<DeleteResponse> => {
    try {
      console.log('🗑️ Attempting to delete image:', imageUrl);
      
      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const result = await response.json();
      
      console.log('🗑️ Delete API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el archivo');
      }

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al eliminar el archivo'
      };
    }
  };

  return {
    uploading,
    uploadFile,
    deleteFile,
  };
}

// Utilidades adicionales para componentes
export const FileUploadUtils = {
  // Validar archivo antes de subir
  validateFile: (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 5MB.'
      };
    }

    return { valid: true };
  },

  // Crear preview de imagen
  createImagePreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Formatear tamaño de archivo
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};