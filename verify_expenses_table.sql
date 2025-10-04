-- =====================================================
-- VERIFICACIÓN DE TABLA EXPENSES
-- =====================================================
-- Ejecuta esto en Supabase SQL Editor para verificar si la tabla expenses existe

-- 1. ¿Existe la tabla expenses?
SELECT 
    'expenses table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'expenses' AND table_schema = 'public'
        ) THEN '✅ SÍ'
        ELSE '❌ NO'
    END as result;

-- 2. Si existe, mostrar estructura
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'expenses';

-- 4. Si no existe, crear la tabla
-- Descomenta las siguientes líneas si la tabla no existe:

/*
CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  receipt_image TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
*/