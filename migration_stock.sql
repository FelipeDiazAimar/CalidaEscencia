-- =====================================================
-- MIGRACIÓN: AGREGAR STOCK Y PRODUCTOS DESTACADOS
-- =====================================================
-- Ejecutar este SQL en el SQL Editor de Supabase
-- =====================================================

-- 1. Agregar columna stock a la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 2. Agregar columna is_featured a la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 3. Actualizar productos existentes con stock inicial
UPDATE products SET stock = 100 WHERE stock IS NULL OR stock = 0;

-- 4. Crear tabla product_sales para registrar ventas individuales
CREATE TABLE IF NOT EXISTS product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Crear índices para product_sales
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_sale_date ON product_sales(sale_date);

-- 6. Crear función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Disminuir stock cuando se registra una venta
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- Ajustar stock cuando se actualiza una venta
  IF TG_OP = 'UPDATE' THEN
    -- Restaurar stock anterior
    UPDATE products 
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
    
    -- Aplicar nueva cantidad
    UPDATE products 
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- Restaurar stock cuando se elimina una venta
  IF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para actualización automática de stock
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_sale ON product_sales;
CREATE TRIGGER trigger_update_product_stock_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON product_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_sale();

-- 8. Habilitar RLS en product_sales
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS para product_sales
CREATE POLICY "Users can view all product sales" ON product_sales
  FOR SELECT USING (true);

CREATE POLICY "Users can insert product sales" ON product_sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update product sales" ON product_sales
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete product sales" ON product_sales
  FOR DELETE USING (true);

-- 10. Crear trigger para updated_at en product_sales
CREATE TRIGGER update_product_sales_updated_at BEFORE UPDATE ON product_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Otorgar permisos necesarios
GRANT ALL ON product_sales TO authenticated;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- Verificar que todo se aplicó correctamente:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name IN ('stock', 'is_featured');

-- SELECT table_name FROM information_schema.tables WHERE table_name = 'product_sales';