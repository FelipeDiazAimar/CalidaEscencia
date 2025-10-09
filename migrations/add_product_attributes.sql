-- =====================================================
-- Add Product Attributes Table
-- Adds a third level of categorization for products (colors, aromas, sizes, etc.)
-- =====================================================

-- Product attributes table (third level categorization)
CREATE TABLE public.product_attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'variant' CHECK (type IN ('color', 'aroma', 'size', 'material', 'style', 'variant')),
  value TEXT NOT NULL,
  description TEXT,
  color_hex TEXT, -- For color attributes, store hex code
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subcategory_id, name, value)
);

-- Add attribute_id to products table
ALTER TABLE public.products
ADD COLUMN attribute_id UUID REFERENCES public.product_attributes(id);

-- Create indexes for better performance
CREATE INDEX idx_product_attributes_subcategory_id ON public.product_attributes(subcategory_id);
CREATE INDEX idx_product_attributes_type ON public.product_attributes(type);
CREATE INDEX idx_products_attribute_id ON public.products(attribute_id);

-- Enable RLS
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- Policies for product_attributes
CREATE POLICY "Anyone can view active product attributes" ON public.product_attributes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage product attributes" ON public.product_attributes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert some sample attributes for existing subcategories
-- First, let's get some subcategory IDs to work with
-- This will be populated based on your existing data