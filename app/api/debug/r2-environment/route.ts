import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('\n🔍 ===========================================');
  console.log('🔍 R2 DEBUG API: Environment Check');
  console.log('🔍 ===========================================');
  
  try {
    // Verificar variables de entorno con ambos conjuntos de nombres
    const vars = {
      CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_R2_ACCOUNT_ID: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
      CLOUDFLARE_ACCESS_KEY_ID: !!process.env.CLOUDFLARE_ACCESS_KEY_ID,
      CLOUDFLARE_R2_ACCESS_KEY_ID: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      CLOUDFLARE_SECRET_ACCESS_KEY: !!process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      CLOUDFLARE_BUCKET_NAME: !!process.env.CLOUDFLARE_BUCKET_NAME,
      CLOUDFLARE_R2_BUCKET_NAME: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
      NODE_ENV: process.env.NODE_ENV
    };

    console.log('📊 Environment Variables Status:', vars);

    // Determinar variables activas
    const activeVars = {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketName: process.env.CLOUDFLARE_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'algo-bonito-images'
    };

    const isConfigured = !!(activeVars.accountId && activeVars.accountId.trim() && 
                           activeVars.accessKeyId && activeVars.accessKeyId.trim() && 
                           activeVars.secretAccessKey && activeVars.secretAccessKey.trim() && 
                           activeVars.bucketName && activeVars.bucketName.trim());

    const missing: string[] = [];
    if (!activeVars.accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
    if (!activeVars.accessKeyId) missing.push('CLOUDFLARE_ACCESS_KEY_ID'); 
    if (!activeVars.secretAccessKey) missing.push('CLOUDFLARE_SECRET_ACCESS_KEY');
    if (!activeVars.bucketName) missing.push('CLOUDFLARE_BUCKET_NAME');

    const allCloudflareVars = Object.keys(process.env).filter(key => key.includes('CLOUDFLARE'));

    console.log(`${isConfigured ? '✅' : '❌'} Configuration Status: ${isConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`);
    console.log('📋 Missing variables:', missing);
    console.log('🔍 All Cloudflare vars found:', allCloudflareVars);
    console.log('🔍 ===========================================\n');

    return NextResponse.json({
      success: true,
      isConfigured,
      vars,
      activeVars: {
        accountId: !!activeVars.accountId,
        accessKeyId: !!activeVars.accessKeyId,
        secretAccessKey: !!activeVars.secretAccessKey,
        bucketName: !!activeVars.bucketName
      },
      missing,
      allCloudflareVars,
      nodeEnv: process.env.NODE_ENV
    });

  } catch (error) {
    console.error('❌ R2 Debug API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isConfigured: false
    }, { status: 500 });
  }
}