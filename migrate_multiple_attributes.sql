-- Migration to support multiple attributes per product with stock by attribute combination
-- This allows products to have multiple attributes and stock management per attribute combination

-- Create table for product-attribute relationships (many-to-many)
CREATE TABLE IF NOT EXISTS public.product_attribute_combinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, attribute_id)
);

-- Create table for inventory by attribute combination
CREATE TABLE IF NOT EXISTS public.product_variant_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_data JSONB NOT NULL, -- Store attribute combinations as JSON
  sku TEXT UNIQUE, -- Stock Keeping Unit
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  price_modifier DECIMAL(10,2) DEFAULT 0, -- Price adjustment for this variant
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_data)
);

-- Migrate existing single-attribute products to the new system (only if attribute_id column exists)
DO $$
BEGIN
  -- Check if attribute_id column exists in products table
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'attribute_id'
  ) THEN
    -- Migrate existing single-attribute products to the new system
    INSERT INTO public.product_attribute_combinations (product_id, attribute_id)
    SELECT id, attribute_id
    FROM public.products
    WHERE attribute_id IS NOT NULL
    ON CONFLICT (product_id, attribute_id) DO NOTHING;

    -- Only migrate inventory if product_inventory table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'product_inventory'
    ) THEN
      -- Migrate existing inventory to variant inventory for products with attributes
      INSERT INTO public.product_variant_inventory (product_id, variant_data, quantity, reserved_quantity)
      SELECT
        pi.product_id,
        jsonb_build_object(
          'attribute_id', p.attribute_id,
          'attribute_name', pa.name,
          'attribute_value', pa.value,
          'attribute_type', pa.type
        ),
        pi.quantity,
        pi.reserved_quantity
      FROM public.product_inventory pi
      JOIN public.products p ON pi.product_id = p.id
      LEFT JOIN public.product_attributes pa ON p.attribute_id = pa.id
      WHERE p.attribute_id IS NOT NULL
      ON CONFLICT (product_id, variant_data) DO NOTHING;

      -- Migrate inventory for products without attributes (base products)
      INSERT INTO public.product_variant_inventory (product_id, variant_data, quantity, reserved_quantity)
      SELECT
        pi.product_id,
        '{}'::jsonb, -- Empty JSON for products without attributes
        pi.quantity,
        pi.reserved_quantity
      FROM public.product_inventory pi
      JOIN public.products p ON pi.product_id = p.id
      WHERE p.attribute_id IS NULL
      ON CONFLICT (product_id, variant_data) DO NOTHING;
    END IF;

    -- Remove attribute_id from products table (no longer needed)
    ALTER TABLE public.products DROP COLUMN IF EXISTS attribute_id;
  ELSE
    -- If attribute_id column doesn't exist, check if product_inventory exists and migrate base inventory
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'product_inventory'
    ) THEN
      INSERT INTO public.product_variant_inventory (product_id, variant_data, quantity, reserved_quantity)
      SELECT
        pi.product_id,
        '{}'::jsonb, -- Empty JSON for products without attributes
        pi.quantity,
        pi.reserved_quantity
      FROM public.product_inventory pi
      ON CONFLICT (product_id, variant_data) DO NOTHING;
    END IF;
  END IF;
END $$;

-- Update product_inventory to be deprecated (keep for backward compatibility)
-- Rename to product_inventory_legacy (only if it hasn't been renamed yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_inventory'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_inventory_legacy'
  ) THEN
    ALTER TABLE public.product_inventory RENAME TO product_inventory_legacy;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_attribute_combinations_product_id ON public.product_attribute_combinations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_combinations_attribute_id ON public.product_attribute_combinations(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_inventory_product_id ON public.product_variant_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_inventory_sku ON public.product_variant_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_product_variant_inventory_active ON public.product_variant_inventory(is_active);

-- Enable RLS on new tables
ALTER TABLE public.product_attribute_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for product_attribute_combinations
DROP POLICY IF EXISTS "Anyone can view product attribute combinations" ON public.product_attribute_combinations;
CREATE POLICY "Anyone can view product attribute combinations" ON public.product_attribute_combinations
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage product attribute combinations" ON public.product_attribute_combinations;
CREATE POLICY "Authenticated users can manage product attribute combinations" ON public.product_attribute_combinations
FOR ALL USING (auth.jwt() IS NOT NULL);

-- Create policies for product_variant_inventory
DROP POLICY IF EXISTS "Anyone can view active product variant inventory" ON public.product_variant_inventory;
CREATE POLICY "Anyone can view active product variant inventory" ON public.product_variant_inventory
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage product variant inventory" ON public.product_variant_inventory;
CREATE POLICY "Authenticated users can manage product variant inventory" ON public.product_variant_inventory
FOR ALL USING (auth.jwt() IS NOT NULL);

-- Create function to get available variants for a product
CREATE OR REPLACE FUNCTION get_product_variants(product_uuid UUID)
RETURNS TABLE (
  variant_id UUID,
  variant_data JSONB,
  sku TEXT,
  quantity INTEGER,
  price_modifier DECIMAL(10,2),
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pvi.id,
    pvi.variant_data,
    pvi.sku,
    pvi.quantity,
    pvi.price_modifier,
    pvi.is_active
  FROM public.product_variant_inventory pvi
  WHERE pvi.product_id = product_uuid
  ORDER BY pvi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update variant stock
CREATE OR REPLACE FUNCTION update_variant_stock(
  variant_uuid UUID,
  new_quantity INTEGER,
  new_reserved INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.product_variant_inventory
  SET
    quantity = new_quantity,
    reserved_quantity = new_reserved,
    last_updated = NOW()
  WHERE id = variant_uuid;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;