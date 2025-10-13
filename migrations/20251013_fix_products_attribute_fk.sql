-- =====================================================
-- Fix products.attribute_id foreign key behavior
-- - Remove orphaned attribute references
-- - Recreate FK with ON DELETE SET NULL to avoid blocking deletes
-- Run this script once in Supabase after deploying.
-- =====================================================

BEGIN;

-- Remove dangling references created during previous migrations or data copies
UPDATE public.products AS p
SET attribute_id = NULL
WHERE attribute_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_attributes AS pa
    WHERE pa.id = p.attribute_id
  );

-- Replace the foreign key constraint with ON DELETE SET NULL behavior
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_attribute_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_attribute_id_fkey
    FOREIGN KEY (attribute_id)
    REFERENCES public.product_attributes(id)
    ON DELETE SET NULL;

COMMIT;
