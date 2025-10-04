// Este archivo verifica la configuración de variables de entorno del servidor
export function checkServerEnvVars() {
  console.log('🔍 Server Environment Check:', {
    nodeEnv: process.env.NODE_ENV,
    hasCloudflareAccountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    hasCloudflareAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    hasCloudflareSecret: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    hasBucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
    accountIdValue: process.env.CLOUDFLARE_R2_ACCOUNT_ID ? 
      `${process.env.CLOUDFLARE_R2_ACCOUNT_ID.substring(0, 8)}...` : 'MISSING',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('CLOUDFLARE'))
  });
}