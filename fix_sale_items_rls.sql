-- Fix RLS policy for sale_items to allow authenticated users to create sales
-- This allows users to register product sales through the admin panel

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage sale items" ON public.sale_items;

-- Create new policies that allow authenticated users to manage sale items
CREATE POLICY "Authenticated users can manage sale items" ON public.sale_items
FOR ALL USING (auth.jwt() IS NOT NULL);

-- Also ensure the sales table allows authenticated users
DROP POLICY IF EXISTS "Admins can manage sales" ON public.sales;
CREATE POLICY "Authenticated users can manage sales" ON public.sales
FOR ALL USING (auth.jwt() IS NOT NULL);