import { NextRequest, NextResponse } from 'next/server';

// API para verificar configuración de R2 en el servidor
export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 });
  }

  const r2Config = {
    CLOUDFLARE_R2_ACCOUNT_ID: process.env.CLOUDFLARE_R2_ACCOUNT_ID ? 'CONFIGURADO' : 'FALTANTE',
    CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'CONFIGURADO' : 'FALTANTE',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'CONFIGURADO' : 'FALTANTE',
    CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME ? 'CONFIGURADO' : 'FALTANTE',
    CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT ? 'CONFIGURADO' : 'FALTANTE',
    CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL ? 'CONFIGURADO' : 'FALTANTE',
  };

  const envSample = {
    accountIdFirst8: process.env.CLOUDFLARE_R2_ACCOUNT_ID?.substring(0, 8) || 'N/A',
    accessKeyFirst8: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.substring(0, 8) || 'N/A',
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'N/A'
  };

  return NextResponse.json({
    message: 'Verificación de configuración R2',
    config: r2Config,
    samples: envSample,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('CLOUDFLARE')).sort()
  });
}