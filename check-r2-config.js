#!/usr/bin/env node

/**
 * Cloudflare R2 Configuration Checker
 * Ejecutar con: node check-r2-config.js
 */

// Cargar variables de entorno desde archivos .env
require('fs').readFileSync('.env.local', 'utf8')
  .split('\n')
  .forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });

console.log('\n🔍 ===========================================');
console.log('🔍 CLOUDFLARE R2 CONFIGURATION CHECKER');
console.log('🔍 ===========================================');

// Lista de variables que buscamos
const envVars = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCOUNT_ID', 
  'CLOUDFLARE_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_SECRET_ACCESS_KEY', 
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_BUCKET_NAME',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'NODE_ENV'
];

console.log('📊 Environment Variables Status:');
envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? 
    (varName.includes('SECRET') ? '***HIDDEN***' : 
     varName.includes('KEY') && !varName.includes('ID') ? '***HIDDEN***' : 
     value) : 'MISSING';
  console.log(`${status} ${varName}: ${displayValue}`);
});

// Determinar configuración activa
const activeConfig = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  bucketName: process.env.CLOUDFLARE_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'algo-bonito-images'
};

console.log('\n📋 Active Configuration:');
Object.entries(activeConfig).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = key.includes('secret') || key.includes('Secret') ? 
    (value ? '***CONFIGURED***' : 'MISSING') : 
    (value || 'MISSING');
  console.log(`${status} ${key}: ${displayValue}`);
});

const isConfigured = !!(activeConfig.accountId && activeConfig.accountId.trim() && 
                       activeConfig.accessKeyId && activeConfig.accessKeyId.trim() && 
                       activeConfig.secretAccessKey && activeConfig.secretAccessKey.trim() && 
                       activeConfig.bucketName && activeConfig.bucketName.trim());

console.log('\n🎯 Configuration Status:');
console.log(`${isConfigured ? '✅' : '❌'} Overall Status: ${isConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`);

if (!isConfigured) {
  const missing = [];
  if (!activeConfig.accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!activeConfig.accessKeyId) missing.push('CLOUDFLARE_ACCESS_KEY_ID'); 
  if (!activeConfig.secretAccessKey) missing.push('CLOUDFLARE_SECRET_ACCESS_KEY');
  if (!activeConfig.bucketName) missing.push('CLOUDFLARE_BUCKET_NAME');
  
  console.log('❌ Missing Required Variables:', missing.join(', '));
  console.log('\n💡 To fix this, set the missing environment variables in your:');
  console.log('   • .env.local file (for local development)');
  console.log('   • Hosting platform environment settings');
  console.log('   • Or export them in your shell');
}

// Mostrar todas las variables de Cloudflare encontradas
const allCloudflareVars = Object.keys(process.env).filter(key => key.includes('CLOUDFLARE'));
if (allCloudflareVars.length > 0) {
  console.log('\n🔍 All Cloudflare Variables Found:');
  allCloudflareVars.forEach(varName => {
    console.log(`   • ${varName}`);
  });
} else {
  console.log('\n⚠️  No Cloudflare environment variables found!');
}

console.log('\n🔍 ===========================================\n');

// Exit with appropriate code
process.exit(isConfigured ? 0 : 1);