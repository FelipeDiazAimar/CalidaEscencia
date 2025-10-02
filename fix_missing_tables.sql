-- =====================================================
-- SCRIPT DE CORRECCIÓN: CREAR TABLAS FALTANTES
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- para crear las tablas que faltan
-- =====================================================

-- Verificar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar tipos ENUM necesarios
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla users si no existe (necesaria para las referencias)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'customer',
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de costos fijos
CREATE TABLE IF NOT EXISTS fixed_costs (
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

-- Crear tabla de extracciones de sueldo
CREATE TABLE IF NOT EXISTS salary_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de vistas de productos
CREATE TABLE IF NOT EXISTS product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    session_id VARCHAR(255), -- Para trackear sesiones únicas
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    view_date DATE DEFAULT CURRENT_DATE
);

-- Crear tabla de movimientos monetarios
CREATE TABLE IF NOT EXISTS monetary_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'withdrawal')), -- ingreso o extracción
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    notes TEXT,
    movement_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice único compuesto para evitar vistas duplicadas por día
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_views_unique_daily 
ON product_views (product_id, session_id, view_date);

-- Función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at en las nuevas tablas
DROP TRIGGER IF EXISTS update_fixed_costs_updated_at ON fixed_costs;
CREATE TRIGGER update_fixed_costs_updated_at BEFORE UPDATE ON fixed_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_withdrawals_updated_at ON salary_withdrawals;
CREATE TRIGGER update_salary_withdrawals_updated_at BEFORE UPDATE ON salary_withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monetary_movements_updated_at ON monetary_movements;
CREATE TRIGGER update_monetary_movements_updated_at BEFORE UPDATE ON monetary_movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_fixed_costs_is_active ON fixed_costs(is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX IF NOT EXISTS idx_salary_withdrawals_withdrawal_date ON salary_withdrawals(withdrawal_date);
CREATE INDEX IF NOT EXISTS idx_salary_withdrawals_person_name ON salary_withdrawals(person_name);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_product_views_session_id ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_type ON monetary_movements(type);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_movement_date ON monetary_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_category ON monetary_movements(category);

-- Insertar usuario administrador si no existe
INSERT INTO users (id, email, role, full_name) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@calidaescencia.com', 'admin', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Agregar algunos datos de prueba para costos fijos
INSERT INTO fixed_costs (name, amount, frequency, category, description) VALUES 
('Alquiler Local', 500.00, 'monthly', 'Operacional', 'Alquiler mensual del local comercial'),
('Internet y Servicios', 75.00, 'monthly', 'Operacional', 'Internet, teléfono y servicios básicos'),
('Seguro del Negocio', 120.00, 'monthly', 'Seguridad', 'Póliza de seguro comercial')
ON CONFLICT DO NOTHING;

-- Agregar algunos datos de prueba para extracciones de sueldo
INSERT INTO salary_withdrawals (person_name, amount, withdrawal_date, description) VALUES 
('Juan Pérez', 1200.00, CURRENT_DATE - 15, 'Sueldo mensual empleado principal'),
('María García', 950.00, CURRENT_DATE - 10, 'Sueldo mensual empleada medio tiempo')
ON CONFLICT DO NOTHING;

-- Agregar algunos datos de prueba para movimientos monetarios
INSERT INTO monetary_movements (type, amount, description, category, notes) VALUES 
('income', 2500.00, 'Ingreso por inversión inicial', 'Capital', 'Aporte de capital del socio'),
('withdrawal', 300.00, 'Extracción para gastos personales', 'Personal', 'Gastos personales del propietario'),
('income', 800.00, 'Devolución de préstamo', 'Préstamos', 'Devolución de dinero prestado')
ON CONFLICT DO NOTHING;

-- Verificación: Contar registros en las nuevas tablas
SELECT 'fixed_costs' as tabla, COUNT(*) as registros FROM fixed_costs
UNION ALL
SELECT 'salary_withdrawals' as tabla, COUNT(*) as registros FROM salary_withdrawals
UNION ALL
SELECT 'product_views' as tabla, COUNT(*) as registros FROM product_views
UNION ALL
SELECT 'monetary_movements' as tabla, COUNT(*) as registros FROM monetary_movements
UNION ALL
SELECT 'users' as tabla, COUNT(*) as registros FROM users;

-- Mensaje de confirmación
SELECT 'Tablas creadas exitosamente! Revisar las consultas anteriores para verificar.' as resultado;