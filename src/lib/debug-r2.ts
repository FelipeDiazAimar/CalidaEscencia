// Verificador de variables de entorno de R2
// Solo para debuggear el problema de configuración

export function debugR2Config() {
  console.log('🔍 Debug R2 Configuration:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('CLOUDFLARE_R2_ACCOUNT_ID:', process.env.CLOUDFLARE_R2_ACCOUNT_ID ? 'SET' : 'NOT SET');
  console.log('CLOUDFLARE_R2_ACCESS_KEY_ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
  console.log('CLOUDFLARE_R2_SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
  console.log('CLOUDFLARE_R2_BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME ? 'SET' : 'NOT SET');
  console.log('CLOUDFLARE_R2_ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT ? 'SET' : 'NOT SET');
  console.log('CLOUDFLARE_R2_PUBLIC_URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL ? 'SET' : 'NOT SET');
}

// Llamar la función para debuggear
if (process.env.NODE_ENV !== 'production') {
  debugR2Config();
}