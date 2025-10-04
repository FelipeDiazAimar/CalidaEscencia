# 🔧 Configuración de Supabase

## ⚠️ Error Actual
Las APIs de categorías y subcategorías están fallando porque **Supabase no está configurado**.

## 📋 Pasos para Configurar Supabase

### 1. **Ve a Supabase Dashboard**
- Visita: https://app.supabase.com
- Crea una cuenta o inicia sesión
- Crea un nuevo proyecto

### 2. **Obtén las Credenciales**
En tu proyecto de Supabase:
- Ve a **Settings** → **API**
- Copia:
  - **Project URL** 
  - **anon public key**
  - **service_role key** (opcional)

### 3. **Actualiza el archivo `.env`**
Reemplaza las variables en `.env` con tus valores reales:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

### 4. **Ejecuta el Script SQL**
En el **SQL Editor** de tu dashboard de Supabase, ejecuta:

```sql
-- Ejecuta el contenido de: add_category_ordering.sql
```

### 5. **Reinicia el Servidor**
```bash
npm run dev
```

## 🎯 Estado Actual

**✅ Modo Fallback Activado**
- El sistema funciona con datos de ejemplo
- Header muestra categorías predefinidas
- Admin panel muestra categorías de prueba

**🔄 Cuando configures Supabase:**
- Los datos se cargarán desde la base de datos real
- Podrás ordenar categorías desde el admin
- Los cambios se reflejarán en el header automáticamente

## 📁 Archivos Importantes

- `add_category_ordering.sql` - Script completo con datos de ejemplo
- `.env` - Variables de entorno (actualizar aquí)
- `src/lib/supabaseClient.ts` - Cliente de Supabase
- `src/lib/api/products.ts` - APIs con modo fallback

## 🚀 Una vez configurado

1. Las categorías se cargarán desde Supabase
2. El ordenamiento funcionará desde `/admin/names`
3. El header se sincronizará automáticamente
4. Podrás gestionar subcategorías desde `/admin/models`
