-- =====================================================
-- VERIFICACIÓN RÁPIDA DEL ESTADO DE LA BASE DE DATOS
-- =====================================================
-- Ejecuta esto en Supabase SQL Editor para verificar el estado

-- 1. ¿Existe la tabla product_sales?
SELECT 
    'product_sales table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'product_sales'
        ) THEN '✅ SÍ'
        ELSE '❌ NO'
    END as result;

-- 2. ¿Existen las columnas stock e is_featured en products?
SELECT 
    'products columns' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'stock'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'is_featured'
        ) THEN '✅ SÍ'
        ELSE '❌ NO'
    END as result;

-- 3. ¿Existen los triggers de stock?
SELECT 
    'stock triggers' as check_name,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ SÍ'
        ELSE '❌ NO'
    END as result
FROM information_schema.triggers 
WHERE event_object_table = 'product_sales'
AND trigger_name LIKE '%stock%';

-- 4. Mostrar estructura de product_sales (si existe)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_sales'
ORDER BY ordinal_position;

-- 5. Mostrar algunos productos con stock (si existe la columna)
SELECT 
    id, 
    name, 
    price,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'stock'
        ) THEN stock::text
        ELSE 'columna no existe'
    END as stock_value
FROM products 
LIMIT 3;

-- 6. Contar ventas en product_sales (si existe la tabla)
SELECT 
    'product_sales count' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'product_sales'
        ) THEN (SELECT COUNT(*)::text FROM product_sales)
        ELSE 'tabla no existe'
    END as result;