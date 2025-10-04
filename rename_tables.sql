-- =====================================================
-- SQL SCRIPT PARA RENOMBRAR TABLAS
-- =====================================================
-- Ejecutar estos comandos en el SQL Editor de Supabase
-- =====================================================

-- 1. RENOMBRAR TABLA DE NAMES A CATEGORIES_OLD (backup)
-- (La tabla categories ya existe, así que renombramos names a categories_old como backup)
ALTER TABLE names RENAME TO categories_old;

-- 2. RENOMBRAR TABLA DE MODELS A SUBCATEGORIES_OLD (backup)
-- (La tabla subcategories ya existe, así que renombramos models a subcategories_old como backup)
ALTER TABLE models RENAME TO subcategories_old;

-- =====================================================
-- ALTERNATIVA: SI QUIERES MIGRAR LOS DATOS
-- =====================================================

-- Si quieres migrar los datos de names a categories:
-- INSERT INTO categories (name, description, created_at, updated_at)
-- SELECT name, NULL as description, created_at, updated_at 
-- FROM names 
-- WHERE NOT EXISTS (
--     SELECT 1 FROM categories c WHERE c.name = names.name
-- );

-- Si quieres migrar los datos de models a subcategories:
-- (Necesitarás asignar un category_id válido)
-- INSERT INTO subcategories (name, description, category_id, created_at, updated_at)
-- SELECT 
--     name, 
--     description,
--     (SELECT id FROM categories LIMIT 1) as category_id, -- Asigna a la primera categoría disponible
--     created_at, 
--     updated_at 
-- FROM models 
-- WHERE NOT EXISTS (
--     SELECT 1 FROM subcategories s WHERE s.name = models.name
-- );

-- =====================================================
-- ACTUALIZAR REFERENCIAS EN PRODUCTOS
-- =====================================================

-- Limpiar referencias de name_id en productos (ya que no se usará más)
UPDATE products SET name_id = NULL;

-- Las referencias de model_id se pueden mantener como subcategory_id
-- si decides mapear models a subcategories

-- =====================================================
-- ELIMINAR TABLAS ANTIGUAS (OPCIONAL - DESPUÉS DE VERIFICAR)
-- =====================================================

-- ADVERTENCIA: Solo ejecutar después de verificar que todo funciona correctamente
-- DROP TABLE IF EXISTS categories_old;
-- DROP TABLE IF EXISTS subcategories_old;

-- =====================================================
-- ACTUALIZAR TRIGGERS Y REFERENCIAS
-- =====================================================

-- Los triggers para categories y subcategories ya están creados en el script principal
-- No necesitas crear triggers adicionales

-- =====================================================
-- VERIFICAR CAMBIOS
-- =====================================================

-- Verificar que las tablas se renombraron correctamente:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('categories', 'subcategories', 'categories_old', 'subcategories_old');

-- Verificar contenido de las nuevas tablas:
-- SELECT COUNT(*) as total_categories FROM categories;
-- SELECT COUNT(*) as total_subcategories FROM subcategories;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================