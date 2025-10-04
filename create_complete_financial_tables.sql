-- =====================================================
-- SCRIPT COMPLETO: CREAR TODAS LAS TABLAS FINANCIERAS
-- =====================================================
-- Este script crea todas las tablas necesarias para el sistema financiero
-- =====================================================

-- Verificar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA CASH_CLOSURES (Cierres de Caja)
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closure_date DATE NOT NULL,
    opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_cash DECIMAL(10,2) NOT NULL,
    cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
    card_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
    transfer_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
    expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA FIXED_COSTS (Costos Fijos)
-- =====================================================
CREATE TABLE IF NOT EXISTS fixed_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    category VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA SALARY_WITHDRAWALS (Extracción de Sueldos)
-- =====================================================
CREATE TABLE IF NOT EXISTS salary_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) DEFAULT 'salary',
    description TEXT,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'check')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA EXPENSES (Gastos)
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA MONETARY_MOVEMENTS (Movimientos Monetarios)
-- =====================================================
CREATE TABLE IF NOT EXISTS monetary_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'withdrawal')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    notes TEXT,
    movement_date DATE DEFAULT CURRENT_DATE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas las tablas
DROP TRIGGER IF EXISTS update_cash_closures_updated_at ON cash_closures;
CREATE TRIGGER update_cash_closures_updated_at BEFORE UPDATE ON cash_closures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixed_costs_updated_at ON fixed_costs;
CREATE TRIGGER update_fixed_costs_updated_at BEFORE UPDATE ON fixed_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_withdrawals_updated_at ON salary_withdrawals;
CREATE TRIGGER update_salary_withdrawals_updated_at BEFORE UPDATE ON salary_withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monetary_movements_updated_at ON monetary_movements;
CREATE TRIGGER update_monetary_movements_updated_at BEFORE UPDATE ON monetary_movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Cash closures
CREATE INDEX IF NOT EXISTS idx_cash_closures_closure_date ON cash_closures(closure_date);
CREATE INDEX IF NOT EXISTS idx_cash_closures_created_at ON cash_closures(created_at);

-- Fixed costs
CREATE INDEX IF NOT EXISTS idx_fixed_costs_frequency ON fixed_costs(frequency);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_is_active ON fixed_costs(is_active);

-- Salary withdrawals
CREATE INDEX IF NOT EXISTS idx_salary_withdrawals_withdrawal_date ON salary_withdrawals(withdrawal_date);
CREATE INDEX IF NOT EXISTS idx_salary_withdrawals_employee_name ON salary_withdrawals(employee_name);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Monetary movements
CREATE INDEX IF NOT EXISTS idx_monetary_movements_type ON monetary_movements(type);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_movement_date ON monetary_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_category ON monetary_movements(category);

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================

-- Costos fijos de ejemplo
INSERT INTO fixed_costs (name, amount, frequency, category, description) VALUES 
('Alquiler local', 800.00, 'monthly', 'Operaciones', 'Alquiler mensual del local comercial'),
('Internet y telefonía', 45.00, 'monthly', 'Servicios', 'Servicios de comunicaciones'),
('Electricidad', 120.00, 'monthly', 'Servicios', 'Factura eléctrica mensual')
ON CONFLICT DO NOTHING;

-- Movimientos monetarios de ejemplo
INSERT INTO monetary_movements (type, amount, description, category, notes) VALUES 
('income', 2500.00, 'Inversión inicial', 'Capital', 'Aporte de capital del socio'),
('withdrawal', 300.00, 'Extracción para gastos personales', 'Personal', 'Gastos personales del propietario'),
('income', 800.00, 'Devolución de préstamo', 'Préstamos', 'Devolución de dinero prestado')
ON CONFLICT DO NOTHING;

-- Gastos de ejemplo
INSERT INTO expenses (description, amount, category, expense_date) VALUES 
('Compra de material de oficina', 45.50, 'Suministros', CURRENT_DATE - INTERVAL '2 days'),
('Combustible para delivery', 25.00, 'Transporte', CURRENT_DATE - INTERVAL '1 day'),
('Mantenimiento equipo', 75.00, 'Mantenimiento', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon
SELECT 
    'cash_closures' as tabla, 
    COUNT(*) as registros 
FROM cash_closures
UNION ALL
SELECT 
    'fixed_costs' as tabla, 
    COUNT(*) as registros 
FROM fixed_costs
UNION ALL
SELECT 
    'salary_withdrawals' as tabla, 
    COUNT(*) as registros 
FROM salary_withdrawals
UNION ALL
SELECT 
    'expenses' as tabla, 
    COUNT(*) as registros 
FROM expenses
UNION ALL
SELECT 
    'monetary_movements' as tabla, 
    COUNT(*) as registros 
FROM monetary_movements;

-- Mensaje de confirmación
SELECT '✅ Todas las tablas financieras creadas exitosamente!' as resultado;
SELECT '📊 Sistema financiero listo para usar' as estado;
SELECT '🔐 Función de cierre de caja operativa' as funcionalidad;