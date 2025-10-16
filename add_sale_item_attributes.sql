-- Add attribute information to sale_items table
-- This allows tracking which specific product variant was sold

ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS attribute_id UUID REFERENCES product_attributes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_data JSONB;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sale_items_attribute_id ON sale_items(attribute_id);

-- Add comment
COMMENT ON COLUMN sale_items.attribute_id IS 'Specific attribute that was sold (for products with variants)';
COMMENT ON COLUMN sale_items.variant_data IS 'JSON data containing attribute combination details';