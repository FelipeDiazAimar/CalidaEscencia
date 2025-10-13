-- Crear tabla para el contenido de la página "Sobre Nosotros"
-- Esta tabla permite administrar todo el contenido mostrado en /about

CREATE TABLE IF NOT EXISTS about_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tipo de sección: 'hero', 'mission', 'shipping', 'payment', 'returns'
  section_type VARCHAR(50) NOT NULL,
  
  -- Información del contenido
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  content TEXT,
  
  -- URLs de imágenes
  image_url TEXT,
  background_image_url TEXT,
  
  -- Información adicional para secciones específicas
  extra_data JSONB, -- Para almacenar datos estructurados específicos de cada sección
  
  -- Control de visualización
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_about_content_section ON about_content(section_type);
CREATE INDEX IF NOT EXISTS idx_about_content_active ON about_content(is_active);
CREATE INDEX IF NOT EXISTS idx_about_content_order ON about_content(display_order);
CREATE INDEX IF NOT EXISTS idx_about_content_created_at ON about_content(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_about_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON about_content
  FOR EACH ROW
  EXECUTE PROCEDURE update_about_content_updated_at();

-- Insertar datos de ejemplo para desarrollo
-- Solo insertar si las tablas están vacías
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM about_content LIMIT 1) THEN
    -- Sección Hero (página principal)
    INSERT INTO about_content (section_type, title, subtitle, content, image_url, display_order) VALUES
      (
        'hero',
        'Sobre Nosotros',
        'Conoce la historia detrás de cada joya.',
        '',
        '',
        1
      );

    -- Sección de Misión
    INSERT INTO about_content (section_type, title, subtitle, content, image_url, display_order) VALUES
      (
        'mission',
        'Nuestra Misión',
        '',
        'En Calida Escencia, creemos que la joyería es más que un simple accesorio; es una forma de expresión, un recuerdo y una celebración de los momentos especiales de la vida. Nacimos en el corazón de El Salvador con la misión de crear piezas atemporales y de alta calidad que te acompañen en tu día a día.

Cada una de nuestras joyas es diseñada y elaborada con una meticulosa atención al detalle, utilizando materiales nobles como el oro, la plata de ley y piedras preciosas. Nos inspiramos en la belleza de lo simple y en la elegancia de lo minimalista para ofrecerte diseños que perduren en el tiempo.

Somos más que una marca; somos una comunidad de amantes de la belleza y el buen gusto. Gracias por ser parte de nuestra historia.',
        'https://picsum.photos/600/800',
        2
      );

    -- Sección de Envíos
    INSERT INTO about_content (
      section_type, 
      title, 
      subtitle, 
      content, 
      background_image_url, 
      extra_data, 
      display_order
    ) VALUES
      (
        'shipping',
        'Envíos a todo el país y más allá',
        'Llevamos nuestras joyas hasta la puerta de tu casa. Rápido, seguro y con el cuidado que tus piezas merecen.',
        '',
        'https://picsum.photos/1200/400?v=60',
        '{
          "national": {
            "title": "Envíos Nacionales (El Salvador)",
            "delivery_time": "2-3 días hábiles",
            "cost": "$3.50 tarifa estándar",
            "packaging": "Tus joyas viajan seguras en nuestro empaque de regalo"
          },
          "international": {
            "title": "Envíos Internacionales",
            "description": "¿Vives fuera de El Salvador? ¡No hay problema! Contáctanos directamente por WhatsApp para cotizar tu envío a cualquier parte del mundo."
          }
        }',
        3
      );

    -- Sección de Métodos de Pago
    INSERT INTO about_content (
      section_type, 
      title, 
      subtitle, 
      content, 
      background_image_url, 
      extra_data, 
      display_order
    ) VALUES
      (
        'payment',
        'Paga con total seguridad y comodidad',
        'Ofrecemos múltiples métodos de pago para que elijas el que mejor se adapte a ti. Todas las transacciones son 100% seguras.',
        '',
        'https://picsum.photos/1200/400?v=61',
        '{
          "methods": [
            "Tarjetas de Crédito/Débito",
            "Transferencia Bancaria",
            "Pago Contra Entrega (San Salvador)"
          ]
        }',
        4
      );

    -- Sección de Devoluciones
    INSERT INTO about_content (
      section_type, 
      title, 
      subtitle, 
      content, 
      background_image_url, 
      extra_data, 
      display_order
    ) VALUES
      (
        'returns',
        'Tu satisfacción es nuestra prioridad',
        'Queremos que ames tus joyas. Si por alguna razón no estás completamente satisfecha, te facilitamos el proceso de cambio o devolución.',
        '',
        'https://picsum.photos/1200/400?v=62',
        '{
          "policy": {
            "title": "Política de Cambios y Devoluciones",
            "rules": [
              "Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.",
              "La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.",
              "Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.",
              "Para iniciar el proceso, simplemente contáctanos con tu número de orden."
            ]
          }
        }',
        5
      );
  END IF;
END $$;

-- Comentarios sobre el esquema
COMMENT ON TABLE about_content IS 'Almacena todo el contenido editable de la página Sobre Nosotros';
COMMENT ON COLUMN about_content.section_type IS 'Tipos: hero, mission, shipping, payment, returns';
COMMENT ON COLUMN about_content.extra_data IS 'Datos estructurados específicos para cada tipo de sección (JSON)';
COMMENT ON COLUMN about_content.background_image_url IS 'URL de imagen de fondo para secciones con overlay';