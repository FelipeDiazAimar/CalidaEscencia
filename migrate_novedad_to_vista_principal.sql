-- =====================================================
-- MIGRATION: Rename 'novedad' table to 'vista_principal'
-- =====================================================
-- This script renames the novedad table to vista_principal
-- to match the new naming convention
-- =====================================================

-- Rename the table
ALTER TABLE novedad RENAME TO vista_principal;

-- Update any comments if they exist
COMMENT ON TABLE vista_principal IS 'Tabla para gestionar el contenido de la sección "Vista Principal" del homepage';

-- Update column comments
COMMENT ON COLUMN vista_principal.id IS 'Identificador único de la vista principal';
COMMENT ON COLUMN vista_principal.titulo IS 'Título principal de la sección';
COMMENT ON COLUMN vista_principal.descripcion IS 'Descripción de la sección';
COMMENT ON COLUMN vista_principal.enlace IS 'URL del enlace del botón';
COMMENT ON COLUMN vista_principal.enlace_texto IS 'Texto del botón de enlace';
COMMENT ON COLUMN vista_principal.imagen IS 'URL de la imagen de la sección';
COMMENT ON COLUMN vista_principal.is_active IS 'Indica si la vista principal está activa';
COMMENT ON COLUMN vista_principal.created_at IS 'Fecha y hora de creación';
COMMENT ON COLUMN vista_principal.updated_at IS 'Fecha y hora de última actualización';

-- Update the trigger name
ALTER TRIGGER update_novedad_updated_at ON vista_principal
    RENAME TO update_vista_principal_updated_at;

-- Update the trigger function
DROP TRIGGER IF EXISTS update_vista_principal_updated_at ON vista_principal;
CREATE TRIGGER update_vista_principal_updated_at
    BEFORE UPDATE ON vista_principal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table exists and show its structure
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'vista_principal'
    AND schemaname = 'public';

-- Show current data
SELECT * FROM vista_principal;

SELECT 'Migration completed: novedad table renamed to vista_principal' as status;