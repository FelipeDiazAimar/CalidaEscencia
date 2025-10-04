-- =====================================================
-- SCRIPT PARA ACTUALIZAR TABLAS PARA SISTEMA FINANCIERO
-- =====================================================
-- Ejecutar este script después de supabase_tables.sql
-- =====================================================

-- Crear tabla de usuarios si no existe (requerida por las relaciones)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'customer',
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar datos de prueba para productos (para testing)
INSERT INTO categories (name, description) VALUES 
('Tecnología', 'Productos tecnológicos'),
('Accesorios', 'Accesorios varios')
ON CONFLICT DO NOTHING;

-- Obtener IDs de categorías para productos de prueba
DO $$
DECLARE
    tech_category_id UUID;
    accessories_category_id UUID;
BEGIN
    SELECT id INTO tech_category_id FROM categories WHERE name = 'Tecnología' LIMIT 1;
    SELECT id INTO accessories_category_id FROM categories WHERE name = 'Accesorios' LIMIT 1;
    
    -- Insertar productos de prueba si no existen
    INSERT INTO products (name, description, category_id, cost, price, is_active) VALUES 
    ('AirPods Pro 2da Generación', 'Auriculares inalámbricos premium con cancelación de ruido', tech_category_id, 18.50, 45.50, true),
    ('iPhone 15 Case', 'Funda protectora para iPhone 15', tech_category_id, 12.00, 30.00, true),
    ('Vidrios Templados', 'Protector de pantalla de vidrio templado', accessories_category_id, 0.65, 3.25, true),
    ('Cable USB-C', 'Cable de carga USB-C premium', tech_category_id, 2.50, 8.00, true),
    ('Soporte para teléfono', 'Soporte ajustable para escritorio', accessories_category_id, 3.20, 12.50, true)
    ON CONFLICT DO NOTHING;
END $$;

-- Crear inventario inicial para productos
INSERT INTO product_inventory (product_id, quantity)
SELECT p.id, 50 + (RANDOM() * 100)::INTEGER 
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_inventory pi WHERE pi.product_id = p.id
);

-- Agregar algunas vistas de productos de prueba (simulando actividad)
DO $$
DECLARE
    product_record RECORD;
    i INTEGER;
    session_counter INTEGER := 1;
BEGIN
    FOR product_record IN SELECT id FROM products LIMIT 5 LOOP
        -- Agregar vistas aleatorias en los últimos 30 días
        FOR i IN 1..50 LOOP
            INSERT INTO product_views (product_id, session_id, viewed_at) VALUES (
                product_record.id,
                'session_' || session_counter,
                NOW() - (RANDOM() * INTERVAL '30 days')
            ) ON CONFLICT DO NOTHING;
            session_counter := session_counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Agregar algunas ventas de prueba
DO $$
DECLARE
    sale_id UUID;
    product_record RECORD;
    i INTEGER;
BEGIN
    FOR i IN 1..20 LOOP
        -- Crear venta
        INSERT INTO sales (
            customer_name, 
            subtotal, 
            total_amount, 
            payment_method, 
            payment_status, 
            sale_status,
            created_at
        ) VALUES (
            'Cliente ' || i,
            25.00 + (RANDOM() * 100),
            25.00 + (RANDOM() * 100),
            (ARRAY['cash', 'card', 'transfer'])[1 + (RANDOM() * 2)::INTEGER],
            'paid',
            'confirmed',
            NOW() - (RANDOM() * INTERVAL '30 days')
        ) RETURNING id INTO sale_id;
        
        -- Agregar items a la venta (1-3 productos aleatorios)
        FOR product_record IN 
            SELECT id, price, cost FROM products 
            ORDER BY RANDOM() 
            LIMIT 1 + (RANDOM() * 2)::INTEGER 
        LOOP
            INSERT INTO sale_items (
                sale_id,
                product_id,
                quantity,
                unit_price,
                unit_cost,
                total_price,
                total_cost
            ) VALUES (
                sale_id,
                product_record.id,
                1 + (RANDOM() * 3)::INTEGER,
                product_record.price,
                product_record.cost,
                product_record.price * (1 + (RANDOM() * 3)::INTEGER),
                product_record.cost * (1 + (RANDOM() * 3)::INTEGER)
            );
        END LOOP;
    END LOOP;
END $$;

-- Agregar algunos gastos de prueba
INSERT INTO expenses (category, description, amount, expense_date, payment_method) VALUES 
('Operacional', 'Pago de electricidad', 85.50, CURRENT_DATE - 5, 'transfer'),
('Marketing', 'Publicidad en redes sociales', 150.00, CURRENT_DATE - 10, 'card'),
('Inventario', 'Compra de productos', 500.00, CURRENT_DATE - 15, 'cash'),
('Operacional', 'Internet y telefonía', 45.00, CURRENT_DATE - 3, 'transfer'),
('Mantenimiento', 'Reparación de equipo', 75.00, CURRENT_DATE - 8, 'cash');

-- Agregar algunos costos fijos de prueba
INSERT INTO fixed_costs (name, amount, frequency, category, description) VALUES 
('Alquiler Local', 500.00, 'monthly', 'Operacional', 'Alquiler mensual del local comercial'),
('Internet y Servicios', 75.00, 'monthly', 'Operacional', 'Internet, teléfono y servicios básicos'),
('Seguro del Negocio', 120.00, 'monthly', 'Seguridad', 'Póliza de seguro comercial'),
('Software POS', 25.00, 'monthly', 'Tecnología', 'Licencia mensual del sistema de ventas');

-- Agregar algunas extracciones de sueldo de prueba
INSERT INTO salary_withdrawals (person_name, amount, withdrawal_date, description) VALUES 
('Juan Pérez', 1200.00, CURRENT_DATE - 15, 'Sueldo mensual empleado principal'),
('María García', 950.00, CURRENT_DATE - 10, 'Sueldo mensual empleada medio tiempo'),
('Carlos López', 800.00, CURRENT_DATE - 5, 'Pago por servicios de contabilidad'),
('Ana Rodríguez', 600.00, CURRENT_DATE - 20, 'Bono por ventas del mes');

-- Actualizar estadísticas de ventas en la tabla sales
UPDATE sales SET 
    subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM sale_items WHERE sale_id = sales.id),
    total_amount = (SELECT COALESCE(SUM(total_price), 0) FROM sale_items WHERE sale_id = sales.id)
WHERE id IN (SELECT DISTINCT sale_id FROM sale_items);

-- Verificar que las vistas funcionen correctamente
SELECT 'Verificando vista product_profitability...' as status;
SELECT COUNT(*) as products_with_stats FROM product_profitability;

SELECT 'Script completado exitosamente!' as status;