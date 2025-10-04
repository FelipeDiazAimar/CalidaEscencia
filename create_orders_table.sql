-- =====================================================
-- CREAR TABLA DE ÓRDENES Y SISTEMA DE PEDIDOS
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. CREAR TABLA DE ÓRDENES
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TABLA DE ITEMS DE ÓRDENES
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL, -- Guardamos el nombre por si el producto se elimina
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA MEJORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 4. CREAR FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. CREAR TRIGGER PARA ACTUALIZAR updated_at EN ORDERS
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. CREAR FUNCIÓN PARA CALCULAR TOTAL DE ORDEN AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el total de la orden basado en los items
  UPDATE orders 
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM order_items 
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 7. CREAR TRIGGERS PARA CALCULAR TOTAL AUTOMÁTICAMENTE
CREATE TRIGGER calculate_order_total_on_insert
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();

CREATE TRIGGER calculate_order_total_on_update
  AFTER UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();

CREATE TRIGGER calculate_order_total_on_delete
  AFTER DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();

-- 8. AGREGAR COMENTARIOS DESCRIPTIVOS
COMMENT ON TABLE orders IS 'Tabla de órdenes/pedidos de clientes';
COMMENT ON TABLE order_items IS 'Items individuales dentro de cada orden';
COMMENT ON COLUMN orders.status IS 'Estado del pedido: pending, confirmed, preparing, ready, delivered, cancelled';
COMMENT ON COLUMN orders.whatsapp_sent_at IS 'Timestamp cuando se envió el pedido por WhatsApp';
COMMENT ON COLUMN order_items.subtotal IS 'Precio unitario multiplicado por cantidad';

-- 9. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- Descomenta las siguientes líneas si quieres datos de prueba

/*
-- Orden de ejemplo
INSERT INTO orders (customer_name, customer_phone, customer_email, status, notes) 
VALUES ('María González', '+503 7123-4567', 'maria@email.com', 'pending', 'Entrega en la tarde');

-- Items de ejemplo (reemplaza los UUIDs con IDs reales de productos)
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  (SELECT id FROM orders WHERE customer_name = 'María González'),
  p.id,
  p.name,
  p.price,
  2,
  p.price * 2
FROM products p 
LIMIT 2;
*/

-- 10. VERIFICAR LAS TABLAS CREADAS
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 
-- • La tabla orders almacena información del cliente y estado
-- • La tabla order_items almacena los productos en cada orden
-- • Los totales se calculan automáticamente con triggers
-- • El campo whatsapp_sent_at marca cuando se envió por WhatsApp
-- • Los estados permiten seguimiento completo del pedido
-- 
-- Estados de pedido:
-- - pending: Recién creado, esperando confirmación
-- - confirmed: Confirmado por WhatsApp
-- - preparing: En preparación
-- - ready: Listo para entrega
-- - delivered: Entregado
-- - cancelled: Cancelado
-- 
-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================