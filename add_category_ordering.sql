-- =====================================================
-- AGREGAR CAMPO DE ORDENAMIENTO A CATEGORÍAS
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. AGREGAR CAMPO ORDER_INDEX A LA TABLA CATEGORIES
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. ASIGNAR ORDEN INICIAL SECUENCIAL
-- Primero asignar valores temporales únicos
WITH ordered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) as new_order
  FROM categories
  WHERE order_index = 0 OR order_index IS NULL
)
UPDATE categories 
SET order_index = ordered_categories.new_order
FROM ordered_categories
WHERE categories.id = ordered_categories.id;

-- 3. CREAR ÍNDICE PARA MEJORAR PERFORMANCE DE ORDENAMIENTO
CREATE INDEX IF NOT EXISTS idx_categories_order_index 
ON categories(order_index);

-- 4. INSERTAR CATEGORÍAS BÁSICAS SI NO EXISTEN
-- Primero verificar el máximo order_index existente
DO $$
DECLARE
  max_order INTEGER;
  category_count INTEGER;
BEGIN
  SELECT COALESCE(MAX(order_index), 0) INTO max_order FROM categories;
  
  -- Insertar solo si la categoría no existe
  SELECT COUNT(*) INTO category_count FROM categories WHERE name = 'Aros';
  IF category_count = 0 THEN
    INSERT INTO categories (name, description, order_index) VALUES ('Aros', 'Aros de diferentes materiales y estilos', max_order + 1);
    max_order := max_order + 1;
  END IF;
  
  SELECT COUNT(*) INTO category_count FROM categories WHERE name = 'Collares';
  IF category_count = 0 THEN
    INSERT INTO categories (name, description, order_index) VALUES ('Collares', 'Collares y cadenas elegantes', max_order + 1);
    max_order := max_order + 1;
  END IF;
  
  SELECT COUNT(*) INTO category_count FROM categories WHERE name = 'Anillos';
  IF category_count = 0 THEN
    INSERT INTO categories (name, description, order_index) VALUES ('Anillos', 'Anillos para toda ocasión', max_order + 1);
    max_order := max_order + 1;
  END IF;
  
  SELECT COUNT(*) INTO category_count FROM categories WHERE name = 'Pulseras';
  IF category_count = 0 THEN
    INSERT INTO categories (name, description, order_index) VALUES ('Pulseras', 'Pulseras y brazaletes modernos', max_order + 1);
    max_order := max_order + 1;
  END IF;
  
  SELECT COUNT(*) INTO category_count FROM categories WHERE name = 'Piercings';
  IF category_count = 0 THEN
    INSERT INTO categories (name, description, order_index) VALUES ('Piercings', 'Piercings de alta calidad', max_order + 1);
    max_order := max_order + 1;
  END IF;
  
  SELECT COUNT(*) INTO category_count FROM categories WHERE name = 'Accesorios';
  IF category_count = 0 THEN
    INSERT INTO categories (name, description, order_index) VALUES ('Accesorios', 'Accesorios complementarios', max_order + 1);
  END IF;
END $$;

-- 5. INSERTAR SUBCATEGORÍAS BÁSICAS SI NO EXISTEN
-- (Asumiendo que ya tienes categorías creadas)
DO $$
DECLARE
  cat_id UUID;
  subcat_count INTEGER;
BEGIN
  -- Insertar subcategorías para Aros, Collares, Anillos, Pulseras
  FOR cat_id IN SELECT id FROM categories WHERE name IN ('Aros', 'Collares', 'Anillos', 'Pulseras')
  LOOP
    -- Acero quirúrgico
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Acero quirúrgico' AND category_id = cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Acero quirúrgico', 'Material de alta calidad', cat_id);
    END IF;
    
    -- Acero blanco
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Acero blanco' AND category_id = cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Acero blanco', 'Material de alta calidad', cat_id);
    END IF;
    
    -- Acero dorado
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Acero dorado' AND category_id = cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Acero dorado', 'Material de alta calidad', cat_id);
    END IF;
    
    -- Plata 925
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Plata 925' AND category_id = cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Plata 925', 'Material de alta calidad', cat_id);
    END IF;
  END LOOP;
END $$;

-- Subcategorías específicas para Piercings
DO $$
DECLARE
  piercing_cat_id UUID;
  subcat_count INTEGER;
BEGIN
  SELECT id INTO piercing_cat_id FROM categories WHERE name = 'Piercings' LIMIT 1;
  
  IF piercing_cat_id IS NOT NULL THEN
    -- Titanio
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Titanio' AND category_id = piercing_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Titanio', 'Material especializado para piercings', piercing_cat_id);
    END IF;
    
    -- Acero quirúrgico
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Acero quirúrgico' AND category_id = piercing_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Acero quirúrgico', 'Material especializado para piercings', piercing_cat_id);
    END IF;
    
    -- Oro blanco
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Oro blanco' AND category_id = piercing_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Oro blanco', 'Material especializado para piercings', piercing_cat_id);
    END IF;
    
    -- Plata
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Plata' AND category_id = piercing_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Plata', 'Material especializado para piercings', piercing_cat_id);
    END IF;
  END IF;
END $$;

-- Subcategorías específicas para Accesorios
DO $$
DECLARE
  accessory_cat_id UUID;
  subcat_count INTEGER;
BEGIN
  SELECT id INTO accessory_cat_id FROM categories WHERE name = 'Accesorios' LIMIT 1;
  
  IF accessory_cat_id IS NOT NULL THEN
    -- Varios materiales
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Varios materiales' AND category_id = accessory_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Varios materiales', 'Materiales variados para accesorios', accessory_cat_id);
    END IF;
    
    -- Acero inoxidable
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Acero inoxidable' AND category_id = accessory_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Acero inoxidable', 'Materiales variados para accesorios', accessory_cat_id);
    END IF;
    
    -- Aleaciones
    SELECT COUNT(*) INTO subcat_count FROM subcategories WHERE name = 'Aleaciones' AND category_id = accessory_cat_id;
    IF subcat_count = 0 THEN
      INSERT INTO subcategories (name, description, category_id) VALUES ('Aleaciones', 'Materiales variados para accesorios', accessory_cat_id);
    END IF;
  END IF;
END $$;

-- 6. VERIFICAR LOS CAMBIOS
SELECT 
  c.id, 
  c.name, 
  c.order_index,
  COUNT(s.id) as subcategories_count
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
GROUP BY c.id, c.name, c.order_index
ORDER BY c.order_index;

-- 7. MOSTRAR ESTRUCTURA COMPLETA
SELECT 
  c.name as category_name,
  c.order_index,
  s.name as subcategory_name
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
ORDER BY c.order_index, s.name;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================