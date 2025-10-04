import { NextRequest, NextResponse } from 'next/server';
import { R2Utils } from '@/lib/cloudflare-r2';

export async function POST(request: NextRequest) {
  console.log('\n🌐 /api/upload: Starting upload process...');
  
  try {
    console.log('📦 /api/upload: Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const productId = formData.get('productId') as string;

    console.log('📋 /api/upload: Request parameters:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      folder: folder,
      productId: productId || 'none'
    });

    if (!file) {
      console.log('❌ /api/upload: No file provided');
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    console.log('🔍 /api/upload: Starting file validations...');
    
    // Validaciones
    if (!R2Utils.isValidImageType(file.type)) {
      console.log('❌ /api/upload: Invalid image type:', file.type);
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).' },
        { status: 400 }
      );
    }
    console.log('✅ /api/upload: Image type validation passed');

    if (!R2Utils.isValidFileSize(file.size, 5)) {
      console.log('❌ /api/upload: File too large:', file.size, 'bytes');
      return NextResponse.json(
        { success: false, error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }
    console.log('✅ /api/upload: File size validation passed');

    // Subir según el tipo
    console.log('🚀 /api/upload: Starting R2 upload process...');
    let result;
    if (folder === 'products') {
      console.log('📂 /api/upload: Using product upload method');
      result = await R2Utils.uploadProductImage(file, productId);
    } else {
      console.log('📂 /api/upload: Using general upload method for folder:', folder);
      const { generateUniqueFileName, uploadFileToR2 } = await import('@/lib/cloudflare-r2');
      const fileName = generateUniqueFileName(file.name, folder || 'general');
      console.log('🏷️ /api/upload: Generated filename:', fileName);
      result = await uploadFileToR2(file, fileName, file.type);
    }

    console.log('📊 /api/upload: R2 upload result:', result);

    if (!result.success) {
      console.log('❌ /api/upload: R2 upload failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ /api/upload: R2 upload successful!');
    console.log('🌐 /api/upload: Final URL:', result.url);

    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'Archivo subido exitosamente'
    });

  } catch (error) {
    console.error('❌ /api/upload: Unexpected error:', error);
    console.error('🔍 /api/upload: Error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('\n🗑️ /api/upload DELETE: Starting image deletion process...');
  
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    console.log('📋 /api/upload DELETE: Request parameters:', {
      imageUrl: imageUrl,
      hasUrl: !!imageUrl
    });

    if (!imageUrl) {
      console.log('❌ /api/upload DELETE: No image URL provided');
      return NextResponse.json(
        { success: false, error: 'No se proporcionó URL de imagen' },
        { status: 400 }
      );
    }

    console.log('🚀 /api/upload DELETE: Calling R2Utils.deleteProductImageByUrl...');
    const result = await R2Utils.deleteProductImageByUrl(imageUrl);
    console.log('📊 /api/upload DELETE: R2 deletion result:', result);

    if (!result.success) {
      console.log('❌ /api/upload DELETE: R2 deletion failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ /api/upload DELETE: Image deleted successfully from R2');
    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ /api/upload DELETE: Unexpected error:', error);
    console.error('🔍 /api/upload DELETE: Error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}