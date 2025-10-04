-- =====================================================
-- SCRIPT SIMPLIFICADO PARA AGREGAR ORDENAMIENTO
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase paso a paso
-- =====================================================

-- PASO 1: Agregar campo order_index
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- PASO 2: Crear índice
CREATE INDEX IF NOT EXISTS idx_categories_order_index 
ON categories(order_index);

-- PASO 3: Asignar orden a categorías existentes
WITH ordered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) as new_order
  FROM categories
  WHERE order_index = 0 OR order_index IS NULL
)
UPDATE categories 
SET order_index = ordered_categories.new_order
FROM ordered_categories
WHERE categories.id = ordered_categories.id;

-- PASO 4: Verificar resultado
SELECT id, name, order_index, created_at 
FROM categories 
ORDER BY order_index;

-- =====================================================
-- SI QUIERES AGREGAR CATEGORÍAS DE EJEMPLO:
-- =====================================================

-- PASO 5A: Obtener el siguiente order_index disponible
SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM categories;

-- PASO 5B: Insertar categorías básicas (ajusta el order_index según el resultado anterior)
INSERT INTO categories (name, description, order_index) 
VALUES 
  ('Aros', 'Aros de diferentes materiales y estilos', 1),
  ('Collares', 'Collares y cadenas elegantes', 2),
  ('Anillos', 'Anillos para toda ocasión', 3),
  ('Pulseras', 'Pulseras y brazaletes modernos', 4),
  ('Piercings', 'Piercings de alta calidad', 5),
  ('Accesorios', 'Accesorios complementarios', 6)
ON CONFLICT (name) DO NOTHING;

-- PASO 6: Verificar categorías finales
SELECT id, name, order_index 
FROM categories 
ORDER BY order_index;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================