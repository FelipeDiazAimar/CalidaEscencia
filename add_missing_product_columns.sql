-- Migración: Añadir columnas faltantes a la tabla products
-- Estas columnas están definidas en los tipos TypeScript pero faltan en la BD

-- Añadir columna is_new (indicador de producto nuevo)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- Añadir columna is_featured (indicador de producto destacado)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Añadir columna hover_image (imagen que se muestra al hacer hover)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hover_image TEXT;

-- Añadir columna stock (cantidad disponible en inventario)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Comentarios sobre las nuevas columnas
COMMENT ON COLUMN products.is_new IS 'Indica si el producto es nuevo (para mostrar badge "Nuevo")';
COMMENT ON COLUMN products.is_featured IS 'Indica si el producto está destacado (aparece en home)';
COMMENT ON COLUMN products.hover_image IS 'URL de imagen que se muestra al hacer hover sobre el producto';
COMMENT ON COLUMN products.stock IS 'Cantidad disponible en inventario del producto';

-- Actualizar productos recientes como "nuevos" (últimos 30 días)
UPDATE products 
SET is_new = true 
WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days');

-- Crear índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Verificar que las columnas fueron creadas correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name IN ('is_new', 'is_featured', 'hover_image', 'stock')
ORDER BY column_name;