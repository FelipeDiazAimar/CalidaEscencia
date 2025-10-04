-- =====================================================
-- MIGRACIÓN: CREAR TABLA PARA PEDIDOS DE STOCK
-- =====================================================
-- Ejecutar este SQL en el SQL Editor de Supabase
-- =====================================================

-- 1. Crear tabla para pedidos de stock
CREATE TABLE IF NOT EXISTS stock_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  total_items INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  total_potential_income DECIMAL(10,2) DEFAULT 0,
  total_potential_profit DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla para items de pedidos de stock
CREATE TABLE IF NOT EXISTS stock_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_order_id UUID NOT NULL REFERENCES stock_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL, -- Denormalizado para historial
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0, -- Precio de venta esperado
  total_potential_income DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_stock_orders_order_date ON stock_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_stock_orders_status ON stock_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_orders_created_at ON stock_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_order_items_stock_order_id ON stock_order_items(stock_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_order_items_product_id ON stock_order_items(product_id);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para stock_orders
DROP TRIGGER IF EXISTS update_stock_orders_updated_at ON stock_orders;
CREATE TRIGGER update_stock_orders_updated_at
    BEFORE UPDATE ON stock_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Función para actualizar totales del pedido cuando se insertan/actualizan items
CREATE OR REPLACE FUNCTION update_stock_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular totales del pedido
    UPDATE stock_orders 
    SET 
        total_items = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM stock_order_items 
            WHERE stock_order_id = COALESCE(NEW.stock_order_id, OLD.stock_order_id)
        ),
        total_cost = (
            SELECT COALESCE(SUM(total_cost), 0) 
            FROM stock_order_items 
            WHERE stock_order_id = COALESCE(NEW.stock_order_id, OLD.stock_order_id)
        ),
        total_potential_income = (
            SELECT COALESCE(SUM(total_potential_income), 0) 
            FROM stock_order_items 
            WHERE stock_order_id = COALESCE(NEW.stock_order_id, OLD.stock_order_id)
        ),
        total_potential_profit = (
            SELECT COALESCE(SUM(total_potential_income - total_cost), 0) 
            FROM stock_order_items 
            WHERE stock_order_id = COALESCE(NEW.stock_order_id, OLD.stock_order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.stock_order_id, OLD.stock_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Crear triggers para actualizar totales automáticamente
DROP TRIGGER IF EXISTS trigger_update_stock_order_totals_insert ON stock_order_items;
CREATE TRIGGER trigger_update_stock_order_totals_insert
    AFTER INSERT ON stock_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_order_totals();

DROP TRIGGER IF EXISTS trigger_update_stock_order_totals_update ON stock_order_items;
CREATE TRIGGER trigger_update_stock_order_totals_update
    AFTER UPDATE ON stock_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_order_totals();

DROP TRIGGER IF EXISTS trigger_update_stock_order_totals_delete ON stock_order_items;
CREATE TRIGGER trigger_update_stock_order_totals_delete
    AFTER DELETE ON stock_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_order_totals();

-- 8. Función para actualizar stock cuando un pedido es marcado como recibido
CREATE OR REPLACE FUNCTION update_product_stock_on_order_received()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar stock si el estado cambió a 'received'
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        -- Actualizar stock de todos los productos del pedido
        UPDATE products 
        SET stock = stock + soi.quantity,
            updated_at = NOW()
        FROM stock_order_items soi
        WHERE products.id = soi.product_id 
        AND soi.stock_order_id = NEW.id;
        
        RAISE NOTICE 'Stock actualizado para pedido: %', NEW.id;
    END IF;
    
    -- Si el estado cambió de 'received' a otro, revertir el stock
    IF OLD.status = 'received' AND NEW.status != 'received' THEN
        -- Revertir stock de todos los productos del pedido
        UPDATE products 
        SET stock = GREATEST(0, stock - soi.quantity),
            updated_at = NOW()
        FROM stock_order_items soi
        WHERE products.id = soi.product_id 
        AND soi.stock_order_id = NEW.id;
        
        RAISE NOTICE 'Stock revertido para pedido: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para actualizar stock automáticamente
DROP TRIGGER IF EXISTS trigger_update_stock_on_order_received ON stock_orders;
CREATE TRIGGER trigger_update_stock_on_order_received
    AFTER UPDATE OF status ON stock_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_order_received();

-- 10. Habilitar RLS (Row Level Security)
ALTER TABLE stock_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_order_items ENABLE ROW LEVEL SECURITY;

-- 11. Crear políticas de seguridad
CREATE POLICY "Users can view all stock orders" ON stock_orders
    FOR SELECT USING (true);

CREATE POLICY "Users can insert stock orders" ON stock_orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update stock orders" ON stock_orders
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete stock orders" ON stock_orders
    FOR DELETE USING (true);

CREATE POLICY "Users can view all stock order items" ON stock_order_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert stock order items" ON stock_order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update stock order items" ON stock_order_items
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete stock order items" ON stock_order_items
    FOR DELETE USING (true);

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar un pedido de ejemplo
-- INSERT INTO stock_orders (order_date, status, notes) 
-- VALUES (CURRENT_DATE, 'pending', 'Pedido de ejemplo');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename IN ('stock_orders', 'stock_order_items')
ORDER BY tablename;

-- Verificar triggers
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table IN ('stock_orders', 'stock_order_items')
ORDER BY event_object_table, trigger_name;