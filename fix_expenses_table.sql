-- =====================================================
-- CORRECCIÓN DE TABLA EXPENSES - Sin usuarios y con tipos estándar
-- =====================================================
-- Ejecuta esto en Supabase SQL Editor para corregir la tabla expenses

-- 1. Primero, verificar las políticas RLS actuales y eliminarlas
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Only admins can manage expenses" ON public.expenses;

-- 2. Eliminar la referencia a users en created_by (ya que no existe la tabla users)
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
ALTER TABLE public.expenses ALTER COLUMN created_by DROP NOT NULL;

-- 3. Cambiar payment_method de tipo personalizado a TEXT con CHECK constraint
-- Primero eliminar el constraint del tipo personalizado si existe
ALTER TABLE public.expenses ALTER COLUMN payment_method TYPE TEXT;

-- Agregar constraint de verificación para payment_method
ALTER TABLE public.expenses ADD CONSTRAINT expenses_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'transfer', 'other'));

-- 4. Crear una política RLS más simple (sin autenticación de usuarios)
-- Opción A: Permitir todas las operaciones (sin autenticación)
CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true);

-- Opción B: Si prefieres mantener algún control, puedes usar esto en su lugar:
-- CREATE POLICY "Allow expenses operations" ON public.expenses FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Verificar que todo esté correcto
SELECT 
    'expenses table structure after fix' as check_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar políticas RLS actualizadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'expenses';