-- Crear tabla para testimonios de clientes
-- Esta tabla almacena capturas de pantalla de mensajes de clientes con sus datos

CREATE TABLE IF NOT EXISTS customer_testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Datos del cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_location VARCHAR(255) NOT NULL,
  
  -- Imagen del testimonio (captura de pantalla del mensaje)
  image_url TEXT NOT NULL,
  
  -- Control de visibilidad
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) -- Para tracking del admin que lo creó
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_customer_testimonials_active ON customer_testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_testimonials_order ON customer_testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_customer_testimonials_created_at ON customer_testimonials(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_customer_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_testimonials_updated_at
  BEFORE UPDATE ON customer_testimonials
  FOR EACH ROW
  EXECUTE PROCEDURE update_customer_testimonials_updated_at();

-- Insertar algunos datos de ejemplo para desarrollo
-- Solo insertar si la tabla está vacía
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM customer_testimonials LIMIT 1) THEN
    INSERT INTO customer_testimonials (customer_name, customer_location, image_url, display_order) VALUES
      ('María González', 'San Salvador, El Salvador', 'https://picsum.photos/800/600?v=1', 1),
      ('Carlos Martínez', 'Santa Ana, El Salvador', 'https://picsum.photos/800/600?v=2', 2),
      ('Ana Rodríguez', 'La Libertad, El Salvador', 'https://picsum.photos/800/600?v=3', 3),
      ('José López', 'Sonsonate, El Salvador', 'https://picsum.photos/800/600?v=4', 4);
  END IF;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE customer_testimonials IS 'Tabla para almacenar testimonios de clientes con capturas de pantalla de mensajes';
COMMENT ON COLUMN customer_testimonials.customer_name IS 'Nombre completo del cliente';
COMMENT ON COLUMN customer_testimonials.customer_location IS 'Ubicación/ciudad del cliente';
COMMENT ON COLUMN customer_testimonials.image_url IS 'URL de la captura de pantalla del mensaje del cliente';
COMMENT ON COLUMN customer_testimonials.is_active IS 'Si el testimonio está activo/visible';
COMMENT ON COLUMN customer_testimonials.display_order IS 'Orden de visualización en la galería';