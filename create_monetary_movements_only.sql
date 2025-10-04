-- =====================================================
-- SCRIPT SIMPLIFICADO: CREAR SOLO TABLA MONETARY_MOVEMENTS
-- =====================================================
-- Si solo necesitas crear la tabla de movimientos monetarios
-- =====================================================

-- Verificar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de movimientos monetarios
CREATE TABLE IF NOT EXISTS monetary_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'withdrawal')), -- ingreso o extracción
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    notes TEXT,
    movement_date DATE DEFAULT CURRENT_DATE,
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
DROP TRIGGER IF EXISTS update_monetary_movements_updated_at ON monetary_movements;
CREATE TRIGGER update_monetary_movements_updated_at BEFORE UPDATE ON monetary_movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_monetary_movements_type ON monetary_movements(type);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_movement_date ON monetary_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_monetary_movements_category ON monetary_movements(category);

-- Agregar algunos datos de prueba
INSERT INTO monetary_movements (type, amount, description, category, notes) VALUES 
('income', 2500.00, 'Ingreso por inversión inicial', 'Capital', 'Aporte de capital del socio'),
('withdrawal', 300.00, 'Extracción para gastos personales', 'Personal', 'Gastos personales del propietario'),
('income', 800.00, 'Devolución de préstamo', 'Préstamos', 'Devolución de dinero prestado')
ON CONFLICT DO NOTHING;

-- Verificación
SELECT 'monetary_movements' as tabla, COUNT(*) as registros FROM monetary_movements;

-- Mensaje de confirmación
SELECT 'Tabla monetary_movements creada exitosamente!' as resultado;