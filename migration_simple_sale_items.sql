-- =====================================================
-- MIGRACIÓN SIMPLE: HACER SALE_ID OPCIONAL EN SALE_ITEMS
-- =====================================================
-- Ejecuta esto en Supabase SQL Editor para permitir ventas directas
-- =====================================================

-- Hacer que sale_id sea opcional en sale_items para permitir ventas directas
ALTER TABLE sale_items ALTER COLUMN sale_id DROP NOT NULL;

-- Agregar las columnas stock e is_featured a products si no existen
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Agregar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON sale_items(created_at);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Establecer stock inicial para productos existentes
UPDATE products SET stock = 10 WHERE stock = 0 OR stock IS NULL;

-- Función para actualizar stock automáticamente cuando se registra una venta
CREATE OR REPLACE FUNCTION update_product_stock_on_sale_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar stock si hay un product_id
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products 
        SET stock = stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        
        -- Verificar que el stock no sea negativo
        IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto ID: %', NEW.product_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock automáticamente
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale_item ON sale_items;
CREATE TRIGGER trigger_update_stock_on_sale_item
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_sale_item();

-- Función para restaurar stock cuando se elimina una venta
CREATE OR REPLACE FUNCTION restore_product_stock_on_sale_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo restaurar stock si hay un product_id
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products 
        SET stock = stock + OLD.quantity,
            updated_at = NOW()
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para restaurar stock cuando se elimina una venta
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete
    AFTER DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION restore_product_stock_on_sale_item_delete();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que sale_id sea nullable ahora
SELECT 
    column_name, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
AND column_name = 'sale_id';

-- Verificar que las columnas de productos existan
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('stock', 'is_featured');

-- Mostrar algunos productos con stock
SELECT id, name, price, stock, is_featured 
FROM products 
LIMIT 5;

-- =====================================================
-- MENSAJE DE ÉXITO
-- =====================================================
SELECT 'Migración completada! Ahora puedes registrar ventas directas en sale_items.' as status;