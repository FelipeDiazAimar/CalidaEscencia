-- =====================================================
-- AGREGAR CAMPO HOVER_IMAGE A LA TABLA PRODUCTS
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. AGREGAR CAMPO HOVER_IMAGE A LA TABLA PRODUCTS
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hover_image TEXT;

-- 2. AGREGAR COMENTARIO AL CAMPO
COMMENT ON COLUMN products.hover_image IS 'URL de la imagen que se muestra al hacer hover sobre la tarjeta del producto';

-- 3. VERIFICAR LA ESTRUCTURA ACTUALIZADA
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- NOTAS:
-- =====================================================
-- • cover_image: Imagen principal que se muestra en la tarjeta
-- • hover_image: Imagen que aparece al hacer hover (opcional)
-- • product_images: Array de imágenes para la galería del producto
-- =====================================================