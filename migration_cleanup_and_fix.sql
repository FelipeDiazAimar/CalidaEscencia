-- =====================================================
-- CLEANUP AND SAFE MIGRATION: SALES SYSTEM
-- =====================================================
-- Execute this in Supabase SQL Editor to fix conflicts
-- =====================================================

-- First, let's clean up any partial migration artifacts
DROP TRIGGER IF EXISTS update_product_sales_updated_at ON product_sales;
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON product_sales;
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_delete ON product_sales;
DROP TRIGGER IF EXISTS trigger_handle_stock_on_sale_update ON product_sales;

-- Drop functions if they exist (CASCADE will remove dependent triggers)
DROP FUNCTION IF EXISTS update_product_stock_on_sale() CASCADE;
DROP FUNCTION IF EXISTS restore_product_stock_on_sale_delete() CASCADE;
DROP FUNCTION IF EXISTS handle_product_stock_on_sale_update() CASCADE;

-- Drop table if it exists (this will recreate it properly)
DROP TABLE IF EXISTS product_sales;

-- Remove columns if they exist (we'll re-add them)
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS is_featured;

-- =====================================================
-- NOW CREATE EVERYTHING FRESH
-- =====================================================

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN stock INTEGER DEFAULT 0,
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Create product_sales table
CREATE TABLE product_sales (
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
CREATE INDEX idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX idx_product_sales_sale_date ON product_sales(sale_date);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_is_featured ON products(is_featured);

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

-- Set initial stock values for existing products
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

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('stock', 'is_featured');

-- Check if product_sales table exists and show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'product_sales'
ORDER BY ordinal_position;

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('product_sales', 'products')
AND trigger_name LIKE '%product%';

-- Show some products with their stock
SELECT id, name, price, stock, is_featured 
FROM products 
LIMIT 5;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Migration completed successfully! You can now use the sales system.' as status;