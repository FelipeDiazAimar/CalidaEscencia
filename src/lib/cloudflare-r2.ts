// @ts-nocheck
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Debug para verificar configuración
import './debug-r2';

// Función para obtener variables de entorno de forma robusta
function getEnvVar(name: string): string | undefined {
  // Solo intentar acceder a process.env directamente
  return process.env[name];
}

// Función para crear el cliente S3 bajo demanda
function getR2Client(): S3Client {
  console.log('🔧 R2Utils.getR2Client: Creating R2 client...');
  
  // Usar tanto las variables originales como las nuevas para compatibilidad
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  
  if (!accountId) {
    console.error('❌ R2Utils.getR2Client: CLOUDFLARE_ACCOUNT_ID not configured');
    throw new Error('CLOUDFLARE_ACCOUNT_ID no está configurado');
  }
  
  if (!accessKeyId) {
    console.error('❌ R2Utils.getR2Client: CLOUDFLARE_ACCESS_KEY_ID not configured');
    throw new Error('CLOUDFLARE_ACCESS_KEY_ID no está configurado');
  }
  
  if (!secretAccessKey) {
    console.error('❌ R2Utils.getR2Client: CLOUDFLARE_SECRET_ACCESS_KEY not configured');
    throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY no está configurado');
  }
  
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  console.log('🔧 R2Utils.getR2Client: Using endpoint:', endpoint);
  
  return new S3Client({
    region: 'auto', // Cloudflare R2 usa 'auto' como región
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'algo-bonito-images';
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

// Check if we're running in a server environment
function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

// Verificar configuración
export function isR2Configured(): boolean {
  console.log('\n🔍 R2Utils.isR2Configured: Checking R2 configuration...');
  
  // If running in browser, environment variables are not available
  if (!isServerEnvironment()) {
    console.log('🌐 R2Utils.isR2Configured: Running in browser - R2 operations should use API endpoints');
    return false;
  }
  
  // Usar tanto las variables originales como las nuevas para compatibilidad
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'algo-bonito-images';
  
  // Log detallado de cada variable (sin mostrar secrets)
  const varsStatus = {
    CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCOUNT_ID: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY_ID: !!process.env.CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_SECRET_ACCESS_KEY: !!process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_BUCKET_NAME: !!process.env.CLOUDFLARE_BUCKET_NAME,
    CLOUDFLARE_R2_BUCKET_NAME: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV,
    resolved: { accountId: !!accountId, accessKeyId: !!accessKeyId, secretAccessKey: !!secretAccessKey, bucketName: !!bucketName }
  };

  console.log('📊 R2Utils.isR2Configured: Environment variables status:', varsStatus);
  console.log('🔍 R2Utils.isR2Configured: All Cloudflare env vars:', Object.keys(process.env).filter(key => key.includes('CLOUDFLARE')));

  // Validar que todas las variables críticas existan y no estén vacías
  const isConfigured = Boolean(
    accountId && accountId.trim() &&
    accessKeyId && accessKeyId.trim() &&
    secretAccessKey && secretAccessKey.trim() &&
    bucketName && bucketName.trim()
  );
  
  if (!isConfigured) {
    const missingVars = [];
    if (!accountId || !accountId.trim()) missingVars.push('CLOUDFLARE_ACCOUNT_ID');
    if (!accessKeyId || !accessKeyId.trim()) missingVars.push('CLOUDFLARE_ACCESS_KEY_ID');
    if (!secretAccessKey || !secretAccessKey.trim()) missingVars.push('CLOUDFLARE_SECRET_ACCESS_KEY');
    if (!bucketName || !bucketName.trim()) missingVars.push('CLOUDFLARE_BUCKET_NAME');

    console.error('❌ R2Utils.isR2Configured: Configuration incomplete. Missing variables:', missingVars);
    console.error('❌ R2Utils.isR2Configured: Current env context:', process.env.NODE_ENV);
    console.error('❌ R2Utils.isR2Configured: Try setting these environment variables:', {
      accountIdEmpty: !accountId || !accountId.trim(),
      accessKeyIdEmpty: !accessKeyId || !accessKeyId.trim(),
      secretAccessKeyEmpty: !secretAccessKey || !secretAccessKey.trim(),
      bucketNameEmpty: !bucketName || !bucketName.trim()
    });
    
    return false;
  }

  console.log('✅ R2Utils.isR2Configured: Configuration is complete');
  return isConfigured;
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 R2 Configuration check:', {
      accountId: accountId ? `${accountId.substring(0, 8)}...` : 'MISSING',
      accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 8)}...` : 'MISSING',
      secretAccessKey: secretAccessKey ? `${secretAccessKey.substring(0, 8)}...` : 'MISSING',
      bucketName: bucketName || 'MISSING',
      result: isConfigured ? 'VALID' : 'INVALID'
    });
  }
  
  if (!isConfigured) {
    console.error('❌ Cloudflare R2 configuration incomplete. Check variables:', {
      accountIdEmpty: !accountId || !accountId.trim(),
      accessKeyIdEmpty: !accessKeyId || !accessKeyId.trim(),
      secretAccessKeyEmpty: !secretAccessKey || !secretAccessKey.trim(),
      bucketNameEmpty: !bucketName || !bucketName.trim()
    });
  } else {
    console.log('✅ Cloudflare R2 correctly configured');
  }
  
  return isConfigured;
}

// Generar nombre único para archivos
export function generateUniqueFileName(originalName: string, folder?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  
  const fileName = `${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
  
  return folder ? `${folder}/${fileName}` : fileName;
}

// Subir archivo a Cloudflare R2
export async function uploadFileToR2(
  file: File | Buffer, 
  fileName: string,
  contentType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  console.log('\n🌐 uploadFileToR2: Starting R2 upload...');
  console.log('📋 uploadFileToR2: Parameters:', {
    fileType: file instanceof File ? 'File' : 'Buffer',
    fileName: fileName,
    contentType: contentType,
    fileSize: file instanceof File ? file.size : file.length
  });

  try {
    console.log('🔍 uploadFileToR2: Checking R2 configuration...');
    if (!isR2Configured()) {
      console.log('❌ uploadFileToR2: R2 not configured properly');
      throw new Error('Cloudflare R2 no está configurado correctamente');
    }
    console.log('✅ uploadFileToR2: R2 configuration check passed');

    let fileBuffer: Buffer;
    let detectedContentType = contentType;

    console.log('📦 uploadFileToR2: Processing file input...');
    if (file instanceof File) {
      console.log('🔄 uploadFileToR2: Converting File to Buffer...');
      fileBuffer = Buffer.from(await file.arrayBuffer());
      detectedContentType = contentType || file.type || 'application/octet-stream';
      console.log('📋 uploadFileToR2: File processed - size:', fileBuffer.length, 'content-type:', detectedContentType);
    } else {
      console.log('📦 uploadFileToR2: Using Buffer input directly');
      fileBuffer = file;
      detectedContentType = contentType || 'application/octet-stream';
    }

    console.log('🚀 uploadFileToR2: Creating PutObjectCommand...');
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: detectedContentType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
      },
    });

    console.log('📤 uploadFileToR2: Sending command to R2...');
    console.log('📋 uploadFileToR2: Command details:', {
      bucket: BUCKET_NAME,
      key: fileName,
      contentType: detectedContentType,
      bodySize: fileBuffer.length
    });

    await getR2Client().send(command);
    console.log('✅ uploadFileToR2: R2 upload command successful');

    // Construir URL pública
    const publicUrl = `${PUBLIC_URL}/${fileName}`;
    console.log('🌐 uploadFileToR2: Constructed public URL:', publicUrl);

    console.log('✅ uploadFileToR2: Upload process completed successfully');
    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('❌ uploadFileToR2: Error during upload:', error);
    console.error('🔍 uploadFileToR2: Error details:', {
      fileName: fileName,
      bucket: BUCKET_NAME,
      publicUrl: PUBLIC_URL,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Eliminar archivo de Cloudflare R2
export async function deleteFileFromR2(fileName: string): Promise<{ success: boolean; error?: string }> {
  console.log('\n🗑️ deleteFileFromR2: Starting R2 deletion...');
  console.log('📋 deleteFileFromR2: File to delete:', fileName);

  try {
    console.log('🔍 deleteFileFromR2: Checking R2 configuration...');
    if (!isR2Configured()) {
      console.warn('⚠️ deleteFileFromR2: Cloudflare R2 not configured, skipping file deletion:', fileName);
      // No fallar completamente, solo retornar éxito con advertencia
      return { 
        success: true, 
        error: 'R2 no configurado - archivo no eliminado' 
      };
    }
    console.log('✅ deleteFileFromR2: R2 configuration check passed');

    console.log('🚀 deleteFileFromR2: Creating DeleteObjectCommand...');
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    console.log('📤 deleteFileFromR2: Sending delete command to R2...');
    console.log('📋 deleteFileFromR2: Command details:', {
      bucket: BUCKET_NAME,
      key: fileName
    });

    await getR2Client().send(command);
    console.log('✅ deleteFileFromR2: File deleted successfully from R2:', fileName);

    return { success: true };
  } catch (error) {
    console.error('❌ deleteFileFromR2: Error during deletion:', error);
    console.error('🔍 deleteFileFromR2: Error details:', {
      fileName: fileName,
      bucket: BUCKET_NAME,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Verificar si un archivo existe en R2
export async function fileExistsInR2(fileName: string): Promise<boolean> {
  try {
    if (!isR2Configured()) {
      return false;
    }

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await getR2Client().send(command);
    return true;
  } catch (error) {
    return false;
  }
}

// Obtener URL temporal firmada para subida directa (opcional)
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn = 3600 // 1 hora por defecto
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!isR2Configured()) {
      throw new Error('Cloudflare R2 no está configurado correctamente');
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(getR2Client(), command, { expiresIn });

    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Extraer nombre de archivo de URL pública
export function extractFileNameFromUrl(url: string): string | null {
  try {
    if (!url || typeof url !== 'string') {
      console.warn('URL inválida proporcionada:', url);
      return null;
    }
    
    // Patrones de URL de Cloudflare R2
    const r2Patterns = [
      PUBLIC_URL, // URL pública configurada
      'https://pub-', // URLs públicas de R2 con formato estándar
      `.r2.dev`, // Dominio de desarrollo de R2
      `.r2.cloudflarestorage.com` // Endpoint directo de R2
    ];
    
    console.log('🔍 Extracting filename from URL:', url);
    console.log('🔍 R2 patterns to check:', r2Patterns.filter(p => p));
    
    // Verificar si la URL es de Cloudflare R2
    const isR2Url = r2Patterns.some(pattern => pattern && url.includes(pattern));
    
    console.log('🔍 Is R2 URL?', isR2Url);
    
    if (isR2Url) {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      
      console.log('🔍 Original pathname:', pathname);
      
      // Remover el '/' inicial
      if (pathname.startsWith('/')) {
        pathname = pathname.substring(1);
      }
      
      console.log('🔍 Cleaned pathname:', pathname);
      
      // Si no hay pathname, la URL no es válida
      if (!pathname) {
        console.warn('❌ No se pudo extraer pathname de la URL:', url);
        return null;
      }
      
      console.log('✅ Filename extracted:', pathname);
      return pathname;
    }
    
    // Intentar extraer filename de URLs que no son R2 (para compatibilidad)
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Para URLs de otros servicios, extraer solo el nombre del archivo
      const segments = pathname.split('/');
      const filename = segments[segments.length - 1];
      
      if (filename && filename.includes('.')) {
        console.log('✅ Filename extracted from non-R2 URL:', filename);
        return filename;
      }
    } catch (e) {
      console.warn('❌ Failed to parse as URL:', url);
    }
    
    console.warn('❌ URL no reconocida o no válida:', url);
    return null;
  } catch (error) {
    console.error('❌ Error extracting filename from URL:', error, 'URL:', url);
    return null;
  }
}

// Utilidades para diferentes tipos de archivos
export const R2Utils = {
  // Carpetas organizativas
  FOLDERS: {
    PRODUCTS: 'products',
    MATERIALS: 'materials',
    CAROUSEL: 'carousel',
    ABOUT: 'about',
    TESTIMONIALS: 'testimonials',
    TEMP: 'temp',
  },

  // Tipos de archivo permitidos
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],

  // Validar tipo de archivo
  isValidImageType: (contentType: string): boolean => {
    return R2Utils.ALLOWED_IMAGE_TYPES.includes(contentType.toLowerCase());
  },

  // Validar tamaño de archivo (5MB por defecto)
  isValidFileSize: (size: number, maxSizeMB = 5): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  },

  // Subir imagen de producto
  uploadProductImage: async (file: File, productId?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    console.log('\n📤 R2Utils.uploadProductImage: Starting upload process...');
    console.log('📋 R2Utils.uploadProductImage: File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      productId: productId || 'none'
    });

    console.log('🔍 R2Utils.uploadProductImage: Validating file type...');
    if (!R2Utils.isValidImageType(file.type)) {
      console.log('❌ R2Utils.uploadProductImage: Invalid file type:', file.type);
      return { success: false, error: 'Tipo de archivo no válido. Solo se permiten imágenes.' };
    }
    console.log('✅ R2Utils.uploadProductImage: File type validation passed');

    console.log('🔍 R2Utils.uploadProductImage: Validating file size...');
    if (!R2Utils.isValidFileSize(file.size)) {
      console.log('❌ R2Utils.uploadProductImage: File too large:', file.size, 'bytes');
      return { success: false, error: 'El archivo es demasiado grande. Máximo 5MB.' };
    }
    console.log('✅ R2Utils.uploadProductImage: File size validation passed');

    const fileName = generateUniqueFileName(
      file.name, 
      productId ? `${R2Utils.FOLDERS.PRODUCTS}/${productId}` : R2Utils.FOLDERS.PRODUCTS
    );
    console.log('🏷️ R2Utils.uploadProductImage: Generated filename:', fileName);

    console.log('🚀 R2Utils.uploadProductImage: Calling uploadFileToR2...');
    const result = await uploadFileToR2(file, fileName, file.type);
    console.log('📊 R2Utils.uploadProductImage: Upload result:', result);
    return result;
  },

  // Eliminar imagen de producto por URL
  deleteProductImageByUrl: async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
    console.log('\n🗑️ R2Utils.deleteProductImageByUrl: Starting deletion process...');
    console.log('📋 R2Utils.deleteProductImageByUrl: Image URL:', imageUrl);

    const fileName = extractFileNameFromUrl(imageUrl);
    console.log('🔍 R2Utils.deleteProductImageByUrl: Extracted filename:', fileName);
    
    if (!fileName) {
      console.log('❌ R2Utils.deleteProductImageByUrl: Could not extract filename from URL');
      return { success: false, error: 'No se pudo extraer el nombre del archivo de la URL' };
    }

    console.log('🚀 R2Utils.deleteProductImageByUrl: Calling deleteFileFromR2...');
    const result = await deleteFileFromR2(fileName);
    console.log('📊 R2Utils.deleteProductImageByUrl: Deletion result:', result);
    return result;
  },
};

// Exportar funciones individuales para usar en API routes
export const deleteProductImageByUrl = R2Utils.deleteProductImageByUrl;
export const uploadProductImage = R2Utils.uploadProductImage;

export default getR2Client;