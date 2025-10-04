-- Add is_featured column to products table
-- This enables the featured products functionality
-- Run this in your Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN products.is_featured IS 'Indicates if the product should be displayed in the featured products section';

-- Optional: Update some existing products to be featured for testing
-- Uncomment the lines below if you want to mark some products as featured
-- UPDATE products SET is_featured = true WHERE id IN (
--   SELECT id FROM products WHERE is_active = true LIMIT 3
-- );