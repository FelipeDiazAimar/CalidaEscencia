-- =====================================================
-- SCRIPT: CREAR TABLA VISTA_PRINCIPAL
-- =====================================================
-- Crear tabla para gestionar la sección "Vista Principal"
-- del homepage desde el panel de administración
-- =====================================================

-- Crear tabla vista_principal
CREATE TABLE IF NOT EXISTS vista_principal (
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
COMMENT ON TABLE vista_principal IS 'Tabla para gestionar el contenido de la sección "Vista Principal" del homepage';
COMMENT ON COLUMN vista_principal.id IS 'Identificador único de la vista principal';
COMMENT ON COLUMN vista_principal.titulo IS 'Título principal de la sección (ej: "Descubre la Belleza, Encuentra tu Estilo")';
COMMENT ON COLUMN vista_principal.descripcion IS 'Descripción de la sección (ej: "Explora nuestra exclusiva colección...")';
COMMENT ON COLUMN vista_principal.enlace IS 'URL del enlace del botón (ej: "/products", "/gallery")';
COMMENT ON COLUMN vista_principal.enlace_texto IS 'Texto del botón de enlace (ej: "Ver Colección", "Explorar")';
COMMENT ON COLUMN vista_principal.imagen IS 'URL de la imagen de la sección - puede ser archivo subido o URL externa';
COMMENT ON COLUMN vista_principal.is_active IS 'Indica si la vista principal está activa (solo se muestra la activa)';
COMMENT ON COLUMN vista_principal.created_at IS 'Fecha y hora de creación';
COMMENT ON COLUMN vista_principal.updated_at IS 'Fecha y hora de última actualización';

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vista_principal_updated_at
    BEFORE UPDATE ON vista_principal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos por defecto (contenido actual)
INSERT INTO vista_principal (titulo, descripcion, enlace, enlace_texto, imagen) VALUES (
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
WHERE table_name = 'vista_principal'
ORDER BY ordinal_position;

-- Mostrar el contenido inicial
SELECT * FROM vista_principal;

-- Mensaje de confirmación
SELECT 'Tabla vista_principal creada exitosamente con datos iniciales!' as resultado;