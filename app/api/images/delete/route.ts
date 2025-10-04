import { NextRequest, NextResponse } from 'next/server';
import { deleteProductImageByUrl } from '@/lib/cloudflare-r2';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de imagen requerida' },
        { status: 400 }
      );
    }

    const result = await deleteProductImageByUrl(imageUrl);
    
    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada correctamente',
      result
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}