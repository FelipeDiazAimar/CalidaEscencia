// =====================================================
// DATABASE TYPES AND INTERFACES
// =====================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      subcategories: {
        Row: Subcategory;
        Insert: SubcategoryInsert;
        Update: SubcategoryUpdate;
      };
      product_attributes: {
        Row: ProductAttribute;
        Insert: ProductAttributeInsert;
        Update: ProductAttributeUpdate;
      };
      models: {
        Row: Model;
        Insert: ModelInsert;
        Update: ModelUpdate;
      };
      names: {
        Row: Name;
        Insert: NameInsert;
        Update: NameUpdate;
      };
      materials: {
        Row: Material;
        Insert: MaterialInsert;
        Update: MaterialUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_materials: {
        Row: ProductMaterial;
        Insert: ProductMaterialInsert;
        Update: ProductMaterialUpdate;
      };
      stock_movements: {
        Row: StockMovement;
        Insert: StockMovementInsert;
        Update: StockMovementUpdate;
      };
      product_inventory: {
        Row: ProductInventory;
        Insert: ProductInventoryInsert;
        Update: ProductInventoryUpdate;
      };
      announcements: {
        Row: Announcement;
        Insert: AnnouncementInsert;
        Update: AnnouncementUpdate;
      };
      sale_items: {
        Row: SaleItem;
        Insert: SaleItemInsert;
        Update: SaleItemUpdate;
      };
      sales: {
        Row: Sale;
        Insert: SaleInsert;
        Update: SaleUpdate;
      };
      cash_closures: {
        Row: CashClosure;
        Insert: CashClosureInsert;
        Update: CashClosureUpdate;
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
      };
      income: {
        Row: Income;
        Insert: IncomeInsert;
        Update: IncomeUpdate;
      };
      salaries: {
        Row: Salary;
        Insert: SalaryInsert;
        Update: SalaryUpdate;
      };
      purchase_orders: {
        Row: PurchaseOrder;
        Insert: PurchaseOrderInsert;
        Update: PurchaseOrderUpdate;
      };
      purchase_order_items: {
        Row: PurchaseOrderItem;
        Insert: PurchaseOrderItemInsert;
        Update: PurchaseOrderItemUpdate;
      };
      faqs: {
        Row: FAQ;
        Insert: FAQInsert;
        Update: FAQUpdate;
      };
      carousel_images: {
        Row: CarouselImage;
        Insert: CarouselImageInsert;
        Update: CarouselImageUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      vista_principal: {
        Row: VistaPrincipal;
        Insert: VistaPrincipalInsert;
        Update: VistaPrincipalUpdate;
      };
      customer_testimonials: {
        Row: CustomerTestimonial;
        Insert: CustomerTestimonialInsert;
        Update: CustomerTestimonialUpdate;
      };
      website_materials: {
        Row: WebsiteMaterial;
        Insert: WebsiteMaterialInsert;
        Update: WebsiteMaterialUpdate;
      };
      materials_content: {
        Row: MaterialsContent;
        Insert: MaterialsContentInsert;
        Update: MaterialsContentUpdate;
      };
      about_content: {
        Row: AboutContent;
        Insert: AboutContentInsert;
        Update: AboutContentUpdate;
      };
    };
    Views: {
      sales_summary: {
        Row: SalesSummary;
      };
      low_stock_materials: {
        Row: LowStockMaterial;
      };
      product_profitability: {
        Row: ProductProfitability;
      };
    };
  };
}

// =====================================================
// BASIC TYPES
// =====================================================

export type UserRole = 'admin' | 'customer';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial';
export type SaleStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type MovementType = 'in' | 'out' | 'adjustment';
export type ReferenceType = 'sale' | 'purchase' | 'adjustment' | 'production';
export type UnitType = 'piece' | 'gram' | 'meter' | 'liter';

// =====================================================
// USER MANAGEMENT
// =====================================================

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id: string;
  email?: string;
  role?: UserRole;
  full_name?: string;
  phone?: string;
}

export interface UserUpdate {
  email?: string;
  role?: UserRole;
  full_name?: string;
  phone?: string;
}

// =====================================================
// PRODUCT MANAGEMENT
// =====================================================

export interface Category {
  id: string;
  name: string;
  description: string | null;
  portada_historias: string | null;
  portada_cards: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  name: string;
  description?: string;
  portada_historias?: string;
  portada_cards?: string;
  order_index?: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  portada_historias?: string;
  portada_cards?: string;
  order_index?: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryInsert {
  category_id: string;
  name: string;
  description?: string;
}

export interface SubcategoryUpdate {
  category_id?: string;
  name?: string;
  description?: string;
}

export interface ProductAttribute {
  id: string;
  subcategory_id: string;
  name: string;
  type: 'color' | 'aroma' | 'size' | 'material' | 'style' | 'variant';
  value: string;
  description: string | null;
  color_hex: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductAttributeInsert {
  subcategory_id: string;
  name: string;
  type?: 'color' | 'aroma' | 'size' | 'material' | 'style' | 'variant';
  value: string;
  description?: string;
  color_hex?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductAttributeUpdate {
  subcategory_id?: string;
  name?: string;
  type?: 'color' | 'aroma' | 'size' | 'material' | 'style' | 'variant';
  value?: string;
  description?: string;
  color_hex?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface Model {
  id: string;
  name: string;
  description: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelInsert {
  name: string;
  description?: string;
  profile_image?: string;
}

export interface ModelUpdate {
  name?: string;
  description?: string;
  profile_image?: string;
}

export interface Name {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface NameInsert {
  name: string;
}

export interface NameUpdate {
  name?: string;
}

export interface Announcement {
  id: string;
  text: string;
  is_active: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInsert {
  text: string;
  is_active?: boolean;
  order_position?: number;
}

export interface AnnouncementUpdate {
  text?: string;
  is_active?: boolean;
  order_position?: number;
}

export interface Material {
  id: string;
  name: string;
  cost_per_unit: number;
  unit_type: UnitType;
  current_stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialInsert {
  name: string;
  cost_per_unit?: number;
  unit_type?: UnitType;
  current_stock?: number;
  min_stock?: number;
}

export interface MaterialUpdate {
  name?: string;
  cost_per_unit?: number;
  unit_type?: UnitType;
  current_stock?: number;
  min_stock?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  attribute_id: string | null;
  model_id: string | null;
  name_id: string | null;
  cost: number;
  price: number;
  cover_image: string | null;
  hover_image: string | null;
  product_images: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  name: string;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
  attribute_id?: string;
  model_id?: string;
  name_id?: string;
  cost?: number;
  price?: number;
  cover_image?: string;
  hover_image?: string;
  product_images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  stock?: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
  attribute_id?: string;
  model_id?: string;
  name_id?: string;
  cost?: number;
  price?: number;
  cover_image?: string;
  hover_image?: string;
  product_images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  stock?: number;
}

export interface ProductMaterial {
  id: string;
  product_id: string;
  material_id: string;
  quantity: number;
  created_at: string;
}

export interface ProductMaterialInsert {
  product_id: string;
  material_id: string;
  quantity: number;
}

export interface ProductMaterialUpdate {
  quantity?: number;
}

// =====================================================
// INVENTORY MANAGEMENT
// =====================================================

export interface StockMovement {
  id: string;
  material_id: string | null;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number | null;
  total_cost: number | null;
  reason: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockMovementInsert {
  material_id?: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  reference_id?: string;
  reference_type?: string;
  created_by?: string;
}

export interface StockMovementUpdate {
  reason?: string;
}

export interface ProductInventory {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  last_updated: string;
}

export interface ProductInventoryInsert {
  product_id: string;
  quantity?: number;
  reserved_quantity?: number;
}

export interface ProductInventoryUpdate {
  quantity?: number;
  reserved_quantity?: number;
}

// =====================================================
// SALES MANAGEMENT
// =====================================================

export interface Sale {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  sale_status: SaleStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleInsert {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  sale_status?: SaleStatus;
  notes?: string;
  created_by?: string;
}

export interface SaleUpdate {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  sale_status?: SaleStatus;
  notes?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  total_cost: number;
  created_at: string;
}

export interface SaleItemInsert {
  sale_id?: string;
  product_id?: string;
  quantity?: number;
  unit_price: number;
  unit_cost?: number;
  total_price: number;
  total_cost?: number;
}

export interface SaleItemUpdate {
  quantity?: number;
  unit_price?: number;
  unit_cost?: number;
  total_price?: number;
  total_cost?: number;
}

// =====================================================
// FINANCIAL MANAGEMENT
// =====================================================

// Simple product sales interface
export interface ProductSale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSaleInsert {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date?: string;
  notes?: string;
}

export interface ProductSaleUpdate {
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  sale_date?: string;
  notes?: string;
}

export interface CashClosure {
  id: string;
  closure_date: string;
  opening_cash: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  other_income: number;
  total_income: number;
  expenses: number;
  cash_withdrawals: number;
  expected_cash: number;
  actual_cash: number;
  difference: number;
  notes: string | null;
  is_closed: boolean;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashClosureInsert {
  closure_date: string;
  opening_cash?: number;
  cash_sales?: number;
  card_sales?: number;
  transfer_sales?: number;
  other_income?: number;
  total_income?: number;
  expenses?: number;
  cash_withdrawals?: number;
  expected_cash?: number;
  actual_cash?: number;
  difference?: number;
  notes?: string;
  is_closed?: boolean;
  closed_by?: string;
}

export interface CashClosureUpdate {
  opening_cash?: number;
  cash_sales?: number;
  card_sales?: number;
  transfer_sales?: number;
  other_income?: number;
  total_income?: number;
  expenses?: number;
  cash_withdrawals?: number;
  expected_cash?: number;
  actual_cash?: number;
  difference?: number;
  notes?: string;
  is_closed?: boolean;
}

export interface Expense {
  id: string;
  category: string;
  subcategory: string | null;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod | null;
  receipt_image: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method?: PaymentMethod;
  receipt_image?: string;
  notes?: string;
}

export interface ExpenseUpdate {
  category?: string;
  subcategory?: string;
  description?: string;
  amount?: number;
  expense_date?: string;
  payment_method?: PaymentMethod;
  receipt_image?: string;
  notes?: string;
}

// =====================================================
// COSTOS FIJOS
// =====================================================

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  is_active: boolean;
  category: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FixedCostInsert {
  name: string;
  amount: number;
  frequency?: string;
  is_active?: boolean;
  category?: string;
  description?: string;
}

export interface FixedCostUpdate {
  name?: string;
  amount?: number;
  frequency?: string;
  is_active?: boolean;
  category?: string;
  description?: string;
}

// =====================================================
// EXTRACCIONES DE SUELDO
// =====================================================

export interface SalaryWithdrawal {
  id: string;
  person_name: string;
  amount: number;
  withdrawal_date: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryWithdrawalInsert {
  person_name: string;
  amount: number;
  withdrawal_date: string;
  description?: string;
  notes?: string;
}

export interface SalaryWithdrawalUpdate {
  person_name?: string;
  amount?: number;
  withdrawal_date?: string;
  description?: string;
  notes?: string;
}

// =====================================================
// MOVIMIENTOS MONETARIOS
// =====================================================

export interface MonetaryMovement {
  id: string;
  type: 'income' | 'withdrawal';
  amount: number;
  description: string;
  category: string | null;
  notes: string | null;
  movement_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonetaryMovementInsert {
  type: 'income' | 'withdrawal';
  amount: number;
  description: string;
  category?: string;
  notes?: string;
  movement_date?: string;
  created_by?: string;
}

export interface MonetaryMovementUpdate {
  type?: 'income' | 'withdrawal';
  amount?: number;
  description?: string;
  category?: string;
  notes?: string;
  movement_date?: string;
}

// =====================================================
// VISTAS DE PRODUCTOS
// =====================================================

export interface ProductView {
  id: string;
  product_id: string;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
}

export interface ProductViewInsert {
  product_id: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

// =====================================================
// ANÁLISIS DE RENTABILIDAD
// =====================================================

export interface ProductProfitability {
  id: string;
  name: string;
  selling_price: number;
  production_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
  current_stock: number;
  views_last_30_days: number;
  sales_last_30_days: number;
  orders_last_30_days: number;
}

export interface Income {
  id: string;
  category: string;
  description: string;
  amount: number;
  income_date: string;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeInsert {
  category: string;
  description: string;
  amount: number;
  income_date: string;
  payment_method?: PaymentMethod;
  notes?: string;
  created_by?: string;
}

export interface IncomeUpdate {
  category?: string;
  description?: string;
  amount?: number;
  income_date?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface Salary {
  id: string;
  employee_name: string;
  position: string | null;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string | null;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryInsert {
  employee_name: string;
  position?: string;
  base_salary?: number;
  bonuses?: number;
  deductions?: number;
  net_salary?: number;
  pay_period_start: string;
  pay_period_end: string;
  payment_date?: string;
  payment_method?: PaymentMethod;
  notes?: string;
  created_by?: string;
}

export interface SalaryUpdate {
  employee_name?: string;
  position?: string;
  base_salary?: number;
  bonuses?: number;
  deductions?: number;
  net_salary?: number;
  pay_period_start?: string;
  pay_period_end?: string;
  payment_date?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

// =====================================================
// PURCHASING
// =====================================================

export interface PurchaseOrder {
  id: string;
  supplier_name: string;
  supplier_contact: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderInsert {
  supplier_name: string;
  supplier_contact?: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  subtotal?: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount?: number;
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  notes?: string;
  created_by?: string;
}

export interface PurchaseOrderUpdate {
  supplier_name?: string;
  supplier_contact?: string;
  order_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  subtotal?: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount?: number;
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  material_id: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
  created_at: string;
}

export interface PurchaseOrderItemInsert {
  purchase_order_id: string;
  material_id?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity?: number;
}

export interface PurchaseOrderItemUpdate {
  quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  received_quantity?: number;
}

// =====================================================
// VIEWS & REPORTS
// =====================================================

export interface SalesSummary {
  sale_date: string;
  total_sales: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  avg_sale_amount: number;
}

export interface LowStockMaterial {
  id: string;
  name: string;
  cost_per_unit: number;
  unit_type: UnitType;
  current_stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  stock_difference: number;
}

export interface ProductProfitability {
  id: string;
  name: string;
  selling_price: number;
  production_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
  current_stock: number;
}

// =====================================================
// EXTENDED TYPES FOR UI
// =====================================================

export interface ProductWithDetails extends Product {
  category?: Category;
  subcategory?: Subcategory;
  model?: Model;
  name_ref?: Name;
  materials?: (ProductMaterial & { material: Material })[];
  inventory?: ProductInventory;
}

export interface SaleWithItems extends Sale {
  sale_items?: (SaleItem & { product?: Product })[];
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  purchase_order_items?: (PurchaseOrderItem & { material?: Material })[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// =====================================================
// FORM TYPES
// =====================================================

export interface ProductFormData {
  name: string;
  description?: string;
  category_id: string;
  subcategory_id: string;
  attribute_id?: string;
  model_id?: string;
  name_id?: string;
  cost: number;
  price: number;
  cover_image?: string;
  product_images?: string[];
  materials: { material_id: string; quantity: number }[];
}

export interface SaleFormData {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method: PaymentMethod;
  notes?: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
}

export interface StockMovementFormData {
  material_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  reason?: string;
}

export interface ExpenseFormData {
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod;
  receipt_image?: string;
  notes?: string;
}

export interface CashClosureFormData {
  closure_date: string;
  opening_cash: number;
  actual_cash: number;
  notes?: string;
}

// =====================================================
// FAQ TYPES
// =====================================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FAQInsert {
  question: string;
  answer: string;
  category: string;
  is_active?: boolean;
  order_index?: number;
}

export interface FAQUpdate {
  question?: string;
  answer?: string;
  category?: string;
  is_active?: boolean;
  order_index?: number;
}

// =====================================================
// CAROUSEL IMAGES
// =====================================================

export interface CarouselImage {
  id: string;
  title: string;
  description: string | null;
  alt_text: string | null;
  image_url: string;
  original_image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  order_index: number;
  crop_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface CarouselImageInsert {
  title: string;
  description?: string;
  alt_text?: string;
  image_url: string;
  original_image_url?: string;
  link_url?: string;
  is_active?: boolean;
  order_index?: number;
  crop_data?: any;
}

export interface CarouselImageUpdate {
  title?: string;
  description?: string;
  alt_text?: string;
  image_url?: string;
  original_image_url?: string;
  link_url?: string;
  is_active?: boolean;
  order_index?: number;
  crop_data?: any;
}

// =====================================================
// ORDER TYPES
// =====================================================

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: OrderStatus;
  total_amount: number;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_cost: number | null;
  notes: string | null;
  whatsapp_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  status?: OrderStatus;
  total_amount?: number;
  payment_method?: string;
  shipping_method?: string;
  shipping_cost?: number;
  notes?: string;
  whatsapp_sent_at?: string;
}

export interface OrderUpdate {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  status?: OrderStatus;
  total_amount?: number;
  payment_method?: string;
  shipping_method?: string;
  shipping_cost?: number;
  notes?: string;
  whatsapp_sent_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderItemInsert {
  order_id?: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderItemUpdate {
  order_id?: string;
  product_id?: string;
  product_name?: string;
  product_price?: number;
  quantity?: number;
  subtotal?: number;
}

// Extended order with items for detailed views
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Cart item type for frontend
export interface CartItem {
  id?: string;
  product_id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  subcategory?: string;
  attribute_id?: string;
  attribute?: ProductAttribute;
}

// =====================================================
// VISTA PRINCIPAL (MAIN VIEW SECTION)
// =====================================================

export interface VistaPrincipal {
  id: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  enlace_texto: string;
  imagen: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VistaPrincipalInsert {
  titulo: string;
  descripcion: string;
  enlace?: string;
  enlace_texto?: string;
  imagen?: string;
  is_active?: boolean;
}

export interface VistaPrincipalUpdate {
  titulo?: string;
  descripcion?: string;
  enlace?: string;
  enlace_texto?: string;
  imagen?: string;
  is_active?: boolean;
}

// =====================================================
// CUSTOMER TESTIMONIALS (GALLERY)
// =====================================================

export interface CustomerTestimonial {
  id: string;
  customer_name: string;
  customer_location: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomerTestimonialInsert {
  customer_name: string;
  customer_location: string;
  image_url: string;
  is_active?: boolean;
  display_order?: number;
  created_by?: string;
}

export interface CustomerTestimonialUpdate {
  customer_name?: string;
  customer_location?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

// =====================================================
// WEBSITE MATERIALS TYPES
// =====================================================

export interface WebsiteMaterial {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WebsiteMaterialInsert {
  title: string;
  description: string;
  image_url: string;
  is_active?: boolean;
  display_order?: number;
  created_by?: string;
}

export interface WebsiteMaterialUpdate {
  title?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface MaterialsContent {
  id: string;
  section_type: 'care_tips' | 'maintenance';
  title: string;
  content: string;
  icon_name?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MaterialsContentInsert {
  section_type: 'care_tips' | 'maintenance';
  title: string;
  content: string;
  icon_name?: string;
  is_active?: boolean;
  display_order?: number;
  created_by?: string;
}

export interface MaterialsContentUpdate {
  section_type?: 'care_tips' | 'maintenance';
  title?: string;
  content?: string;
  icon_name?: string;
  is_active?: boolean;
  display_order?: number;
}

// About Content interfaces
export interface AboutContent {
  id: string;
  section_type: 'hero' | 'mission' | 'shipping' | 'payment' | 'returns';
  title: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  background_image_url?: string;
  extra_data?: Record<string, any>;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AboutContentInsert {
  section_type: 'hero' | 'mission' | 'shipping' | 'payment' | 'returns';
  title: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  background_image_url?: string;
  extra_data?: Record<string, any>;
  is_active?: boolean;
  display_order?: number;
  created_by?: string;
}

export interface AboutContentUpdate {
  section_type?: 'hero' | 'mission' | 'shipping' | 'payment' | 'returns';
  title?: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  background_image_url?: string;
  extra_data?: Record<string, any>;
  is_active?: boolean;
  display_order?: number;
}

// =====================================================
// SHIPPING METHODS TYPES
// =====================================================

export interface ShippingMethod {
  id: string;
  title: string;
  description: string;
  icon_name?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ShippingMethodInsert {
  title: string;
  description: string;
  icon_name?: string;
  is_active?: boolean;
  display_order?: number;
  created_by?: string;
}

export interface ShippingMethodUpdate {
  title?: string;
  description?: string;
  icon_name?: string;
  is_active?: boolean;
  display_order?: number;
  updated_at?: string;
}