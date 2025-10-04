/**
 * Cloudflare R2 Debug Utilities
 * Herramientas para debuggear y probar la configuración de R2
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Función para verificar variables de entorno R2 con logs detallados
export function debugR2Environment() {
  console.log('\n🔍 ===========================================');
  console.log('🔍 CLOUDFLARE R2 ENVIRONMENT DEBUG');
  console.log('🔍 ===========================================');
  
  const vars = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    CLOUDFLARE_BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV
  };

  console.log('📊 Environment Variables Status:');
  Object.entries(vars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value ? (key.includes('SECRET') ? '***HIDDEN***' : value) : 'MISSING';
    console.log(`${status} ${key}: ${displayValue}`);
  });

  const isConfigured = vars.CLOUDFLARE_ACCOUNT_ID && 
                      vars.CLOUDFLARE_ACCESS_KEY_ID && 
                      vars.CLOUDFLARE_SECRET_ACCESS_KEY && 
                      vars.CLOUDFLARE_BUCKET_NAME;

  console.log(`\n${isConfigured ? '✅' : '❌'} R2 Configuration Status: ${isConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`);
  console.log('🔍 ===========================================\n');

  return {
    isConfigured,
    vars,
    missing: Object.entries(vars).filter(([_, value]) => !value).map(([key]) => key)
  };
}

// Cliente R2 con logging detallado
function createR2Client() {
  const debug = debugR2Environment();
  
  if (!debug.isConfigured) {
    throw new Error(`R2 configuration incomplete. Missing: ${debug.missing.join(', ')}`);
  }

  console.log('🔧 Creating R2 client with configuration...');
  
  return new S3Client({
    region: 'auto',
    endpoint: `https://${debug.vars.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: debug.vars.CLOUDFLARE_ACCESS_KEY_ID!,
      secretAccessKey: debug.vars.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
  });
}

// Función para probar upload de imagen de test
export async function testR2Upload(): Promise<string> {
  console.log('\n🧪 ===========================================');
  console.log('🧪 TESTING R2 UPLOAD');
  console.log('🧪 ===========================================');

  try {
    const client = createR2Client();
    const bucket = process.env.CLOUDFLARE_BUCKET_NAME!;
    const testKey = `test-images/test-${uuidv4()}.txt`;
    const testContent = `Test file created at ${new Date().toISOString()}`;

    console.log(`📁 Test file key: ${testKey}`);
    console.log(`📄 Content: ${testContent}`);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    console.log('⏳ Executing upload command...');
    const result = await client.send(command);
    
    console.log('✅ Upload successful!');
    console.log('📊 Result:', result);
    console.log(`🌐 Expected URL: https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${testKey}`);
    
    return testKey;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  } finally {
    console.log('🧪 ===========================================\n');
  }
}

// Función para probar eliminación desde R2
export async function testR2Delete(key?: string): Promise<void> {
  console.log('\n🗑️ ===========================================');
  console.log('🗑️ TESTING R2 DELETE');
  console.log('🗑️ ===========================================');

  try {
    const client = createR2Client();
    const bucket = process.env.CLOUDFLARE_BUCKET_NAME!;
    
    // Si no se proporciona key, crear un archivo de test primero
    let testKey = key;
    if (!testKey) {
      console.log('📁 No key provided, creating test file first...');
      testKey = await testR2Upload();
    }

    console.log(`🗑️ Deleting file: ${testKey}`);

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: testKey,
    });

    console.log('⏳ Executing delete command...');
    const result = await client.send(command);
    
    console.log('✅ Delete successful!');
    console.log('📊 Result:', result);
    
  } catch (error) {
    console.error('❌ Delete failed:', error);
    throw error;
  } finally {
    console.log('🗑️ ===========================================\n');
  }
}

// Función para listar archivos en R2 (útil para debug)
export async function listR2Files(prefix?: string): Promise<void> {
  console.log('\n📋 ===========================================');
  console.log('📋 LISTING R2 FILES');
  console.log('📋 ===========================================');

  try {
    const client = createR2Client();
    const bucket = process.env.CLOUDFLARE_BUCKET_NAME!;

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || '',
      MaxKeys: 20,
    });

    console.log(`📁 Listing files in bucket: ${bucket}`);
    if (prefix) console.log(`🔍 With prefix: ${prefix}`);

    const result = await client.send(command);
    
    if (result.Contents && result.Contents.length > 0) {
      console.log(`📊 Found ${result.Contents.length} files:`);
      result.Contents.forEach((obj, index) => {
        console.log(`${index + 1}. ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`);
      });
    } else {
      console.log('📂 No files found');
    }
    
  } catch (error) {
    console.error('❌ List failed:', error);
    throw error;
  } finally {
    console.log('📋 ===========================================\n');
  }
}

// Función de test completo
export async function runCompleteR2Test(): Promise<void> {
  console.log('\n🚀 ===========================================');
  console.log('🚀 COMPLETE R2 TEST SUITE');
  console.log('🚀 ===========================================');

  try {
    // 1. Verificar configuración
    debugR2Environment();
    
    // 2. Probar upload
    console.log('1️⃣ Testing upload...');
    const testKey = await testR2Upload();
    
    // 3. Listar archivos
    console.log('2️⃣ Listing files...');
    await listR2Files('test-images/');
    
    // 4. Probar delete
    console.log('3️⃣ Testing delete...');
    await testR2Delete(testKey);
    
    // 5. Verificar eliminación
    console.log('4️⃣ Verifying deletion...');
    await listR2Files('test-images/');
    
    console.log('✅ All R2 tests completed successfully!');
    
  } catch (error) {
    console.error('❌ R2 test suite failed:', error);
    throw error;
  } finally {
    console.log('🚀 ===========================================\n');
  }
}

// Funciones para usar desde la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).R2Debug = {
    debugEnvironment: debugR2Environment,
    testUpload: testR2Upload,
    testDelete: testR2Delete,
    listFiles: listR2Files,
    runCompleteTest: runCompleteR2Test
  };
  
  console.log('🔧 R2Debug tools loaded! Use R2Debug.runCompleteTest() to start testing');
}