-- =====================================================
-- SUPABASE TABLES CREATION SCRIPT
-- =====================================================
-- Ejecutar estos comandos en el SQL Editor de Supabase
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
CREATE TYPE user_role AS ENUM ('admin', 'customer');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'partial');
CREATE TYPE sale_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment');
CREATE TYPE reference_type AS ENUM ('sale', 'purchase', 'adjustment', 'production');
CREATE TYPE unit_type AS ENUM ('piece', 'gram', 'meter', 'liter');

-- =====================================================
-- TABLAS DE PRODUCTOS
-- =====================================================

-- Categorías
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategorías
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modelos
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    profile_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nombres
CREATE TABLE names (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materiales
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    unit_type unit_type DEFAULT 'piece',
    current_stock DECIMAL(10,3) DEFAULT 0,
    min_stock DECIMAL(10,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    name_id UUID REFERENCES names(id) ON DELETE SET NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    cover_image TEXT,
    product_images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación productos-materiales
CREATE TABLE product_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, material_id)
);

-- =====================================================
-- INVENTARIO
-- =====================================================

-- Movimientos de stock
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    previous_stock DECIMAL(10,3) NOT NULL,
    new_stock DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reason TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventario de productos
CREATE TABLE product_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id)
);

-- =====================================================
-- VENTAS
-- =====================================================

-- Ventas
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    sale_status sale_status DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de venta
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANZAS
-- =====================================================

-- Cierres de caja
CREATE TABLE cash_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closure_date DATE NOT NULL,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    transfer_sales DECIMAL(10,2) DEFAULT 0,
    other_income DECIMAL(10,2) DEFAULT 0,
    total_income DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    cash_withdrawals DECIMAL(10,2) DEFAULT 0,
    expected_cash DECIMAL(10,2) DEFAULT 0,
    actual_cash DECIMAL(10,2) DEFAULT 0,
    difference DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    is_closed BOOLEAN DEFAULT false,
    closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(closure_date)
);

-- Gastos
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method payment_method,
    receipt_image TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingresos
CREATE TABLE income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL,
    payment_method payment_method,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salarios
CREATE TABLE salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    base_salary DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) DEFAULT 0,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    payment_date DATE,
    payment_method payment_method,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Costos fijos
CREATE TABLE fixed_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'monthly', -- monthly, weekly, daily
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracciones de sueldo
CREATE TABLE salary_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_date DATE NOT NULL,
    description TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vistas de productos
CREATE TABLE product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- Para trackear sesiones únicas
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, session_id, DATE(viewed_at)) -- Una vista por producto por sesión por día
);

-- =====================================================
-- CARRUSEL
-- =====================================================

-- Imágenes del carrusel principal
CREATE TABLE carousel_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alt_text VARCHAR(255),
    image_url TEXT NOT NULL,
    original_image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    crop_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FAQS (PREGUNTAS FRECUENTES)
-- =====================================================

-- Tabla de FAQs
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMPRAS
-- =====================================================

-- Órdenes de compra
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact VARCHAR(255),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    order_status order_status DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de órdenes de compra
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VISTAS
-- =====================================================

-- Vista de resumen de ventas
CREATE VIEW sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    SUM(
        COALESCE((
            SELECT SUM(si.total_cost) 
            FROM sale_items si 
            WHERE si.sale_id = s.id
        ), 0)
    ) as total_cost,
    SUM(total_amount) - SUM(
        COALESCE((
            SELECT SUM(si.total_cost) 
            FROM sale_items si 
            WHERE si.sale_id = s.id
        ), 0)
    ) as gross_profit,
    AVG(total_amount) as avg_sale_amount
FROM sales s
WHERE sale_status = 'confirmed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Vista de materiales con stock bajo
CREATE VIEW low_stock_materials AS
SELECT 
    *,
    (current_stock - min_stock) as stock_difference
FROM materials
WHERE current_stock <= min_stock
ORDER BY stock_difference ASC;

-- Vista de rentabilidad de productos con datos reales
CREATE VIEW product_profitability AS
SELECT 
    p.id,
    p.name,
    p.price as selling_price,
    p.cost as production_cost,
    (p.price - p.cost) as gross_profit,
    CASE 
        WHEN p.price > 0 THEN 
            ROUND(
                (((p.price - p.cost) / p.price) * 100)::numeric, 2
            )
        ELSE 0
    END as profit_margin_percentage,
    COALESCE(pi.quantity, 0) as current_stock,
    COALESCE((
        SELECT COUNT(*) 
        FROM product_views pv 
        WHERE pv.product_id = p.id 
        AND pv.viewed_at >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) as views_last_30_days,
    COALESCE((
        SELECT SUM(si.quantity) 
        FROM sale_items si 
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = p.id 
        AND s.sale_status = 'confirmed'
        AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) as sales_last_30_days,
    COALESCE((
        SELECT COUNT(DISTINCT s.id) 
        FROM sale_items si 
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = p.id 
        AND s.sale_status = 'confirmed'
        AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) as orders_last_30_days
FROM products p
LEFT JOIN product_inventory pi ON p.id = pi.product_id
WHERE p.is_active = true
ORDER BY profit_margin_percentage DESC;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_names_updated_at BEFORE UPDATE ON names
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_closures_updated_at BEFORE UPDATE ON cash_closures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON income
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_costs_updated_at BEFORE UPDATE ON fixed_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_withdrawals_updated_at BEFORE UPDATE ON salary_withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para carousel_images
CREATE TRIGGER update_carousel_images_updated_at BEFORE UPDATE ON carousel_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para faqs
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar last_updated en product_inventory
CREATE TRIGGER update_product_inventory_last_updated BEFORE UPDATE ON product_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices en productos
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX idx_products_model_id ON products(model_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Índices en ventas
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_sale_status ON sales(sale_status);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);

-- Índices en items de venta
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Índices en movimientos de stock
CREATE INDEX idx_stock_movements_material_id ON stock_movements(material_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Índices en gastos
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Índices en costos fijos
CREATE INDEX idx_fixed_costs_is_active ON fixed_costs(is_active);
CREATE INDEX idx_fixed_costs_category ON fixed_costs(category);

-- Índices en extracciones de sueldo
CREATE INDEX idx_salary_withdrawals_withdrawal_date ON salary_withdrawals(withdrawal_date);
CREATE INDEX idx_salary_withdrawals_person_name ON salary_withdrawals(person_name);

-- Índices en vistas de productos
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX idx_product_views_session_id ON product_views(session_id);

-- Índices en carousel_images
CREATE INDEX idx_carousel_images_is_active ON carousel_images(is_active);
CREATE INDEX idx_carousel_images_order_index ON carousel_images(order_index);

-- Índices en faqs
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_is_active ON faqs(is_active);
CREATE INDEX idx_faqs_order_index ON faqs(order_index);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) - OPCIONAL
-- =====================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Usuario administrador inicial
INSERT INTO users (id, email, role, full_name) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@calidaescencia.com', 'admin', 'Administrador');

-- Categorías iniciales
INSERT INTO categories (name, description) VALUES 
('Aros', 'Pendientes y aretes'),
('Collares', 'Collares y cadenas'),
('Anillos', 'Anillos de diferentes estilos'),
('Pulseras', 'Pulseras y brazaletes'),
('Piercings', 'Joyería para piercings'),
('Accesorios', 'Otros accesorios de joyería');

-- Materiales básicos
INSERT INTO materials (name, cost_per_unit, unit_type) VALUES 
('Oro 18k', 50.00, 'gram'),
('Plata 925', 5.00, 'gram'),
('Acero Inoxidable', 2.00, 'gram'),
('Cristales', 1.00, 'piece'),
('Perlas', 3.00, 'piece');

-- Imágenes iniciales del carrusel
INSERT INTO carousel_images (title, description, alt_text, image_url, is_active, order_index) VALUES 
('Colección Verano', 'Brilla con nuestra nueva colección de verano.', 'Elegante collar de oro', 'https://picsum.photos/1200/800?v=1', true, 1),
('Anillos Únicos', 'Encuentra el anillo perfecto para cada ocasión.', 'Anillos de plata con gemas', 'https://picsum.photos/1200/800?v=2', true, 2),
('Detalles que Enamoran', 'Aretes diseñados para resaltar tu belleza.', 'Aretes minimalistas', 'https://picsum.photos/1200/800?v=3', true, 3);

-- Datos iniciales de FAQs
INSERT INTO faqs (question, answer, category, is_active, order_index) VALUES 
('¿Cuáles son los horarios de atención?', 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM y sábados de 10:00 AM a 4:00 PM.', 'general', true, 1),
('¿Ofrecen garantía en sus productos?', 'Sí, todos nuestros productos cuentan con garantía de 6 meses contra defectos de fabricación.', 'productos', true, 2),
('¿Cuánto tiempo tardan en entregar un pedido?', 'Los pedidos se entregan entre 3-5 días hábiles dentro de la ciudad y 7-10 días hábiles a nivel nacional.', 'pedidos', true, 3),
('¿Qué métodos de pago aceptan?', 'Aceptamos efectivo, tarjetas de crédito/débito, transferencias bancarias y pagos móviles.', 'pagos', true, 4),
('¿Cómo debo cuidar mis joyas de plata?', 'Para mantener tus joyas de plata en buen estado, límpialas regularmente con un paño suave y guárdalas en un lugar seco.', 'cuidados', true, 5);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================