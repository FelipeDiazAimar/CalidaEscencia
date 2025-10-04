-- Crear tabla para almacenar información de pagos de Mercado Pago
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL, -- ID del pago de Mercado Pago
  status VARCHAR(50) NOT NULL, -- approved, pending, rejected, etc.
  status_detail VARCHAR(255), -- Detalle del estado
  transaction_amount DECIMAL(10,2), -- Monto de la transacción
  currency_id VARCHAR(10) DEFAULT 'USD', -- Moneda
  external_reference VARCHAR(255), -- Referencia externa (orden)
  payer_email VARCHAR(255), -- Email del pagador
  payment_method_id VARCHAR(100), -- Método de pago (visa, master, etc.)
  payment_type_id VARCHAR(100), -- Tipo de pago (credit_card, debit_card, etc.)
  raw_data JSONB, -- Datos completos del pago de Mercado Pago
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments (payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_reference ON payments (external_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- RLS (Row Level Security) - opcional, descomenta si necesitas seguridad por filas
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción desde el webhook (requiere service role)
-- CREATE POLICY "Allow service role to insert payments" ON payments
--   FOR INSERT WITH CHECK (true);

-- Política para permitir lectura a usuarios autenticados
-- CREATE POLICY "Allow authenticated users to read payments" ON payments
--   FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE payments IS 'Tabla para almacenar información de pagos procesados por Mercado Pago';
COMMENT ON COLUMN payments.payment_id IS 'ID único del pago en Mercado Pago';
COMMENT ON COLUMN payments.external_reference IS 'Referencia externa para vincular con órdenes';
COMMENT ON COLUMN payments.raw_data IS 'Datos completos del webhook de Mercado Pago en formato JSON';