import { NextRequest, NextResponse } from 'next/server';
import * as R2Utils from '@/lib/cloudflare-r2';

// POST /api/r2/delete - Delete files from R2 storage
export async function POST(request: NextRequest) {
  try {
    console.log('\n🚀 R2 Delete API: Starting request processing...');

    const body = await request.json();
    console.log('📋 R2 Delete API: Request body:', body);

    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      console.error('❌ R2 Delete API: Invalid request - urls must be an array');
      return NextResponse.json(
        { success: false, error: 'urls must be an array of R2 URLs' },
        { status: 400 }
      );
    }

    console.log(`📊 R2 Delete API: Processing ${urls.length} URLs for deletion`);
    console.log('📋 R2 Delete API: URLs to delete:', urls);

    // Delete all files in parallel
    const deletePromises = urls.map(async (url: string, index: number) => {
      console.log(`🗑️ R2 Delete API: Processing URL ${index + 1}/${urls.length}: ${url}`);
      
      try {
        const result = await R2Utils.deleteProductImageByUrl(url);
        console.log(`✅ R2 Delete API: URL ${index + 1} processed:`, { url, result });
        return { success: true, url, result };
      } catch (error) {
        console.warn(`⚠️ R2 Delete API: Failed to delete URL ${index + 1}:`, { url, error });
        return { success: false, url, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const results = await Promise.all(deletePromises);
    console.log('📊 R2 Delete API: All deletion attempts completed:', results);

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log(`📈 R2 Delete API: Summary - Success: ${successful}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} URLs: ${successful} successful, ${failed} failed`,
      results,
      summary: { successful, failed, total: results.length }
    });

  } catch (error) {
    console.error('❌ R2 Delete API: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}