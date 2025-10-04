// Script de prueba para verificar la conexión con Cloudflare R2
// Ejecutar con: node test-r2-connection.js

const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

// Configuración del cliente
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

async function testR2Connection() {
  console.log('🔧 Probando conexión con Cloudflare R2...\n');
  
  // Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('Account ID:', process.env.CLOUDFLARE_R2_ACCOUNT_ID ? '✅ Configurado' : '❌ Faltante');
  console.log('Access Key:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '✅ Configurado' : '❌ Faltante');
  console.log('Secret Key:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✅ Configurado' : '❌ Faltante');
  console.log('Bucket Name:', process.env.CLOUDFLARE_R2_BUCKET_NAME ? '✅ Configurado' : '❌ Faltante');
  console.log('Public URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL ? '✅ Configurado' : '❌ Faltante');
  console.log('Endpoint:', `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com\n`);
  
  try {
    // Probar listar objetos
    console.log('📁 Probando acceso al bucket...');
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });
    
    const response = await r2Client.send(listCommand);
    console.log('✅ Conexión exitosa al bucket:', BUCKET_NAME);
    console.log('📊 Archivos encontrados:', response.KeyCount || 0);
    
    // Probar subida de archivo de prueba
    console.log('\n📤 Probando subida de archivo...');
    const testContent = 'Archivo de prueba creado el ' + new Date().toISOString();
    const testKey = `test/conexion-${Date.now()}.txt`;
    
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    });
    
    await r2Client.send(putCommand);
    console.log('✅ Archivo subido exitosamente:', testKey);
    
    // Generar URL pública
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${testKey}`;
    console.log('🌐 URL pública:', publicUrl);
    
    console.log('\n🎉 ¡Todas las pruebas pasaron! Cloudflare R2 está configurado correctamente.');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.name === 'InvalidAccessKeyId') {
      console.log('\n💡 Solución sugerida:');
      console.log('1. Ve a tu dashboard de Cloudflare');
      console.log('2. R2 Object Storage → Manage R2 API tokens');
      console.log('3. Crea un nuevo token con permisos Read y Write');
      console.log('4. Actualiza CLOUDFLARE_R2_ACCESS_KEY_ID y CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    }
  }
}

testR2Connection();