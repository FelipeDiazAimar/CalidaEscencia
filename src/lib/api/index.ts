// =====================================================
// CENTRAL API EXPORTS
// =====================================================

// Product and inventory APIs
export { api as productApi, vistaPrincipalApi } from './products';

// Finance APIs
export { financeApi } from './finances';

// Stock Orders APIs
export { stockOrdersApi } from './stockOrders';

// Authentication APIs
export { authApi, useAuth, useRequireAuth, useRequireAdmin } from './auth';

// Re-export commonly used types
export type {
  ApiResponse,
  Product,
  ProductInsert,
  ProductUpdate,
  Material,
  MaterialInsert,
  MaterialUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  Subcategory,
  SubcategoryInsert,
  SubcategoryUpdate,
  Model,
  ModelInsert,
  ModelUpdate,
  Name,
  NameInsert,
  NameUpdate,
  Sale,
  SaleInsert,
  SaleUpdate,
  SaleItem,
  SaleItemInsert,
  SaleItemUpdate,
  Expense,
  ExpenseInsert,
  ExpenseUpdate,
  FixedCost,
  FixedCostInsert,
  FixedCostUpdate,
  SalaryWithdrawal,
  SalaryWithdrawalInsert,
  SalaryWithdrawalUpdate,
  MonetaryMovement,
  MonetaryMovementInsert,
  MonetaryMovementUpdate,
  ProductView,
  ProductViewInsert,
  ProductProfitability,
  CashClosure,
  CashClosureInsert,
  CashClosureUpdate,
  StockMovement,
  StockMovementInsert,
  User,
  UserRole,
  PaymentMethod,
  PaymentStatus,
} from '@/types/database';

// Stock order types
export type {
  StockOrder,
  StockOrderItem,
  StockOrderWithDetails
} from './stockOrders';

// Supabase client exports
export { supabase } from '@/lib/supabaseClient';
export { getSupabaseServer } from '@/lib/supabaseServer';