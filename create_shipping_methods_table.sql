-- Crear tabla para métodos de envío
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Información del método de envío
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR(50), -- Nombre del icono de Lucide

  -- Control de visualización
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Crear índices para shipping_methods
CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON shipping_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_order ON shipping_methods(display_order);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_created_at ON shipping_methods(created_at DESC);

-- Insertar métodos de envío por defecto
INSERT INTO shipping_methods (title, description, icon_name, display_order) VALUES
  (
    'Envíos a todo el país',
    'Entregas en todo El Salvador en 3-5 días hábiles. Costo de envío estándar de Consultar cotización. Envío gratis a sucursal comprando $70000 o más!.',
    'Truck',
    1
  ),
  (
    'Envíos a la zona',
    'Hacemos envíos a la zona a través de Transporte Morteros, o comisionistas a coordinar. No dudes en consultarme 🦋',
    'MapPin',
    2
  ),
  (
    'Empaque Seguro',
    'Tus joyas viajan seguras. No te preocupes 🫶🏻',
    'Shield',
    3
  );

-- Comentarios sobre la tabla
COMMENT ON TABLE shipping_methods IS 'Almacena los métodos de envío y detalles de entrega';
COMMENT ON COLUMN shipping_methods.icon_name IS 'Nombre del icono de Lucide React para mostrar';