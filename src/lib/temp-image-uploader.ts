import { tempImageStore } from './temp-image-store';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class TempImageUploader {
  // Subir todas las imágenes temporales a Cloudflare R2
  static async uploadAllTempImages(productId?: string): Promise<{
    uploadedUrls: string[];
    tempUrls: string[];
    errors: string[];
  }> {
    console.log('🚀 TempImageUploader: Starting upload process...');
    console.log('📦 TempImageUploader: Product ID:', productId || 'none');
    
    const tempImages = tempImageStore.getAllImages();
    console.log(`📊 TempImageUploader: Found ${tempImages.length} temporary images to upload`);
    console.log('📋 TempImageUploader: Temp images list:', tempImages.map(img => ({ id: img.id, type: img.type, fileName: img.file.name })));
    
    const uploadedUrls: string[] = [];
    const tempUrls: string[] = [];
    const errors: string[] = [];

    if (tempImages.length === 0) {
      console.log('⚠️ TempImageUploader: No temporary images to upload');
      return { uploadedUrls, tempUrls, errors };
    }

    console.log(`🌐 TempImageUploader: Starting upload of ${tempImages.length} images to Cloudflare R2...`);

    for (let i = 0; i < tempImages.length; i++) {
      const tempImage = tempImages[i];
      console.log(`\n🔄 TempImageUploader: Processing image ${i + 1}/${tempImages.length}`);
      console.log('📄 TempImageUploader: Image details:', {
        id: tempImage.id,
        type: tempImage.type,
        fileName: tempImage.file.name,
        fileSize: tempImage.file.size,
        fileType: tempImage.file.type
      });
      
      try {
        console.log('📦 TempImageUploader: Creating FormData...');
        const formData = new FormData();
        formData.append('file', tempImage.file);
        
        // Determinar la carpeta basada en el tipo
        let folder = 'products';
        if (tempImage.type === 'cover') folder = 'products/covers';
        else if (tempImage.type === 'hover') folder = 'products/hover';
        else if (tempImage.type === 'gallery') folder = 'products/gallery';
        
        console.log('📂 TempImageUploader: Upload folder determined:', folder);
        formData.append('folder', folder);
        if (productId) {
          formData.append('productId', productId);
          console.log('🏷️ TempImageUploader: Added product ID to request:', productId);
        }

        console.log('🌐 TempImageUploader: Sending POST request to /api/upload...');
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('📡 TempImageUploader: Upload response status:', response.status);
        console.log('📡 TempImageUploader: Upload response ok:', response.ok);

        const result: UploadResult = await response.json();
        console.log('📄 TempImageUploader: Upload response data:', result);

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
          tempUrls.push(tempImage.id); // Solo el ID temporal, sin prefijo
          console.log(`✅ TempImageUploader: Upload successful!`);
          console.log(`   📤 Temp ID: ${tempImage.id}`);
          console.log(`   🌐 R2 URL: ${result.url}`);
        } else {
          throw new Error(result.error || 'Error al subir imagen');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Error subiendo ${tempImage.id}: ${errorMsg}`);
        console.error(`❌ TempImageUploader: Upload failed for image ${tempImage.id}:`, error);
        console.error('🔍 TempImageUploader: Error details:', {
          tempId: tempImage.id,
          fileName: tempImage.file.name,
          fileSize: tempImage.file.size,
          error: errorMsg
        });
      }
    }

    console.log('\n📊 TempImageUploader: Upload process completed!');
    console.log('📈 TempImageUploader: Results summary:');
    console.log(`   ✅ Successful uploads: ${uploadedUrls.length}`);
    console.log(`   ❌ Failed uploads: ${errors.length}`);
    console.log('📋 TempImageUploader: Uploaded URLs:', uploadedUrls);
    console.log('🏷️ TempImageUploader: Temp URLs processed:', tempUrls);
    if (errors.length > 0) {
      console.log('❌ TempImageUploader: Errors encountered:', errors);
    }

    // Limpiar el almacén temporal después de subir todas las imágenes
    if (uploadedUrls.length > 0) {
      console.log('🧹 TempImageUploader: Cleaning up temp store after successful uploads...');
      tempImageStore.clearAll();
      console.log('✅ TempImageUploader: Temp store cleaned successfully');
    } else if (errors.length > 0) {
      console.log('⚠️ TempImageUploader: No successful uploads, keeping temp images for retry');
    }

    return {
      uploadedUrls,
      tempUrls,
      errors
    };
  }

  // Mapear URLs temporales a URLs reales
  static mapTempUrlsToReal(
    data: any, 
    tempUrls: string[], 
    uploadedUrls: string[]
  ): any {
    const urlMap = new Map();
    tempUrls.forEach((tempUrl, index) => {
      if (uploadedUrls[index]) {
        urlMap.set(tempUrl, uploadedUrls[index]);
      }
    });

    // Función recursiva para reemplazar URLs en cualquier estructura de datos
    const replaceUrls = (obj: any): any => {
      if (typeof obj === 'string') {
        return urlMap.get(obj) || obj;
      } else if (Array.isArray(obj)) {
        return obj.map(replaceUrls);
      } else if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = replaceUrls(obj[key]);
        }
        return result;
      }
      return obj;
    };

    return replaceUrls(data);
  }

  // Limpiar imágenes temporales sin subir
  static clearTempImages(): void {
    tempImageStore.clearAll();
    console.log('🗑️ Imágenes temporales eliminadas sin subir');
  }
}

export default TempImageUploader;