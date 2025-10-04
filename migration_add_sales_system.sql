-- =====================================================
-- MIGRATION: ADD SALES SYSTEM TO EXISTING DATABASE
-- =====================================================
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create product_sales table
CREATE TABLE IF NOT EXISTS product_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_sale_date ON product_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Add trigger for updated_at on product_sales
CREATE TRIGGER update_product_sales_updated_at 
    BEFORE UPDATE ON product_sales
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update product stock when a sale is made
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock by subtracting the sold quantity
    UPDATE products 
    SET stock = stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Check if stock went negative (optional validation)
    IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product ID: %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock when a sale is inserted
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON product_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_sale();

-- Function to restore product stock when a sale is deleted
CREATE OR REPLACE FUNCTION restore_product_stock_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Restore product stock by adding back the sold quantity
    UPDATE products 
    SET stock = stock + OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to restore stock when a sale is deleted
CREATE TRIGGER trigger_restore_stock_on_sale_delete
    AFTER DELETE ON product_sales
    FOR EACH ROW
    EXECUTE FUNCTION restore_product_stock_on_sale_delete();

-- Function to handle stock changes when a sale quantity is updated
CREATE OR REPLACE FUNCTION handle_product_stock_on_sale_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate the difference in quantity
    DECLARE
        quantity_diff INTEGER := NEW.quantity - OLD.quantity;
    BEGIN
        -- Update product stock by the difference
        UPDATE products 
        SET stock = stock - quantity_diff,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        
        -- Check if stock went negative
        IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product ID: %', NEW.product_id;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock changes on sale updates
CREATE TRIGGER trigger_handle_stock_on_sale_update
    AFTER UPDATE OF quantity ON product_sales
    FOR EACH ROW
    EXECUTE FUNCTION handle_product_stock_on_sale_update();

-- Set initial stock values for existing products (optional)
UPDATE products SET stock = 10 WHERE stock IS NULL OR stock = 0;

-- Enable RLS on product_sales table
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_sales
CREATE POLICY "Enable read access for all users" ON product_sales
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON product_sales
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON product_sales
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON product_sales
    FOR DELETE USING (true);

-- Add some sample data to test (optional)
-- INSERT INTO product_sales (product_id, quantity, unit_price, total_price, notes)
-- SELECT 
--     id as product_id,
--     1 as quantity,
--     price as unit_price,
--     price as total_price,
--     'Test sale' as notes
-- FROM products 
-- WHERE is_active = true 
-- LIMIT 3;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:

-- Check if columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('stock', 'is_featured');

-- Check if product_sales table exists
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name = 'product_sales';

-- Check triggers
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table IN ('product_sales', 'products');

-- =====================================================
-- END OF MIGRATION
-- =====================================================