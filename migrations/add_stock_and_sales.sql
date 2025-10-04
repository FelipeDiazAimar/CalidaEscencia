-- Add stock column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Add is_featured column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create product_sales table for individual product sales tracking
CREATE TABLE IF NOT EXISTS product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_sale_date ON product_sales(sale_date);

-- Create function to update stock when a product sale is made
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock when a product sale is inserted
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- Handle stock adjustment when product sale is updated
  IF TG_OP = 'UPDATE' THEN
    -- Restore old quantity to stock
    UPDATE products 
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
    
    -- Subtract new quantity from stock
    UPDATE products 
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- Restore stock when product sale is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_sale ON product_sales;
CREATE TRIGGER trigger_update_product_stock_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON product_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_sale();

-- Enable RLS for product_sales table
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_sales table
CREATE POLICY "Users can view all product sales" ON product_sales
  FOR SELECT USING (true);

CREATE POLICY "Users can insert product sales" ON product_sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update product sales" ON product_sales
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete product sales" ON product_sales
  FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON product_sales TO authenticated;
GRANT ALL ON products TO authenticated;

-- Add trigger for updated_at on product_sales
CREATE TRIGGER update_product_sales_updated_at BEFORE UPDATE ON product_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();