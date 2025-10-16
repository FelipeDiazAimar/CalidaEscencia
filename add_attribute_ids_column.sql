-- Add attribute_ids column to products table for multiple attributes support
-- This column will store an array of attribute IDs that the product has

-- Add the attribute_ids column as UUID array
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS attribute_ids UUID[];

-- Create an index for better performance when querying products by attributes
CREATE INDEX IF NOT EXISTS idx_products_attribute_ids ON public.products USING GIN (attribute_ids);

-- Add comment to the column
COMMENT ON COLUMN public.products.attribute_ids IS 'Array of attribute IDs that this product has (for multiple attributes support)';

-- Enable RLS for the new column (if RLS is enabled on the table)
-- The existing RLS policies should cover this column since it's part of the products table