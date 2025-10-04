-- =====================================================
-- AGREGAR COLUMNA STOCK Y CREAR TABLA SALES
-- =====================================================
-- Ejecutar estos comandos en el SQL Editor de Supabase
-- =====================================================

-- 1. Agregar columna stock a la tabla products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Agregar comentario para documentación
COMMENT ON COLUMN products.stock IS 'Cantidad disponible en inventario del producto';

-- 2. Crear tabla sales si no existe
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL, -- Nombre del producto al momento de la venta
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para sales
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Crear función para manejar stock automáticamente
CREATE OR REPLACE FUNCTION handle_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock cuando se crea una venta
    IF TG_OP = 'INSERT' THEN
        UPDATE products 
        SET stock = stock - NEW.quantity
        WHERE id = NEW.product_id;
        
        -- Verificar que el stock no sea negativo
        IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto';
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Restaurar stock cuando se elimina una venta
    IF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET stock = stock + OLD.quantity
        WHERE id = OLD.product_id;
        
        RETURN OLD;
    END IF;
    
    -- Ajustar stock cuando se actualiza una venta
    IF TG_OP = 'UPDATE' THEN
        -- Restaurar stock anterior
        UPDATE products 
        SET stock = stock + OLD.quantity
        WHERE id = OLD.product_id;
        
        -- Aplicar nuevo stock
        UPDATE products 
        SET stock = stock - NEW.quantity
        WHERE id = NEW.product_id;
        
        -- Verificar que el stock no sea negativo
        IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto';
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 7. Crear trigger para manejar stock automáticamente
DROP TRIGGER IF EXISTS trigger_handle_stock_on_sale ON sales;
CREATE TRIGGER trigger_handle_stock_on_sale
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION handle_stock_on_sale();

-- 8. Agregar algunas políticas de seguridad básicas (RLS)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT a todos los usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON sales
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir INSERT a todos los usuarios autenticados
CREATE POLICY "Enable insert access for authenticated users" ON sales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir UPDATE a todos los usuarios autenticados
CREATE POLICY "Enable update access for authenticated users" ON sales
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir DELETE a todos los usuarios autenticados
CREATE POLICY "Enable delete access for authenticated users" ON sales
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Actualizar stock de algunos productos existentes para pruebas
-- Descomenta las líneas siguientes si quieres agregar stock a productos existentes

-- UPDATE products SET stock = 10 WHERE is_active = true LIMIT 5;
-- UPDATE products SET stock = 5 WHERE is_active = true AND stock = 0 LIMIT 3;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la columna stock se agregó correctamente
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'stock';

-- Verificar que la tabla sales se creó correctamente
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sales' 
-- ORDER BY ordinal_position;