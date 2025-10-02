-- =====================================================
-- CalidaEscencia Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- AUTHENTICATION & USERS
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PRODUCT MANAGEMENT
-- =====================================================

-- Categories table
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE public.subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Models table
CREATE TABLE public.models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Names table (for product naming)
CREATE TABLE public.names (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  unit_type TEXT DEFAULT 'piece' CHECK (unit_type IN ('piece', 'gram', 'meter', 'liter')),
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  model_id UUID REFERENCES public.models(id),
  name_id UUID REFERENCES public.names(id),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cover_image TEXT,
  product_images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product materials relationship (BOM - Bill of Materials)
CREATE TABLE public.product_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, material_id)
);

-- =====================================================
-- INVENTORY MANAGEMENT
-- =====================================================

-- Stock movements table
CREATE TABLE public.stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id UUID REFERENCES public.materials(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity DECIMAL(10,3) NOT NULL,
  previous_stock DECIMAL(10,3) NOT NULL,
  new_stock DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reason TEXT,
  reference_id UUID, -- For linking to sales, purchases, etc.
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment', 'production'
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product inventory (finished products)
CREATE TABLE public.product_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- =====================================================
-- SALES MANAGEMENT
-- =====================================================

-- Sales table
CREATE TABLE public.sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  sale_status TEXT DEFAULT 'pending' CHECK (sale_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL MANAGEMENT
-- =====================================================

-- Cash closures table
CREATE TABLE public.cash_closures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  closure_date DATE NOT NULL,
  opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  card_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  transfer_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
  cash_withdrawals DECIMAL(10,2) NOT NULL DEFAULT 0,
  expected_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  difference DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  is_closed BOOLEAN DEFAULT false,
  closed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(closure_date)
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  receipt_image TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income table (other than sales)
CREATE TABLE public.income (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  income_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salaries table
CREATE TABLE public.salaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  position TEXT,
  base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonuses DECIMAL(10,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDERS & PURCHASING
-- =====================================================

-- Purchase orders table (for buying materials)
CREATE TABLE public.purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  received_quantity DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN POLICIES (Allow all operations for admins)
-- =====================================================

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories policies
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Subcategories policies  
CREATE POLICY "Admins can manage subcategories" ON public.subcategories FOR ALL USING (public.is_admin());

-- Models policies
CREATE POLICY "Admins can manage models" ON public.models FOR ALL USING (public.is_admin());

-- Names policies
CREATE POLICY "Admins can manage names" ON public.names FOR ALL USING (public.is_admin());

-- Materials policies
CREATE POLICY "Admins can manage materials" ON public.materials FOR ALL USING (public.is_admin());

-- Products policies
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Product materials policies
CREATE POLICY "Admins can manage product materials" ON public.product_materials FOR ALL USING (public.is_admin());

-- Stock movements policies
CREATE POLICY "Admins can manage stock movements" ON public.stock_movements FOR ALL USING (public.is_admin());

-- Product inventory policies
CREATE POLICY "Admins can manage product inventory" ON public.product_inventory FOR ALL USING (public.is_admin());

-- Sales policies
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (public.is_admin());

-- Sale items policies
CREATE POLICY "Admins can manage sale items" ON public.sale_items FOR ALL USING (public.is_admin());

-- Cash closures policies
CREATE POLICY "Admins can manage cash closures" ON public.cash_closures FOR ALL USING (public.is_admin());

-- Expenses policies
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (public.is_admin());

-- Income policies
CREATE POLICY "Admins can manage income" ON public.income FOR ALL USING (public.is_admin());

-- Salaries policies
CREATE POLICY "Admins can manage salaries" ON public.salaries FOR ALL USING (public.is_admin());

-- Purchase orders policies
CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders FOR ALL USING (public.is_admin());

-- Purchase order items policies
CREATE POLICY "Admins can manage purchase order items" ON public.purchase_order_items FOR ALL USING (public.is_admin());

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that have updated_at column
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.names FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.cash_closures FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.income FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.salaries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update material stock
CREATE OR REPLACE FUNCTION public.update_material_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current stock in materials table
  UPDATE public.materials 
  SET current_stock = NEW.new_stock
  WHERE id = NEW.material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update material stock on stock movements
CREATE TRIGGER update_material_stock_trigger 
  AFTER INSERT ON public.stock_movements 
  FOR EACH ROW EXECUTE FUNCTION public.update_material_stock();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('aros', 'Pendientes y aretes'),
  ('collares', 'Collares y gargantillas'),
  ('anillos', 'Anillos y sortijas'),
  ('pulseras', 'Pulseras y brazaletes');

-- Insert default subcategories
INSERT INTO public.subcategories (category_id, name, description) VALUES
  ((SELECT id FROM public.categories WHERE name = 'aros'), 'Acero quirúrgico', 'Aros de acero quirúrgico'),
  ((SELECT id FROM public.categories WHERE name = 'aros'), 'blanco', 'Aros blancos'),
  ((SELECT id FROM public.categories WHERE name = 'aros'), 'dorado', 'Aros dorados'),
  ((SELECT id FROM public.categories WHERE name = 'collares'), 'Acero quirúrgico', 'Collares de acero quirúrgico'),
  ((SELECT id FROM public.categories WHERE name = 'collares'), 'blanco', 'Collares blancos'),
  ((SELECT id FROM public.categories WHERE name = 'collares'), 'dorado', 'Collares dorados'),
  ((SELECT id FROM public.categories WHERE name = 'collares'), 'Plata 925', 'Collares de plata 925'),
  ((SELECT id FROM public.categories WHERE name = 'anillos'), 'Acero quirúrgico', 'Anillos de acero quirúrgico'),
  ((SELECT id FROM public.categories WHERE name = 'anillos'), 'blanco', 'Anillos blancos'),
  ((SELECT id FROM public.categories WHERE name = 'anillos'), 'dorado', 'Anillos dorados'),
  ((SELECT id FROM public.categories WHERE name = 'anillos'), 'Plata 925', 'Anillos de plata 925'),
  ((SELECT id FROM public.categories WHERE name = 'pulseras'), 'Acero quirúrgico', 'Pulseras de acero quirúrgico'),
  ((SELECT id FROM public.categories WHERE name = 'pulseras'), 'blanco', 'Pulseras blancas'),
  ((SELECT id FROM public.categories WHERE name = 'pulseras'), 'dorado', 'Pulseras doradas'),
  ((SELECT id FROM public.categories WHERE name = 'pulseras'), 'Plata 925', 'Pulseras de plata 925');

-- Insert default materials
INSERT INTO public.materials (name, cost_per_unit, unit_type, current_stock, min_stock) VALUES
  ('Alambre de acero quirúrgico', 2.50, 'meter', 100, 10),
  ('Cadena dorada', 5.00, 'meter', 50, 5),
  ('Cadena plateada', 4.00, 'meter', 50, 5),
  ('Perlas sintéticas', 0.25, 'piece', 500, 50),
  ('Cristales', 0.15, 'piece', 1000, 100),
  ('Cierres de acero', 1.00, 'piece', 200, 20),
  ('Cierres dorados', 1.50, 'piece', 150, 15),
  ('Cierres plateados', 1.25, 'piece', 150, 15),
  ('Argollas pequeñas', 0.05, 'piece', 1000, 100),
  ('Argollas medianas', 0.08, 'piece', 800, 80),
  ('Argollas grandes', 0.12, 'piece', 600, 60);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Sales summary view
CREATE VIEW public.sales_summary AS
SELECT 
  DATE(s.created_at) as sale_date,
  COUNT(*) as total_sales,
  SUM(s.total_amount) as total_revenue,
  SUM(si.total_cost) as total_cost,
  SUM(s.total_amount) - SUM(si.total_cost) as gross_profit,
  AVG(s.total_amount) as avg_sale_amount
FROM public.sales s
LEFT JOIN public.sale_items si ON s.id = si.sale_id
WHERE s.payment_status = 'paid'
GROUP BY DATE(s.created_at)
ORDER BY sale_date DESC;

-- Low stock materials view
CREATE VIEW public.low_stock_materials AS
SELECT 
  m.*,
  (m.current_stock - m.min_stock) as stock_difference
FROM public.materials m
WHERE m.current_stock <= m.min_stock
ORDER BY stock_difference ASC;

-- Product profitability view
CREATE VIEW public.product_profitability AS
SELECT 
  p.id,
  p.name,
  p.price as selling_price,
  p.cost as production_cost,
  (p.price - p.cost) as gross_profit,
  CASE 
    WHEN p.cost > 0 THEN ((p.price - p.cost) / p.cost * 100)
    ELSE 0
  END as profit_margin_percentage,
  COALESCE(pi.quantity, 0) as current_stock
FROM public.products p
LEFT JOIN public.product_inventory pi ON p.id = pi.product_id
WHERE p.is_active = true
ORDER BY profit_margin_percentage DESC;