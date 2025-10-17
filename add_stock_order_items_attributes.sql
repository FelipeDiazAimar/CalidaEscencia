-- Add attribute information to stock_order_items table
-- This allows tracking which specific product variant was ordered

ALTER TABLE stock_order_items
ADD COLUMN IF NOT EXISTS attribute_id UUID REFERENCES product_attributes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS attribute_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS attribute_value VARCHAR(255);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_order_items_attribute_id ON stock_order_items(attribute_id);

-- Add comment
COMMENT ON COLUMN stock_order_items.attribute_id IS 'Specific attribute that was ordered (for products with variants)';
COMMENT ON COLUMN stock_order_items.attribute_name IS 'Attribute name (denormalized for history)';
COMMENT ON COLUMN stock_order_items.attribute_value IS 'Attribute value (denormalized for history)';