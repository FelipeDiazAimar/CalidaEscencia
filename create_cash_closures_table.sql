-- =====================================================
-- SCRIPT: CREAR TABLA CASH_CLOSURES
-- =====================================================
-- Esta tabla es necesaria para la funcionalidad de cierre de caja
-- =====================================================

-- Verificar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de cierres de caja
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

-- Función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_cash_closures_updated_at ON cash_closures;
CREATE TRIGGER update_cash_closures_updated_at BEFORE UPDATE ON cash_closures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_cash_closures_closure_date ON cash_closures(closure_date);
CREATE INDEX IF NOT EXISTS idx_cash_closures_created_at ON cash_closures(created_at);

-- Verificación
SELECT 'cash_closures' as tabla, COUNT(*) as registros FROM cash_closures;

-- Mensaje de confirmación
SELECT 'Tabla cash_closures creada exitosamente!' as resultado;