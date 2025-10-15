-- Fix RLS policies for subcategories table
-- This addresses the 401 Unauthorized and RLS policy violation errors

-- First, enable RLS on subcategories table
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Authenticated users can manage subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Public can view subcategories" ON public.subcategories;

-- Create policy for authenticated users to manage subcategories
CREATE POLICY "Authenticated users can manage subcategories" ON public.subcategories
FOR ALL USING (auth.role() = 'authenticated');

-- Create policy for public read access to all subcategories
CREATE POLICY "Public can view subcategories" ON public.subcategories
FOR SELECT USING (true);

-- Alternative policy that allows all authenticated users to manage subcategories
-- Uncomment the following if you want to allow all authenticated users to manage subcategories
-- DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.subcategories;
-- CREATE POLICY "Authenticated users can manage subcategories" ON public.subcategories
-- FOR ALL USING (auth.role() = 'authenticated');