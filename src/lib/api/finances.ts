// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import type {
  ApiResponse,
  Sale,
  SaleInsert,
  SaleUpdate,
  SaleWithItems,
  SaleItem,
  SaleItemInsert,
  Expense,
  ExpenseInsert,
  ExpenseUpdate,
  Income,
  IncomeInsert,
  IncomeUpdate,
  Salary,
  SalaryInsert,
  SalaryUpdate,
  CashClosure,
  CashClosureInsert,
  CashClosureUpdate,
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
} from '@/types/database';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const handleError = (error: any): string => {
  console.error('API Error:', error);
  
  // More detailed error logging
  if (error?.message) {
    console.error('Error message:', error.message);
  }
  if (error?.details) {
    console.error('Error details:', error.details);
  }
  if (error?.hint) {
    console.error('Error hint:', error.hint);
  }
  if (error?.code) {
    console.error('Error code:', error.code);
  }
  
  return error?.message || error?.details || 'An unexpected error occurred';
};

const createResponse = <T>(data: T | null, error: string | null): ApiResponse<T> => ({
  data,
  error,
  success: !error,
});

// =====================================================
// SALES API
// =====================================================

export const salesApi = {
  // Get all sales with items - TEMPORAL: usando product_sales hasta migrar datos
  async getAll(): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔍 financeApi.sales.getAll() - Iniciando consulta a product_sales...');
      
      const { data, error } = await supabase
        .from('product_sales')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });

      console.log('🔍 financeApi.sales.getAll() - Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('❌ financeApi.sales.getAll() - Error en consulta:', error);
        throw error;
      }
      
      console.log('📊 financeApi.sales.getAll() - Datos crudos recibidos:', data);
      console.log('📊 financeApi.sales.getAll() - Cantidad de registros:', data?.length || 0);
      
      // Transformar datos para que coincidan con el formato esperado
      console.log('🔄 financeApi.sales.getAll() - Iniciando transformación...');
      const transformedData = (data as any)?.map((sale: any, index: number) => {
        console.log(`🔄 Transformando venta ${index + 1}:`, sale);
        console.log(`🔄 sale.total_price:`, sale.total_price);
        console.log(`🔄 sale.unit_price:`, sale.unit_price);
        
        const transformed = {
          id: sale.id,
          // Mapear campos principales
          customer_name: sale.customer_name || null,
          customer_phone: sale.customer_phone || null,
          subtotal: sale.total_price || 0,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: sale.total_price || 0, // Este es el campo que busca la UI
          payment_method: sale.payment_method || 'cash',
          payment_status: sale.payment_status || 'paid',
          sale_status: sale.sale_status || 'confirmed',
          notes: sale.notes || null,
          created_at: sale.created_at,
          updated_at: sale.updated_at,
          // Mantener la estructura sale_items para compatibilidad
          sale_items: [{
            id: sale.id,
            product_id: sale.product_id,
            quantity: sale.quantity,
            price_per_unit: sale.unit_price,
            total_price: sale.total_price,
            product: sale.product
          }]
        };
        
        console.log(`✅ Venta transformada ${index + 1}:`, transformed);
        return transformed;
      }) || [];
      
      console.log('🔄 financeApi.sales.getAll() - Datos transformados:', transformedData);
      console.log('✅ financeApi.sales.getAll() - Retornando éxito con', transformedData.length, 'ventas');
      
      return createResponse(transformedData, null);
    } catch (error) {
      console.error('💥 financeApi.sales.getAll() - Error capturado:', error);
      return createResponse([], handleError(error));
    }
  },

  // Get sale by ID with items
  async getById(id: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items:sale_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get sales by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items:sale_items(
            *,
            product:products(*)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  // Create sale with items
  async create(sale: SaleInsert, items: SaleItemInsert[]): Promise<ApiResponse<any>> {
    try {
      // Start transaction
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(sale as any)
        .select()
        .single();

      if (saleError) throw saleError;

      // Add sale_id to each item
      const itemsWithSaleId = items.map(item => ({
        ...item,
        sale_id: saleData.id
      }));

      // Insert sale items
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId as any)
        .select();

      if (itemsError) throw itemsError;

      return createResponse({ sale: saleData, items: itemsData }, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update sale
  async update(id: string, updates: SaleUpdate): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete sale
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Get sales summary
  async getSummary(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('sales_summary')
        .select('*')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },
};

// =====================================================
// EXPENSES API
// =====================================================

export const expensesApi = {
  // Get all expenses
  async getAll(): Promise<ApiResponse<Expense[]>> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Expense[], handleError(error));
    }
  },

  // Get expenses by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Expense[]>> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Expense[], handleError(error));
    }
  },

  // Get expenses by category
  async getByCategory(category: string): Promise<ApiResponse<Expense[]>> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('category', category)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Expense[], handleError(error));
    }
  },

  // Create expense
  async create(expense: ExpenseInsert): Promise<ApiResponse<Expense | null>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables.');
      }

      console.log('🔍 Attempting to create expense:', expense);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense as any)
        .select()
        .single();

      if (error) {
        console.error('📊 Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Expense created successfully:', data);
      return createResponse(data, null);
    } catch (error) {
      console.error('❌ Error in expensesApi.create:', error);
      return createResponse(null, handleError(error));
    }
  },

  // Update expense
  async update(id: string, updates: ExpenseUpdate): Promise<ApiResponse<Expense | null>> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete expense
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// INCOME API
// =====================================================

export const incomeApi = {
  // Get all income
  async getAll(): Promise<ApiResponse<Income[]>> {
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .order('income_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Income[], handleError(error));
    }
  },

  // Get income by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Income[]>> {
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .gte('income_date', startDate)
        .lte('income_date', endDate)
        .order('income_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Income[], handleError(error));
    }
  },

  // Create income
  async create(income: IncomeInsert): Promise<ApiResponse<Income | null>> {
    try {
      const { data, error } = await supabase
        .from('income')
        .insert(income as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update income
  async update(id: string, updates: IncomeUpdate): Promise<ApiResponse<Income | null>> {
    try {
      const { data, error } = await supabase
        .from('income')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete income
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// SALARIES API
// =====================================================

export const salariesApi = {
  // Get all salaries
  async getAll(): Promise<ApiResponse<Salary[]>> {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .order('pay_period_end', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Salary[], handleError(error));
    }
  },

  // Get salaries by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Salary[]>> {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .gte('pay_period_start', startDate)
        .lte('pay_period_end', endDate)
        .order('pay_period_end', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Salary[], handleError(error));
    }
  },

  // Create salary
  async create(salary: SalaryInsert): Promise<ApiResponse<Salary | null>> {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .insert(salary as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update salary
  async update(id: string, updates: SalaryUpdate): Promise<ApiResponse<Salary | null>> {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete salary
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('salaries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// CASH CLOSURES API
// =====================================================

export const cashClosuresApi = {
  // Get all cash closures
  async getAll(): Promise<ApiResponse<CashClosure[]>> {
    try {
      const { data, error } = await supabase
        .from('cash_closures')
        .select('*')
        .order('closure_date', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as CashClosure[], handleError(error));
    }
  },

  // Get cash closure by date
  async getByDate(date: string): Promise<ApiResponse<CashClosure | null>> {
    try {
      const { data, error } = await supabase
        .from('cash_closures')
        .select('*')
        .eq('closure_date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get latest cash closure
  async getLatest(): Promise<ApiResponse<CashClosure | null>> {
    try {
      const { data, error } = await supabase
        .from('cash_closures')
        .select('*')
        .order('closure_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create cash closure
  async create(closure: CashClosureInsert): Promise<ApiResponse<CashClosure | null>> {
    try {
      const { data, error } = await supabase
        .from('cash_closures')
        .insert(closure as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update cash closure
  async update(id: string, updates: CashClosureUpdate): Promise<ApiResponse<CashClosure | null>> {
    try {
      const { data, error } = await supabase
        .from('cash_closures')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete cash closure
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('cash_closures')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// FIXED COSTS API
// =====================================================

const fixedCostsApi = {
  async getAll(): Promise<ApiResponse<FixedCost[]>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('fixed_costs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return createResponse(data || [], null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async create(fixedCost: FixedCostInsert): Promise<ApiResponse<FixedCost>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('fixed_costs')
        .insert(fixedCost as any)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async update(id: string, updates: FixedCostUpdate): Promise<ApiResponse<FixedCost>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('fixed_costs')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { error } = await supabase
        .from('fixed_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return createResponse(null, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// SALARY WITHDRAWALS API
// =====================================================

const salaryWithdrawalsApi = {
  async getAll(): Promise<ApiResponse<SalaryWithdrawal[]>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('salary_withdrawals')
        .select('*')
        .order('withdrawal_date', { ascending: false });

      if (error) throw error;

      return createResponse(data || [], null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async create(withdrawal: SalaryWithdrawalInsert): Promise<ApiResponse<SalaryWithdrawal>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('salary_withdrawals')
        .insert(withdrawal as any)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async update(id: string, updates: SalaryWithdrawalUpdate): Promise<ApiResponse<SalaryWithdrawal>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('salary_withdrawals')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { error } = await supabase
        .from('salary_withdrawals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return createResponse(null, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// PRODUCT VIEWS API
// =====================================================

const productViewsApi = {
  async create(view: ProductViewInsert): Promise<ApiResponse<ProductView>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('product_views')
        .insert(view as any)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async getProductStats(): Promise<ApiResponse<ProductProfitability[]>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('product_profitability')
        .select('*')
        .order('profit_margin_percentage', { ascending: false });

      if (error) throw error;

      return createResponse(data || [], null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// MONETARY MOVEMENTS API
// =====================================================

const monetaryMovementsApi = {
  async getAll(): Promise<ApiResponse<MonetaryMovement[]>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('monetary_movements')
        .select('*')
        .order('movement_date', { ascending: false });

      if (error) throw error;

      return createResponse(data || [], null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async create(movement: MonetaryMovementInsert): Promise<ApiResponse<MonetaryMovement>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('monetary_movements')
        .insert(movement as any)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async update(id: string, updates: MonetaryMovementUpdate): Promise<ApiResponse<MonetaryMovement>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('monetary_movements')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { error } = await supabase
        .from('monetary_movements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return createResponse(null, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async getByType(type: 'income' | 'withdrawal'): Promise<ApiResponse<MonetaryMovement[]>> {
    try {
      if (!supabase) {
        return createResponse(null, 'Database connection not available');
      }

      const { data, error } = await supabase
        .from('monetary_movements')
        .select('*')
        .eq('type', type)
        .order('movement_date', { ascending: false });

      if (error) throw error;

      return createResponse(data || [], null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// EXPORT ALL APIs
// =====================================================

export const financeApi = {
  sales: salesApi,
  expenses: expensesApi,
  income: incomeApi,
  salaries: salariesApi,
  cashClosures: cashClosuresApi,
  fixedCosts: fixedCostsApi,
  salaryWithdrawals: salaryWithdrawalsApi,
  productViews: productViewsApi,
  monetaryMovements: monetaryMovementsApi,
};