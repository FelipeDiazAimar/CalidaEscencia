-- =====================================================
-- MIGRACIÓN DE DATOS: NAMES -> CATEGORIES, MODELS -> SUBCATEGORIES
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT 
    'names' as table_name, COUNT(*) as total_records 
FROM names
UNION ALL
SELECT 
    'models' as table_name, COUNT(*) as total_records 
FROM models
UNION ALL
SELECT 
    'categories' as table_name, COUNT(*) as total_records 
FROM categories
UNION ALL
SELECT 
    'subcategories' as table_name, COUNT(*) as total_records 
FROM subcategories;

-- 2. MIGRAR DATOS DE NAMES A CATEGORIES
-- (Solo migrar si no existen ya)
INSERT INTO categories (name, description, created_at, updated_at)
SELECT 
    name, 
    'Categoría migrada desde tabla names' as description,
    COALESCE(created_at, NOW()) as created_at, 
    COALESCE(updated_at, NOW()) as updated_at 
FROM names 
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE LOWER(c.name) = LOWER(names.name)
);

-- 3. MIGRAR DATOS DE MODELS A SUBCATEGORIES
-- Primero, necesitamos asignar cada model a una categoría
-- Vamos a crear una lógica básica de asignación:

-- Para modelos relacionados con Aros
INSERT INTO subcategories (name, description, category_id, created_at, updated_at)
SELECT 
    m.name,
    COALESCE(m.description, 'Subcategoría migrada desde tabla models') as description,
    c.id as category_id,
    COALESCE(m.created_at, NOW()) as created_at,
    COALESCE(m.updated_at, NOW()) as updated_at
FROM models m
CROSS JOIN categories c
WHERE c.name = 'Aros'
AND (
    LOWER(m.name) LIKE '%aro%' OR 
    LOWER(m.name) LIKE '%ear%' OR
    LOWER(m.name) LIKE '%oreja%'
)
AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE LOWER(s.name) = LOWER(m.name)
);

-- Para modelos relacionados con Collares
INSERT INTO subcategories (name, description, category_id, created_at, updated_at)
SELECT 
    m.name,
    COALESCE(m.description, 'Subcategoría migrada desde tabla models') as description,
    c.id as category_id,
    COALESCE(m.created_at, NOW()) as created_at,
    COALESCE(m.updated_at, NOW()) as updated_at
FROM models m
CROSS JOIN categories c
WHERE c.name = 'Collares'
AND (
    LOWER(m.name) LIKE '%collar%' OR 
    LOWER(m.name) LIKE '%cuello%' OR
    LOWER(m.name) LIKE '%cadena%'
)
AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE LOWER(s.name) = LOWER(m.name)
);

-- Para modelos relacionados con Anillos
INSERT INTO subcategories (name, description, category_id, created_at, updated_at)
SELECT 
    m.name,
    COALESCE(m.description, 'Subcategoría migrada desde tabla models') as description,
    c.id as category_id,
    COALESCE(m.created_at, NOW()) as created_at,
    COALESCE(m.updated_at, NOW()) as updated_at
FROM models m
CROSS JOIN categories c
WHERE c.name = 'Anillos'
AND (
    LOWER(m.name) LIKE '%anillo%' OR 
    LOWER(m.name) LIKE '%ring%' OR
    LOWER(m.name) LIKE '%sortija%'
)
AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE LOWER(s.name) = LOWER(m.name)
);

-- Para modelos relacionados con Pulseras
INSERT INTO subcategories (name, description, category_id, created_at, updated_at)
SELECT 
    m.name,
    COALESCE(m.description, 'Subcategoría migrada desde tabla models') as description,
    c.id as category_id,
    COALESCE(m.created_at, NOW()) as created_at,
    COALESCE(m.updated_at, NOW()) as updated_at
FROM models m
CROSS JOIN categories c
WHERE c.name = 'Pulseras'
AND (
    LOWER(m.name) LIKE '%pulsera%' OR 
    LOWER(m.name) LIKE '%brazalete%' OR
    LOWER(m.name) LIKE '%muñeca%'
)
AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE LOWER(s.name) = LOWER(m.name)
);

-- Para modelos que no encajan en ninguna categoría específica, asignar a la primera categoría disponible
INSERT INTO subcategories (name, description, category_id, created_at, updated_at)
SELECT 
    m.name,
    COALESCE(m.description, 'Subcategoría migrada desde tabla models') as description,
    (SELECT id FROM categories LIMIT 1) as category_id,
    COALESCE(m.created_at, NOW()) as created_at,
    COALESCE(m.updated_at, NOW()) as updated_at
FROM models m
WHERE NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE LOWER(s.name) = LOWER(m.name)
);

-- 4. VERIFICAR RESULTADOS DE LA MIGRACIÓN
SELECT 
    'categories' as table_name, 
    COUNT(*) as total_records,
    'Datos migrados desde names' as source
FROM categories
UNION ALL
SELECT 
    'subcategories' as table_name, 
    COUNT(*) as total_records,
    'Datos migrados desde models' as source
FROM subcategories;

-- 5. MOSTRAR ESTRUCTURA FINAL
SELECT 
    c.name as category_name,
    COUNT(s.id) as subcategories_count,
    STRING_AGG(s.name, ', ' ORDER BY s.name) as subcategories_list
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- =====================================================
-- OPCIONAL: RENOMBRAR TABLAS ANTIGUAS COMO BACKUP
-- =====================================================

-- Renombrar tablas antiguas (solo ejecutar después de verificar que todo funciona)
-- ALTER TABLE names RENAME TO names_backup;
-- ALTER TABLE models RENAME TO models_backup;

-- =====================================================
-- FIN DEL SCRIPT DE MIGRACIÓN
-- =====================================================