-- Crear tabla para materiales de joyería
-- Esta tabla permite administrar los materiales mostrados en /materials

CREATE TABLE IF NOT EXISTS website_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información del material
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  
  -- Control de visualización
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) -- Para tracking del admin que lo creó
);

-- Crear tabla para contenido adicional de la página de materiales
CREATE TABLE IF NOT EXISTS materials_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tipo de contenido: 'care_tips' o 'maintenance'
  section_type VARCHAR(50) NOT NULL,
  
  -- Información del contenido
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  icon_name VARCHAR(50), -- Nombre del icono de Lucide
  
  -- Control de visualización
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Crear índices para website_materials
CREATE INDEX IF NOT EXISTS idx_website_materials_active ON website_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_website_materials_order ON website_materials(display_order);
CREATE INDEX IF NOT EXISTS idx_website_materials_created_at ON website_materials(created_at DESC);

-- Crear índices para materials_content
CREATE INDEX IF NOT EXISTS idx_materials_content_section ON materials_content(section_type);
CREATE INDEX IF NOT EXISTS idx_materials_content_active ON materials_content(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_content_order ON materials_content(display_order);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_website_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_materials_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_website_materials_updated_at
  BEFORE UPDATE ON website_materials
  FOR EACH ROW
  EXECUTE PROCEDURE update_website_materials_updated_at();

CREATE TRIGGER update_materials_content_updated_at
  BEFORE UPDATE ON materials_content
  FOR EACH ROW
  EXECUTE PROCEDURE update_materials_content_updated_at();

-- Insertar datos de ejemplo para desarrollo
-- Solo insertar si las tablas están vacías
DO $$
BEGIN
  -- Insertar materiales principales
  IF NOT EXISTS (SELECT 1 FROM website_materials LIMIT 1) THEN
    INSERT INTO website_materials (title, description, image_url, display_order) VALUES
      (
        'Oro de Calidad', 
        'Utilizamos oro de 14k y 18k, conocido por su durabilidad y brillo atemporal. Perfecto para piezas que durarán toda la vida.',
        'https://picsum.photos/500/300?v=20',
        1
      ),
      (
        'Plata de Ley 925',
        'Nuestra plata de ley es 92.5% plata pura, ofreciendo un balance ideal entre belleza y resistencia. Ideal para diseños modernos y elegantes.',
        'https://picsum.photos/500/300?v=21',
        2
      ),
      (
        'Piedras Preciosas y Semipreciosas',
        'Seleccionamos cuidadosamente cada gema, desde diamantes hasta cuarzos, por su color, corte y claridad para añadir un toque especial a cada joya.',
        'https://picsum.photos/500/300?v=22',
        3
      );
  END IF;

  -- Insertar contenido adicional
  IF NOT EXISTS (SELECT 1 FROM materials_content LIMIT 1) THEN
    -- Sección de cuidado
    INSERT INTO materials_content (section_type, title, content, icon_name, display_order) VALUES
      (
        'care_tips',
        'Cuidado de tus Joyas',
        '• Guarda tus piezas individualmente para evitar que se rayen.
• Evita el contacto con perfumes, cremas y productos de limpieza.
• Quítate las joyas antes de nadar, bañarte o hacer ejercicio.
• Límpialas suavemente con un paño seco y suave después de usarlas.',
        'ShieldCheck',
        1
      ),
      -- Sección de mantenimiento
      (
        'maintenance',
        'Mantenimiento',
        'Para una limpieza más profunda, puedes usar agua tibia y un jabón neutro. Usa un cepillo de dientes suave para llegar a las zonas difíciles y seca completamente la pieza antes de guardarla. Para piezas con piedras preciosas, recomendamos una limpieza profesional una vez al año.',
        'Wrench',
        2
      );
  END IF;
END $$;

-- Comentarios sobre el esquema
COMMENT ON TABLE website_materials IS 'Almacena los materiales de joyería mostrados en la página principal de materiales';
COMMENT ON TABLE materials_content IS 'Almacena el contenido adicional como tips de cuidado y mantenimiento';
COMMENT ON COLUMN materials_content.section_type IS 'Tipos: care_tips, maintenance';
COMMENT ON COLUMN materials_content.icon_name IS 'Nombre del icono de Lucide React para mostrar';