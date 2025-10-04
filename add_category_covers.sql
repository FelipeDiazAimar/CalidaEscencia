-- =====================================================
-- SCRIPT: AGREGAR PORTADAS A CATEGORÍAS
-- =====================================================
-- Agregar columnas para portada de historias y portada de cards
-- =====================================================

-- Agregar columna para portada de historias (formato circular)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS portada_historias TEXT;

-- Agregar columna para portada de cards (relación de aspecto 350.667x197.250)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS portada_cards TEXT;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN categories.portada_historias IS 'URL de la imagen de portada para historias (formato circular) - puede ser archivo subido o URL externa';
COMMENT ON COLUMN categories.portada_cards IS 'URL de la imagen de portada para cards (relación de aspecto 350.667x197.250) - puede ser archivo subido o URL externa';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND column_name IN ('portada_historias', 'portada_cards')
ORDER BY column_name;

-- Mostrar estructura actualizada de la tabla categories (alternativa a \d)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT 'Columnas de portadas agregadas exitosamente a la tabla categories!' as resultado;