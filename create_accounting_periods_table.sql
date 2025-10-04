-- =====================================================
-- SCRIPT: CREAR TABLA DE PERÍODOS CONTABLES
-- =====================================================
-- Esta tabla permitirá trackear los cierres de período
-- y filtrar datos por períodos específicos
-- =====================================================

-- Verificar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de períodos contables
CREATE TABLE IF NOT EXISTS accounting_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name VARCHAR(50) NOT NULL, -- ej: "Septiembre 2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed')), -- abierto o cerrado
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_salary_withdrawals DECIMAL(10,2) DEFAULT 0,
    total_monetary_movements DECIMAL(10,2) DEFAULT 0,
    items_sold INTEGER DEFAULT 0,
    profit_loss DECIMAL(10,2) DEFAULT 0,
    closure_notes TEXT,
    closure_date TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_accounting_periods_updated_at ON accounting_periods;
CREATE TRIGGER update_accounting_periods_updated_at BEFORE UPDATE ON accounting_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_accounting_periods_status ON accounting_periods(status);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_start_date ON accounting_periods(start_date);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_end_date ON accounting_periods(end_date);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_period_name ON accounting_periods(period_name);

-- Agregar columna period_id a las tablas existentes para referenciar el período
-- Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES accounting_periods(id);

-- Expenses (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES accounting_periods(id);
    END IF;
END $$;

-- Salary withdrawals (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'salary_withdrawals') THEN
        ALTER TABLE salary_withdrawals ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES accounting_periods(id);
    END IF;
END $$;

-- Monetary movements
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'monetary_movements') THEN
        ALTER TABLE monetary_movements ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES accounting_periods(id);
    END IF;
END $$;

-- Crear el período actual (abierto) si no existe
INSERT INTO accounting_periods (period_name, start_date, end_date, status, closure_notes)
SELECT 
    CONCAT(
        CASE EXTRACT(MONTH FROM CURRENT_DATE)
            WHEN 1 THEN 'Enero'
            WHEN 2 THEN 'Febrero'
            WHEN 3 THEN 'Marzo'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Mayo'
            WHEN 6 THEN 'Junio'
            WHEN 7 THEN 'Julio'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Septiembre'
            WHEN 10 THEN 'Octubre'
            WHEN 11 THEN 'Noviembre'
            WHEN 12 THEN 'Diciembre'
        END,
        ' ',
        EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    'open',
    'Período contable actual - creado automáticamente'
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_periods 
    WHERE status = 'open' 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
);

-- Verificación
SELECT 'accounting_periods' as tabla, COUNT(*) as registros FROM accounting_periods;

-- Mostrar períodos creados
SELECT 
    period_name,
    start_date,
    end_date,
    status,
    total_sales,
    total_expenses,
    profit_loss
FROM accounting_periods 
ORDER BY start_date DESC;

-- Mensaje de confirmación
SELECT 'Tabla accounting_periods creada exitosamente!' as resultado;
SELECT 'Agregadas columnas period_id a tablas relacionadas' as info_adicional;