import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import * as R2Utils from '@/lib/cloudflare-r2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: productId } = await params;
    console.log('\n🚀 Products DELETE API: Starting deletion...');
    console.log('📋 Products DELETE API: Product ID:', productId);

    // Initialize Supabase client
    const supabase = getSupabaseServer();

    // First get product data to retrieve image URLs
    console.log('📋 Products DELETE API: Fetching product data...');
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('cover_image, hover_image, product_images')
      .eq('id', productId)
      .single() as { 
        data: { 
          cover_image?: string | null; 
          hover_image?: string | null; 
          product_images?: string[] | null;
        } | null; 
        error: any; 
      };

    console.log('📊 Products DELETE API: Product data:', { product, fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Products DELETE API: Error fetching product:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // Delete from database
    console.log('🗑️ Products DELETE API: Deleting from database...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Products DELETE API: Database deletion failed:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Products DELETE API: Product deleted from database');

    // Handle R2 image deletion if product had images
    if (product) {
      console.log('📋 Products DELETE API: Preparing R2 deletion...');
      const imagesToDelete: string[] = [];

      if (product.cover_image) {
        imagesToDelete.push(product.cover_image);
        console.log('📷 Products DELETE API: Added cover image for deletion');
      }

      if (product.hover_image) {
        imagesToDelete.push(product.hover_image);
        console.log('🖼️ Products DELETE API: Added hover image for deletion');
      }

      if (product.product_images && Array.isArray(product.product_images)) {
        product.product_images.forEach((imageUrl: string) => {
          if (imageUrl && imageUrl.trim()) {
            imagesToDelete.push(imageUrl);
            console.log('🖼️ Products DELETE API: Added gallery image for deletion');
          }
        });
      }

      if (imagesToDelete.length > 0) {
        console.log(`📊 Products DELETE API: Deleting ${imagesToDelete.length} images from R2`);

        try {
          const deletePromises = imagesToDelete.map(async (imageUrl, index) => {
            console.log(`🗑️ Products DELETE API: Deleting image ${index + 1}/${imagesToDelete.length}: ${imageUrl}`);
            try {
              const result = await R2Utils.deleteProductImageByUrl(imageUrl);
              console.log(`✅ Products DELETE API: Image ${index + 1} deleted:`, { imageUrl, result });
              return { success: true, imageUrl, result };
            } catch (error) {
              console.warn(`⚠️ Products DELETE API: Failed to delete image ${index + 1}:`, { imageUrl, error });
              return { success: false, imageUrl, error: error instanceof Error ? error.message : String(error) };
            }
          });

          const deleteResults = await Promise.all(deletePromises);
          const successful = deleteResults.filter(r => r.success).length;
          const failed = deleteResults.length - successful;
          console.log(`📈 Products DELETE API: R2 deletion summary - Success: ${successful}, Failed: ${failed}`);
        } catch (error) {
          console.warn('⚠️ Products DELETE API: R2 deletion error (non-blocking):', error);
        }
      } else {
        console.log('ℹ️ Products DELETE API: No images to delete from R2');
      }
    }

    console.log('✅ Products DELETE API: Deletion completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('❌ Products DELETE API: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
