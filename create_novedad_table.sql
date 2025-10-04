-- =====================================================
-- SCRIPT: CREAR TABLA NOVEDAD
-- =====================================================
-- Crear tabla para gestionar la sección "Descubre la Belleza"
-- del homepage desde el panel de administración
-- =====================================================

-- Crear tabla novedad
CREATE TABLE IF NOT EXISTS novedad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  enlace TEXT NOT NULL DEFAULT '/products',
  enlace_texto TEXT NOT NULL DEFAULT 'Ver Colección',
  imagen TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agregar comentarios para documentar las columnas
COMMENT ON TABLE novedad IS 'Tabla para gestionar el contenido de la sección "Descubre la Belleza" del homepage';
COMMENT ON COLUMN novedad.id IS 'Identificador único de la novedad';
COMMENT ON COLUMN novedad.titulo IS 'Título principal de la sección (ej: "Descubre la Belleza, Encuentra tu Estilo")';
COMMENT ON COLUMN novedad.descripcion IS 'Descripción de la sección (ej: "Explora nuestra exclusiva colección...")';
COMMENT ON COLUMN novedad.enlace IS 'URL del enlace del botón (ej: "/products", "/gallery")';
COMMENT ON COLUMN novedad.enlace_texto IS 'Texto del botón de enlace (ej: "Ver Colección", "Explorar")';
COMMENT ON COLUMN novedad.imagen IS 'URL de la imagen de la sección - puede ser archivo subido o URL externa';
COMMENT ON COLUMN novedad.is_active IS 'Indica si la novedad está activa (solo se muestra la activa)';
COMMENT ON COLUMN novedad.created_at IS 'Fecha y hora de creación';
COMMENT ON COLUMN novedad.updated_at IS 'Fecha y hora de última actualización';

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_novedad_updated_at 
    BEFORE UPDATE ON novedad 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos por defecto (contenido actual)
INSERT INTO novedad (titulo, descripcion, enlace, enlace_texto, imagen) VALUES (
  'Descubre la Belleza, Encuentra tu Estilo',
  'Explora nuestra exclusiva colección de joyas, diseñadas para capturar la esencia de la elegancia y la sofisticación. Cada pieza cuenta una historia.',
  '/products',
  'Ver Colección',
  'https://picsum.photos/600/400'
) ON CONFLICT DO NOTHING;

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'novedad'
ORDER BY ordinal_position;

-- Mostrar el contenido inicial
SELECT * FROM novedad;

-- Mensaje de confirmación
SELECT 'Tabla novedad creada exitosamente con datos iniciales!' as resultado;