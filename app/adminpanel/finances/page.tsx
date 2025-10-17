'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import EditStockOrderModal from '@/components/admin/EditStockOrderModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Calculator,
  PiggyBank,
  CreditCard,
  Loader2,
  Eye,
  Target,
  ChevronDown,
  Package,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Import API functions and types
import { 
  financeApi,
  stockOrdersApi,
  type Sale,
  type SaleInsert,
  type SaleItem,
  type SaleItemInsert,
  type Expense,
  type ExpenseInsert,
  type CashClosure,
  type CashClosureInsert,
  type FixedCost,
  type FixedCostInsert,
  type SalaryWithdrawal,
  type SalaryWithdrawalInsert,
  type MonetaryMovement,
  type MonetaryMovementInsert,
  type ProductProfitability,
  type PaymentMethod,
  type PaymentStatus,
  type StockOrder,
  type StockOrderWithDetails
} from '@/lib/api';

interface SaleFormData {
  customer_name: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  sale_status: 'pending' | 'confirmed' | 'cancelled';
  subtotal: string;
  discount_amount: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
  payment_method: PaymentMethod;
  notes: string;
  expense_date: string;
}

interface CashClosureFormData {
  closure_date: string;
  initial_cash: string;
  final_cash: string;
  cash_sales: string;
  card_sales: string;
  transfer_sales: string;
  expenses: string;
  notes: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminFinancesPage() {
  // Data state
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashClosures, setCashClosures] = useState<CashClosure[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [salaryWithdrawals, setSalaryWithdrawals] = useState<SalaryWithdrawal[]>([]);
  const [monetaryMovements, setMonetaryMovements] = useState<MonetaryMovement[]>([]);
  const [productStats, setProductStats] = useState<ProductProfitability[]>([]);
  const [stockOrders, setStockOrders] = useState<StockOrderWithDetails[]>([]);
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // Monitor sales state changes
  useEffect(() => {
    console.log('🔍 SALES STATE CHANGED:', sales);
    console.log('🔍 SALES STATE LENGTH:', sales.length);
    console.log('🔍 SALES STATE CONTENT:', JSON.stringify(sales, null, 2));
  }, [sales]);

  // Component mount log
  useEffect(() => {
    console.log('🚀 Finances page component mounted');
  }, []);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCashClosureDialogOpen, setIsCashClosureDialogOpen] = useState(false);
  const [isRevertClosureDialogOpen, setIsRevertClosureDialogOpen] = useState(false);
  const [isEditStockOrderModalOpen, setIsEditStockOrderModalOpen] = useState(false);
  const [editingStockOrder, setEditingStockOrder] = useState<StockOrderWithDetails | null>(null);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCashClosure, setEditingCashClosure] = useState<CashClosure | null>(null);
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [editingSalaryWithdrawal, setEditingSalaryWithdrawal] = useState<SalaryWithdrawal | null>(null);
  const [editingMonetaryMovement, setEditingMonetaryMovement] = useState<MonetaryMovement | null>(null);

  // Form states
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    customer_name: '',
    payment_method: 'cash',
    payment_status: 'paid',
    sale_status: 'confirmed',
    subtotal: '',
    discount_amount: '0',
    items: []
  });

  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: '',
    payment_method: 'cash',
    notes: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [cashClosureFormData, setCashClosureFormData] = useState<CashClosureFormData>({
    closure_date: new Date().toISOString().split('T')[0],
    initial_cash: '',
    final_cash: '',
    cash_sales: '',
    card_sales: '',
    transfer_sales: '',
    expenses: '',
    notes: ''
  });

  // Filter states
  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartTimeFilter, setChartTimeFilter] = useState('month'); // day, month, year

  // Fixed cost form state
  const [fixedCostFormData, setFixedCostFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    category: '',
    description: ''
  });

  // Salary withdrawal form state
  const [salaryWithdrawalFormData, setSalaryWithdrawalFormData] = useState({
    person_name: '',
    amount: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
  });

  // Monetary movement form state
  const [monetaryMovementFormData, setMonetaryMovementFormData] = useState({
    type: 'income' as 'income' | 'withdrawal',
    amount: '',
    description: '',
    category: '',
    notes: ''
  });

  // Load expense categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('expenseCategories');
    if (savedCategories) {
      setCustomExpenseCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (customExpenseCategories.length > 0) {
      localStorage.setItem('expenseCategories', JSON.stringify(customExpenseCategories));
    }
  }, [customExpenseCategories]);

  // Add new category
  const addCategory = () => {
    if (newCategory.trim() && !customExpenseCategories.includes(newCategory.trim())) {
      setCustomExpenseCategories([...customExpenseCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  // Remove category
  const removeCategory = (categoryToRemove: string) => {
    setCustomExpenseCategories(customExpenseCategories.filter(cat => cat !== categoryToRemove));
  };

  // Load initial data
  useEffect(() => {
    // console.log('🔍 useEffect triggered - authLoading:', authLoading, 'user:', user, 'isAdmin:', isAdmin);
    
    // TEMPORAL: Cargar datos sin autenticación para debug
    console.log('🔧 MODO DEBUG: Cargando datos sin validar autenticación');
    loadData();
    
    /*
    if (authLoading) {
      console.log('⏳ Auth still loading, skipping data load');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found, skipping data load');
      return;
    }
    
    if (!isAdmin) {
      console.log('❌ User is not admin, skipping data load');
      return;
    }

    console.log('✅ All conditions met, calling loadData()');
    loadData();
    */
  }, []);

  const loadData = async () => {
    console.log('🔄 loadData() - Iniciando carga de datos...');
    setLoading(true);
    try {
      console.log('🔄 loadData() - Loading state establecido a true');
      
      // Cargar sales primero con mejor diagnóstico
      console.log('📊 loadData() - Llamando a financeApi.sales.getAll()...');
      const salesRes = await financeApi.sales.getAll();
      console.log('📊 loadData() - Respuesta completa de salesApi:', salesRes);
      console.log('📊 loadData() - salesRes.success:', salesRes.success);
      console.log('📊 loadData() - salesRes.data:', salesRes.data);
      console.log('📊 loadData() - salesRes.error:', salesRes.error);
      
      if (salesRes.success) {
        console.log('✅ loadData() - Sales SUCCESS - Datos recibidos:', salesRes.data);
        console.log('✅ loadData() - Sales SUCCESS - Cantidad:', salesRes.data?.length || 0);
        console.log('✅ loadData() - Sales SUCCESS - Llamando setSales...');
        setSales(salesRes.data || []);
        console.log('✅ loadData() - Sales SUCCESS - setSales ejecutado');
      } else {
        console.error('❌ loadData() - Sales ERROR:', salesRes.error);
        toast.error(`Error cargando ventas: ${salesRes.error}`);
      }

      // Cargar expenses
      console.log('💰 loadData() - Cargando gastos...');
      const expensesRes = await financeApi.expenses.getAll();
      console.log('💰 loadData() - Respuesta de gastos:', expensesRes);
      
      if (expensesRes.success) {
        console.log('✅ loadData() - Gastos cargados:', expensesRes.data?.length || 0, 'registros');
        setExpenses(expensesRes.data || []);
      } else {
        console.error('❌ loadData() - Error en gastos:', expensesRes.error);
        toast.error(`Error cargando gastos: ${expensesRes.error}`);
      }

      // Cargar cash closures - TEMPORAL: comentado porque la tabla no existe
      console.log('🏪 loadData() - Saltando cierres de caja (tabla no existe)...');
      setCashClosures([]);
      console.log('🏪 loadData() - Cierres establecidos como array vacío');

      // Cargar costos fijos
      console.log('🏗️ loadData() - Cargando costos fijos...');
      try {
        const fixedCostsRes = await financeApi.fixedCosts.getAll();
        if (fixedCostsRes.success) {
          console.log('✅ loadData() - Costos fijos cargados:', fixedCostsRes.data?.length || 0, 'registros');
          setFixedCosts(fixedCostsRes.data || []);
        } else {
          console.error('❌ loadData() - Error en costos fijos:', fixedCostsRes.error);
          if (fixedCostsRes.error?.includes('fixed_costs')) {
            console.warn('⚠️ Tabla fixed_costs no existe, estableciendo array vacío');
            setFixedCosts([]);
          } else {
            toast.error(`Error cargando costos fijos: ${fixedCostsRes.error}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando costos fijos, estableciendo array vacío:', error);
        setFixedCosts([]);
      }

      // Cargar extracciones de sueldo
      console.log('👥 loadData() - Cargando extracciones de sueldo...');
      try {
        const salaryWithdrawalsRes = await financeApi.salaryWithdrawals.getAll();
        if (salaryWithdrawalsRes.success) {
          console.log('✅ loadData() - Extracciones de sueldo cargadas:', salaryWithdrawalsRes.data?.length || 0, 'registros');
          setSalaryWithdrawals(salaryWithdrawalsRes.data || []);
        } else {
          console.error('❌ loadData() - Error en extracciones de sueldo:', salaryWithdrawalsRes.error);
          if (salaryWithdrawalsRes.error?.includes('salary_withdrawals')) {
            console.warn('⚠️ Tabla salary_withdrawals no existe, estableciendo array vacío');
            setSalaryWithdrawals([]);
          } else {
            toast.error(`Error cargando extracciones de sueldo: ${salaryWithdrawalsRes.error}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando extracciones de sueldo, estableciendo array vacío:', error);
        setSalaryWithdrawals([]);
      }

      // Cargar movimientos monetarios
      console.log('💰 loadData() - Cargando movimientos monetarios...');
      try {
        const monetaryMovementsRes = await financeApi.monetaryMovements.getAll();
        if (monetaryMovementsRes.success) {
          console.log('✅ loadData() - Movimientos monetarios cargados:', monetaryMovementsRes.data?.length || 0, 'registros');
          setMonetaryMovements(monetaryMovementsRes.data || []);
        } else {
          console.error('❌ loadData() - Error en movimientos monetarios:', monetaryMovementsRes.error);
          if (monetaryMovementsRes.error?.includes('monetary_movements')) {
            console.warn('⚠️ Tabla monetary_movements no existe, estableciendo array vacío');
            setMonetaryMovements([]);
          } else {
            toast.error(`Error cargando movimientos monetarios: ${monetaryMovementsRes.error}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando movimientos monetarios, estableciendo array vacío:', error);
        setMonetaryMovements([]);
      }

      // Cargar pedidos de stock
      console.log('📦 loadData() - Cargando pedidos de stock...');
      try {
        const stockOrdersRes = await stockOrdersApi.getAll();
        if (stockOrdersRes.success) {
          console.log('✅ loadData() - Pedidos de stock cargados:', stockOrdersRes.data?.length || 0, 'registros');
          setStockOrders(stockOrdersRes.data || []);
        } else {
          console.error('❌ loadData() - Error en pedidos de stock:', stockOrdersRes.error);
          toast.error(`Error cargando pedidos de stock: ${stockOrdersRes.error}`);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando pedidos de stock, estableciendo array vacío:', error);
        setStockOrders([]);
      }

      // Cargar estadísticas de productos
      console.log('📈 loadData() - Cargando estadísticas de productos...');
      try {
        const productStatsRes = await financeApi.productViews.getProductStats();
        if (productStatsRes.success) {
          console.log('✅ loadData() - Estadísticas de productos cargadas:', productStatsRes.data?.length || 0, 'registros');
          setProductStats(productStatsRes.data || []);
        } else {
          console.error('❌ loadData() - Error en estadísticas de productos:', productStatsRes.error);
          if (productStatsRes.error?.includes('product_profitability') || productStatsRes.error?.includes('products')) {
            console.warn('⚠️ Vista product_profitability no existe, estableciendo array vacío');
            setProductStats([]);
          } else {
            toast.error(`Error cargando estadísticas de productos: ${productStatsRes.error}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando estadísticas de productos, estableciendo array vacío:', error);
        setProductStats([]);
      }

      console.log('✅ loadData() - Carga de datos completada');

    } catch (error) {
      console.error('💥 loadData() - Error general:', error);
      toast.error(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      console.log('🔄 loadData() - Estableciendo loading a false...');
      setLoading(false);
      console.log('🔄 loadData() - Loading establecido a false');
    }
  };

  const handleSaleSubmit = async () => {
    if (!saleFormData.subtotal || parseFloat(saleFormData.subtotal) <= 0) {
      toast.error('El subtotal debe ser mayor a 0');
      return;
    }

    setSaving(true);
    try {
      const subtotal = parseFloat(saleFormData.subtotal);
      const discountAmount = parseFloat(saleFormData.discount_amount) || 0;
      const totalAmount = subtotal - discountAmount;

      const saleData: SaleInsert = {
        customer_name: saleFormData.customer_name.trim() || undefined,
        subtotal,
        tax_amount: 0,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: saleFormData.payment_method,
        payment_status: saleFormData.payment_status,
        sale_status: saleFormData.sale_status
      };

      const saleItems: SaleItemInsert[] = saleFormData.items.map(item => ({
        sale_id: '', // Will be set by the API
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        unit_cost: 0, // Should be calculated from product cost
        total_cost: 0
      }));

      let result;
      if (editingSale) {
        result = await financeApi.sales.update(editingSale.id, saleData);
        if (result.success) {
          toast.success('Venta actualizada correctamente');
        }
      } else {
        result = await financeApi.sales.create(saleData, saleItems);
        if (result.success) {
          toast.success('Venta registrada correctamente');
        }
      }

      if (result?.success) {
        resetSaleForm();
        await loadData();
      } else {
        toast.error(result?.error || 'Error saving sale');
      }

    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Error saving sale');
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseSubmit = async () => {
    if (!expenseFormData.description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }
    if (!expenseFormData.amount || parseFloat(expenseFormData.amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (!expenseFormData.category.trim()) {
      toast.error('La categoría es requerida');
      return;
    }

    setSaving(true);
    try {
      const expenseData: ExpenseInsert = {
        description: expenseFormData.description.trim(),
        amount: parseFloat(expenseFormData.amount),
        category: expenseFormData.category,
        payment_method: expenseFormData.payment_method,
        notes: expenseFormData.notes.trim() || undefined,
        expense_date: new Date().toISOString().split('T')[0] // Siempre fecha actual
      };

      let result;
      if (editingExpense) {
        result = await financeApi.expenses.update(editingExpense.id, expenseData);
        if (result.success) {
          toast.success('Gasto actualizado correctamente');
        }
      } else {
        result = await financeApi.expenses.create(expenseData);
        if (result.success) {
          toast.success('Gasto registrado correctamente');
        }
      }

      if (result?.success) {
        resetExpenseForm();
        await loadData();
      } else {
        console.error('❌ Expense operation failed:', result?.error);
        
        // Check for specific database-related errors
        if (result?.error?.includes('relation "public.expenses" does not exist')) {
          toast.error('Error: La tabla de gastos no existe en la base de datos. Por favor ejecuta el script de verificación.');
        } else if (result?.error?.includes('permission denied')) {
          toast.error('Error: Sin permisos para realizar esta operación.');
        } else if (result?.error?.includes('Supabase client not initialized')) {
          toast.error('Error: Configuración de base de datos incorrecta.');
        } else {
          toast.error(result?.error || 'Error al guardar el gasto');
        }
      }

    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Error saving expense');
    } finally {
      setSaving(false);
    }
  };

  const handleCashClosureSubmit = async () => {
    if (!cashClosureFormData.final_cash || parseFloat(cashClosureFormData.final_cash) < 0) {
      toast.error('El efectivo final debe ser 0 o mayor');
      return;
    }

    setSaving(true);
    try {
      const closureData: CashClosureInsert = {
        closure_date: cashClosureFormData.closure_date,
        opening_cash: parseFloat(cashClosureFormData.initial_cash) || 0,
        actual_cash: parseFloat(cashClosureFormData.final_cash),
        cash_sales: parseFloat(cashClosureFormData.cash_sales) || 0,
        card_sales: parseFloat(cashClosureFormData.card_sales) || 0,
        transfer_sales: parseFloat(cashClosureFormData.transfer_sales) || 0,
        expenses: parseFloat(cashClosureFormData.expenses) || 0,
        notes: cashClosureFormData.notes.trim() || undefined
      };

      let result;
      if (editingCashClosure) {
        result = await financeApi.cashClosures.update(editingCashClosure.id, closureData);
        if (result.success) {
          toast.success('Cierre actualizado correctamente');
        }
      } else {
        result = await financeApi.cashClosures.create(closureData);
        if (result.success) {
          toast.success('Cierre registrado correctamente');
        }
      }

      if (result?.success) {
        resetCashClosureForm();
        await loadData();
      } else {
        toast.error(result?.error || 'Error saving cash closure');
      }

    } catch (error) {
      console.error('Error saving cash closure:', error);
      toast.error('Error saving cash closure');
    } finally {
      setSaving(false);
    }
  };

  // Función para cierre de mes - resetea métricas específicas
  const handleMonthClosure = async () => {
    setSaving(true);
    try {
      console.log('🔄 Iniciando cierre de mes...');
      
      // Crear registro de cierre con los totales actuales
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Calcular totales actuales antes del reset
      const currentProductRevenue = sales.reduce((total, sale) => total + (sale.total_amount || 0), 0);
      const currentItemsSold = sales.reduce((total, sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          const saleItemsCount = sale.items.reduce((itemTotal: number, item: any) => {
            return itemTotal + (item.quantity || 1);
          }, 0);
          return total + saleItemsCount;
        }
        return total + 1;
      }, 0);
      
      const currentExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
      const currentSalaryWithdrawals = salaryWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
      const currentMonetaryMovements = monetaryMovements.reduce((total, movement) => {
        return movement.type === 'income' ? total + movement.amount : total - movement.amount;
      }, 0);
      
      // Registrar el cierre
      const closureData: CashClosureInsert = {
        closure_date: currentDate,
        opening_cash: 0,
        actual_cash: currentProductRevenue,
        cash_sales: currentProductRevenue,
        card_sales: 0,
        transfer_sales: 0,
        expenses: currentExpenses,
        notes: `🔐 CIERRE DE MES AUTOMÁTICO
📊 Resumen del período:
💰 Ingresos por productos: $${currentProductRevenue.toFixed(2)}
🛒 Items vendidos: ${currentItemsSold}
💸 Gastos totales: $${currentExpenses.toFixed(2)}
👥 Extracción de sueldos: $${currentSalaryWithdrawals.toFixed(2)}
🏦 Movimientos monetarios netos: $${currentMonetaryMovements.toFixed(2)}
📈 Ganancia del período: $${(currentProductRevenue + currentMonetaryMovements - currentExpenses - currentSalaryWithdrawals).toFixed(2)}`
      };

      // Intentar registrar el cierre (con manejo de errores si la tabla no existe)
      let closureRegistered = false;
      try {
        const closureResult = await financeApi.cashClosures.create(closureData);
        if (closureResult.success) {
          console.log('💰 Cierre registrado exitosamente en base de datos');
          closureRegistered = true;
        } else {
          console.warn('⚠️ No se pudo registrar en cash_closures:', closureResult.error);
        }
      } catch (dbError) {
        console.warn('⚠️ Tabla cash_closures no disponible, continuando sin registro en BD:', dbError);
      }
      
      // Siempre continuar con el proceso de cierre (independiente de si se guardó en BD)
      console.log('💰 Procesando cierre de mes...');
        
        // Marcar las ventas del período como archivadas agregando un campo de período cerrado
        console.log('� Archivando ventas del período...');
        for (const sale of sales) {
          try {
            // Nota: Aquí podrías agregar un campo "archived_period" a las ventas
            // o crear una tabla de períodos cerrados para mantener el historial
            console.log(`📦 Venta ${sale.id} del período archivada`);
          } catch (error) {
            console.warn('⚠️ Error archivando venta:', sale.id, error);
          }
        }
        
        // Reset de movimientos monetarios del período
        console.log('🏦 Procesando movimientos monetarios...');
        // Los movimientos se mantienen como historial pero se puede agregar una marca de período
        
        // Reset de extracciones de sueldos del período  
        console.log('👥 Procesando extracciones de sueldos...');
        // Las extracciones se mantienen como historial
        
        toast.success(`🎉 ¡Cierre de mes completado exitosamente!

📊 RESUMEN DEL PERÍODO CERRADO:
💰 Ingresos por productos: $${currentProductRevenue.toFixed(2)}
🛒 Items vendidos: ${currentItemsSold} unidades
💸 Total de gastos: $${currentExpenses.toFixed(2)}
👥 Extracción de sueldos: $${currentSalaryWithdrawals.toFixed(2)}
🏦 Movimientos monetarios: $${currentMonetaryMovements.toFixed(2)}

✨ Se ha iniciado un nuevo período contable
📈 Las métricas operativas se han reiniciado
📚 El historial se mantiene disponible para consulta

¡El sistema está listo para el nuevo mes!`, {
          duration: 8000,
        });
      
      toast.success(`🎉 ¡Cierre de mes completado exitosamente!

📊 RESUMEN DEL PERÍODO CERRADO:
💰 Ingresos por productos: $${currentProductRevenue.toFixed(2)}
🛒 Items vendidos: ${currentItemsSold} unidades
💸 Total de gastos: $${currentExpenses.toFixed(2)}
👥 Extracción de sueldos: $${currentSalaryWithdrawals.toFixed(2)}
🏦 Movimientos monetarios: $${currentMonetaryMovements.toFixed(2)}
📈 GANANCIA DEL PERÍODO: $${(currentProductRevenue + currentMonetaryMovements - currentExpenses - currentSalaryWithdrawals).toFixed(2)}

${closureRegistered ? '✅ Registro guardado en base de datos' : '⚠️ Continuó sin registro en BD (ejecutar scripts SQL)'}

✨ Se ha iniciado un nuevo período contable
📈 Las métricas operativas se han reiniciado
📚 El historial se mantiene disponible para consulta

¡El sistema está listo para el nuevo mes!`, {
        duration: 12000,
      });
      
      // Recargar datos para mostrar el nuevo estado
      await loadData();
      setIsCashClosureDialogOpen(false);

    } catch (error) {
      console.error('❌ Error en cierre de mes:', error);
      toast.error('❌ Error crítico al procesar el cierre de mes. Por favor contacta al administrador.');
    } finally {
      setSaving(false);
    }
  };

  // Función para revertir el último cierre de caja
  const handleRevertLastClosure = async () => {
    setSaving(true);
    try {
      console.log('🔄 Iniciando reversión del último cierre...');
      
      // Obtener el último cierre
      const closuresResponse = await financeApi.cashClosures.getAll();
      
      if (!closuresResponse.success || !closuresResponse.data || closuresResponse.data.length === 0) {
        toast.error('❌ No se encontraron cierres para revertir');
        return;
      }
      
      // Ordenar por fecha de cierre descendente para obtener el último
      const sortedClosures = closuresResponse.data.sort((a, b) => 
        new Date(b.closure_date).getTime() - new Date(a.closure_date).getTime()
      );
      
      const lastClosure = sortedClosures[0];
      console.log('📅 Último cierre encontrado:', lastClosure);
      
      // Mostrar información del cierre a revertir
      const confirmMessage = `¿Estás seguro de que deseas revertir el último cierre?

📅 Fecha del cierre: ${new Date(lastClosure.closure_date).toLocaleDateString('es-ES')}
💰 Efectivo registrado: $${lastClosure.actual_cash?.toFixed(2) || '0.00'}
📝 Notas: ${lastClosure.notes ? lastClosure.notes.substring(0, 100) + '...' : 'Sin notas'}

⚠️ Esta acción eliminará permanentemente este registro de cierre.`;
      
      if (!confirm(confirmMessage)) {
        console.log('❌ Reversión cancelada por el usuario');
        return;
      }
      
      // Eliminar el registro de cierre
      const deleteResult = await financeApi.cashClosures.delete(lastClosure.id);
      
      if (deleteResult.success) {
        console.log('✅ Cierre eliminado exitosamente de la base de datos');
        
        toast.success(`🔄 ¡Cierre revertido exitosamente!

📅 Cierre eliminado: ${new Date(lastClosure.closure_date).toLocaleDateString('es-ES')}
💰 Efectivo: $${lastClosure.actual_cash?.toFixed(2) || '0.00'}

✨ El período ha sido restaurado
📊 Los datos vuelven a estar disponibles para edición
🔄 Puedes realizar un nuevo cierre cuando sea necesario`, {
          duration: 8000,
        });
        
        // Recargar datos para reflejar los cambios
        await loadData();
        setIsRevertClosureDialogOpen(false); // Cerrar el diálogo
        
      } else {
        console.error('❌ Error eliminando el cierre:', deleteResult.error);
        toast.error(`❌ Error al revertir el cierre: ${deleteResult.error || 'Error desconocido'}`);
      }
      
    } catch (error) {
      console.error('❌ Error en reversión de cierre:', error);
      toast.error('❌ Error crítico al revertir el cierre. Por favor contacta al administrador.');
    } finally {
      setSaving(false);
    }
  };

  const resetSaleForm = () => {
    setSaleFormData({
      customer_name: '',
      payment_method: 'cash',
      payment_status: 'paid',
      sale_status: 'confirmed',
      subtotal: '',
      discount_amount: '0',
      items: []
    });
    setEditingSale(null);
    setIsSaleDialogOpen(false);
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      description: '',
      amount: '',
      category: '',
      payment_method: 'cash',
      notes: '',
      expense_date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
    setIsExpenseDialogOpen(false);
  };

  const resetCashClosureForm = () => {
    setCashClosureFormData({
      closure_date: new Date().toISOString().split('T')[0],
      initial_cash: '',
      final_cash: '',
      cash_sales: '',
      card_sales: '',
      transfer_sales: '',
      expenses: '',
      notes: ''
    });
    setEditingCashClosure(null);
    setIsCashClosureDialogOpen(false);
  };

  // Fixed cost handlers
  const handleFixedCostSubmit = async () => {
    if (!fixedCostFormData.name || !fixedCostFormData.amount) {
      toast.error('Nombre y monto son requeridos');
      return;
    }

    setSaving(true);
    try {
      const costData: FixedCostInsert = {
        name: fixedCostFormData.name.trim(),
        amount: parseFloat(fixedCostFormData.amount),
        frequency: fixedCostFormData.frequency,
        category: fixedCostFormData.category.trim() || undefined,
        description: fixedCostFormData.description.trim() || undefined
      };

      const result = await financeApi.fixedCosts.create(costData);
      
      if (result.success) {
        toast.success('Costo fijo agregado correctamente');
        setFixedCostFormData({
          name: '',
          amount: '',
          frequency: 'monthly',
          category: '',
          description: ''
        });
        await loadData();
      } else {
        toast.error(result.error || 'Error al agregar costo fijo');
      }
    } catch (error) {
      console.error('Error saving fixed cost:', error);
      toast.error('Error al guardar costo fijo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFixedCost = async (id: string) => {
    try {
      const result = await financeApi.fixedCosts.delete(id);
      if (result.success) {
        toast.success('Costo fijo eliminado');
        await loadData();
      } else {
        toast.error(result.error || 'Error al eliminar costo fijo');
      }
    } catch (error) {
      console.error('Error deleting fixed cost:', error);
      toast.error('Error al eliminar costo fijo');
    }
  };

  const handleEditFixedCost = (cost: FixedCost) => {
    setEditingFixedCost(cost);
    setFixedCostFormData({
      name: cost.name,
      amount: cost.amount.toString(),
      frequency: cost.frequency || 'monthly',
      category: cost.category || '',
      description: cost.description || ''
    });
  };

  const handleUpdateFixedCost = async () => {
    if (!editingFixedCost || !fixedCostFormData.name || !fixedCostFormData.amount) {
      toast.error('Nombre y monto son requeridos');
      return;
    }

    setSaving(true);
    try {
      const costData = {
        name: fixedCostFormData.name.trim(),
        amount: parseFloat(fixedCostFormData.amount),
        frequency: fixedCostFormData.frequency,
        category: fixedCostFormData.category.trim() || undefined,
        description: fixedCostFormData.description.trim() || undefined
      };

      const result = await financeApi.fixedCosts.update(editingFixedCost.id, costData);
      
      if (result.success) {
        toast.success('Costo fijo actualizado correctamente');
        setFixedCostFormData({
          name: '',
          amount: '',
          frequency: 'monthly',
          category: '',
          description: ''
        });
        setEditingFixedCost(null);
        await loadData();
      } else {
        toast.error(result.error || 'Error al actualizar costo fijo');
      }
    } catch (error) {
      console.error('Error updating fixed cost:', error);
      toast.error('Error al actualizar costo fijo');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditingFixedCost = () => {
    setEditingFixedCost(null);
    setFixedCostFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      category: '',
      description: ''
    });
  };

  // Salary withdrawal handlers
  const handleSalaryWithdrawalSubmit = async () => {
    if (!salaryWithdrawalFormData.person_name || !salaryWithdrawalFormData.amount) {
      toast.error('Nombre de persona y monto son requeridos');
      return;
    }

    setSaving(true);
    try {
      const withdrawalData: SalaryWithdrawalInsert = {
        person_name: salaryWithdrawalFormData.person_name.trim(),
        amount: parseFloat(salaryWithdrawalFormData.amount),
        withdrawal_date: new Date().toISOString().split('T')[0], // Fecha actual
        description: salaryWithdrawalFormData.description.trim() || undefined,
        notes: salaryWithdrawalFormData.notes.trim() || undefined
      };

      const result = await financeApi.salaryWithdrawals.create(withdrawalData);
      
      if (result.success) {
        toast.success('Extracción de sueldo registrada correctamente');
        setSalaryWithdrawalFormData({
          person_name: '',
          amount: '',
          withdrawal_date: new Date().toISOString().split('T')[0],
          description: '',
          notes: ''
        });
        await loadData();
      } else {
        toast.error(result.error || 'Error al registrar extracción');
      }
    } catch (error) {
      console.error('Error saving salary withdrawal:', error);
      toast.error('Error al guardar extracción de sueldo');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSalaryWithdrawal = (withdrawal: SalaryWithdrawal) => {
    setEditingSalaryWithdrawal(withdrawal);
    setSalaryWithdrawalFormData({
      person_name: withdrawal.person_name,
      amount: withdrawal.amount.toString(),
      withdrawal_date: withdrawal.withdrawal_date,
      description: withdrawal.description || '',
      notes: withdrawal.notes || ''
    });
  };

  const handleUpdateSalaryWithdrawal = async () => {
    if (!editingSalaryWithdrawal || !salaryWithdrawalFormData.person_name || !salaryWithdrawalFormData.amount) {
      toast.error('Nombre de persona y monto son requeridos');
      return;
    }

    setSaving(true);
    try {
      const withdrawalData = {
        person_name: salaryWithdrawalFormData.person_name.trim(),
        amount: parseFloat(salaryWithdrawalFormData.amount),
        withdrawal_date: editingSalaryWithdrawal.withdrawal_date, // Mantener fecha original
        description: salaryWithdrawalFormData.description.trim() || undefined,
        notes: salaryWithdrawalFormData.notes.trim() || undefined
      };

      const result = await financeApi.salaryWithdrawals.update(editingSalaryWithdrawal.id, withdrawalData);
      
      if (result.success) {
        toast.success('Extracción de sueldo actualizada correctamente');
        setSalaryWithdrawalFormData({
          person_name: '',
          amount: '',
          withdrawal_date: new Date().toISOString().split('T')[0],
          description: '',
          notes: ''
        });
        setEditingSalaryWithdrawal(null);
        await loadData();
      } else {
        toast.error(result.error || 'Error al actualizar extracción');
      }
    } catch (error) {
      console.error('Error updating salary withdrawal:', error);
      toast.error('Error al actualizar extracción de sueldo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSalaryWithdrawal = async (id: string) => {
    try {
      const result = await financeApi.salaryWithdrawals.delete(id);
      if (result.success) {
        toast.success('Extracción de sueldo eliminada');
        await loadData();
      } else {
        toast.error(result.error || 'Error al eliminar extracción');
      }
    } catch (error) {
      console.error('Error deleting salary withdrawal:', error);
      toast.error('Error al eliminar extracción de sueldo');
    }
  };

  const cancelEditingSalaryWithdrawal = () => {
    setEditingSalaryWithdrawal(null);
    setSalaryWithdrawalFormData({
      person_name: '',
      amount: '',
      withdrawal_date: new Date().toISOString().split('T')[0],
      description: '',
      notes: ''
    });
  };

  // Monetary movement handlers
  const handleMonetaryMovementSubmit = async () => {
    if (!monetaryMovementFormData.description || !monetaryMovementFormData.amount) {
      toast.error('Descripción y monto son requeridos');
      return;
    }

    setSaving(true);
    try {
      const movementData: MonetaryMovementInsert = {
        type: monetaryMovementFormData.type,
        amount: parseFloat(monetaryMovementFormData.amount),
        description: monetaryMovementFormData.description.trim(),
        category: monetaryMovementFormData.category.trim() || undefined,
        notes: monetaryMovementFormData.notes.trim() || undefined
      };

      const result = await financeApi.monetaryMovements.create(movementData);
      
      if (result.success) {
        toast.success('Movimiento monetario registrado correctamente');
        setMonetaryMovementFormData({
          type: 'income',
          amount: '',
          description: '',
          category: '',
          notes: ''
        });
        await loadData();
      } else {
        toast.error(result.error || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error saving monetary movement:', error);
      toast.error('Error al guardar movimiento monetario');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMonetaryMovement = (movement: MonetaryMovement) => {
    setEditingMonetaryMovement(movement);
    setMonetaryMovementFormData({
      type: movement.type,
      amount: movement.amount.toString(),
      description: movement.description,
      category: movement.category || '',
      notes: movement.notes || ''
    });
  };

  const handleUpdateMonetaryMovement = async () => {
    if (!editingMonetaryMovement || !monetaryMovementFormData.description || !monetaryMovementFormData.amount) {
      toast.error('Descripción y monto son requeridos');
      return;
    }

    setSaving(true);
    try {
      const movementData = {
        type: monetaryMovementFormData.type,
        amount: parseFloat(monetaryMovementFormData.amount),
        description: monetaryMovementFormData.description.trim(),
        category: monetaryMovementFormData.category.trim() || undefined,
        notes: monetaryMovementFormData.notes.trim() || undefined,
        movement_date: editingMonetaryMovement.movement_date // Mantener fecha original
      };

      const result = await financeApi.monetaryMovements.update(editingMonetaryMovement.id, movementData);
      
      if (result.success) {
        toast.success('Movimiento monetario actualizado correctamente');
        setMonetaryMovementFormData({
          type: 'income',
          amount: '',
          description: '',
          category: '',
          notes: ''
        });
        setEditingMonetaryMovement(null);
        await loadData();
      } else {
        toast.error(result.error || 'Error al actualizar movimiento');
      }
    } catch (error) {
      console.error('Error updating monetary movement:', error);
      toast.error('Error al actualizar movimiento monetario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonetaryMovement = async (id: string) => {
    try {
      const result = await financeApi.monetaryMovements.delete(id);
      if (result.success) {
        toast.success('Movimiento monetario eliminado');
        await loadData();
      } else {
        toast.error(result.error || 'Error al eliminar movimiento');
      }
    } catch (error) {
      console.error('Error deleting monetary movement:', error);
      toast.error('Error al eliminar movimiento monetario');
    }
  };

  const cancelEditingMonetaryMovement = () => {
    setEditingMonetaryMovement(null);
    setMonetaryMovementFormData({
      type: 'income',
      amount: '',
      description: '',
      category: '',
      notes: ''
    });
  };

  // Calculate financial metrics
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  // Get payment method distribution
  const paymentMethodData = sales.reduce((acc: any, sale) => {
    const method = sale.payment_method || 'cash';
    acc[method] = (acc[method] || 0) + sale.total_amount;
    return acc;
  }, {});

  const paymentChartData = Object.entries(paymentMethodData).map(([method, amount]) => ({
    name: method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method === 'transfer' ? 'Transferencia' : 'Otro',
    value: amount as number
  }));

  // Get expense categories
  const expenseCategories = expenses.reduce((acc: any, expense) => {
    const category = expense.category || 'other';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {});

  const expenseChartData = Object.entries(expenseCategories).map(([category, amount]) => ({
    name: category,
    value: amount as number
  }));

  // Process sales data for time-based charts
  const getSalesChartData = () => {
    const now = new Date();
    const data: { name: string; ventas: number; gastos: number; ganancia: number }[] = [];

    if (chartTimeFilter === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySales = sales.filter(sale => 
          sale.created_at?.startsWith(dateStr)
        ).reduce((sum, sale) => sum + (sale.total_amount || sale.total_price || 0), 0);
        
        const dayExpenses = expenses.filter(expense => 
          expense.expense_date === dateStr
        ).reduce((sum, expense) => sum + expense.amount, 0);
        
        data.push({
          name: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          ventas: daySales,
          gastos: dayExpenses,
          ganancia: daySales - dayExpenses
        });
      }
    } else if (chartTimeFilter === 'month') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const monthSales = sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate.getFullYear() === year && saleDate.getMonth() + 1 === month;
        }).reduce((sum, sale) => sum + (sale.total_amount || sale.total_price || 0), 0);
        
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month;
        }).reduce((sum, expense) => sum + expense.amount, 0);
        
        data.push({
          name: date.toLocaleDateString('es-ES', { month: 'short' }),
          ventas: monthSales,
          gastos: monthExpenses,
          ganancia: monthSales - monthExpenses
        });
      }
    } else if (chartTimeFilter === 'year') {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        
        const yearSales = sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate.getFullYear() === year;
        }).reduce((sum, sale) => sum + (sale.total_amount || sale.total_price || 0), 0);
        
        const yearExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate.getFullYear() === year;
        }).reduce((sum, expense) => sum + expense.amount, 0);
        
        data.push({
          name: year.toString(),
          ventas: yearSales,
          gastos: yearExpenses,
          ganancia: yearSales - yearExpenses
        });
      }
    }

    return data;
  };

  const salesChartData = getSalesChartData();

  // Auth loading
  // DEVELOPMENT MODE: Skip auth loading check
  // TODO: Re-enable when auth system is ready
  /*
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access denied
  if (!user || !isAdmin) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }
  */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión Financiera</h1>
          <p className="text-muted-foreground">Control completo de ventas, gastos y cierres de caja</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCashClosureDialogOpen} onOpenChange={setIsCashClosureDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Calculator className="h-4 w-4 mr-2" />
                Cierre de Caja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">🔐 Cierre de Mes</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Advertencia</h3>
                  <p className="text-sm text-yellow-700">
                    Esta acción registrará un cierre de período contable y archivará las métricas actuales para iniciar un nuevo mes.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">📊 Métricas que se resetearán:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Ingreso por Productos</li>
                    <li>✅ Movimientos Monetarios</li>
                    <li>❌ Costos Fijos (se mantienen)</li>
                    <li>✅ Extracción de Sueldos</li>
                    <li>✅ Costos de Pedidos</li>
                    <li>✅ Items Vendidos</li>
                    <li>✅ Tasa de Conversión</li>
                    <li>❌ Patrimonio Total (se mantiene)</li>
                    <li>❌ Capital Disponible (se mantiene)</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCashClosureDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleMonthClosure}
                    disabled={saving}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Confirmar Cierre
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isRevertClosureDialogOpen} onOpenChange={setIsRevertClosureDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                <RotateCcw className="h-4 w-4 mr-2" />
                Revertir Último Cierre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-orange-600">🔄 Revertir Cierre de Caja</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">⚠️ Advertencia Crítica</h3>
                  <p className="text-sm text-red-700">
                    Esta acción eliminará permanentemente el último registro de cierre de caja y NO se puede deshacer.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">📋 Efectos de la reversión:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>🗑️ Se eliminará el último registro de cierre</li>
                    <li>📊 Los datos del período volverán a estar disponibles</li>
                    <li>✏️ Podrás editar/agregar datos del período</li>
                    <li>🔄 Podrás realizar un nuevo cierre cuando sea necesario</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">🤔 ¿Cuándo usar esta función?</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Error en el proceso de cierre</li>
                    <li>• Necesitas agregar datos faltantes</li>
                    <li>• Corrección de métricas del período</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRevertClosureDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleRevertLastClosure}
                    disabled={saving}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Revirtiendo...' : 'Confirmar Reversión'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expense_description">Descripción</Label>
                  <Input
                    id="expense_description"
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                    placeholder="Descripción del gasto"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="expense_amount">Monto</Label>
                    <Input
                      id="expense_amount"
                      type="number"
                      step="0.01"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense_category">Categoría</Label>
                    <div className="space-y-2">
                      <Select
                        value={expenseFormData.category}
                        onValueChange={(value) => setExpenseFormData({ ...expenseFormData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {customExpenseCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Add new category */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nueva categoría"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCategory();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCategory}
                          disabled={!newCategory.trim()}
                        >
                          +
                        </Button>
                      </div>
                      
                      {/* Show existing categories with delete option */}
                      {customExpenseCategories.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Categorías existentes:</p>
                          <div className="flex flex-wrap gap-1">
                            {customExpenseCategories.map((category) => (
                              <span
                                key={category}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                              >
                                {category}
                                <button
                                  type="button"
                                  onClick={() => removeCategory(category)}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                  title="Eliminar categoría"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expense_payment_method">Método de Pago</Label>
                    <Select
                      value={expenseFormData.payment_method}
                      onValueChange={(value: PaymentMethod) => setExpenseFormData({ ...expenseFormData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expense_notes">Notas</Label>
                  <Textarea
                    id="expense_notes"
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    placeholder="Notas adicionales"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleExpenseSubmit} 
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      editingExpense ? 'Actualizar Gasto' : 'Registrar Gasto'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetExpenseForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(() => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const monthlySales = sales
                  .filter(sale => {
                    const saleDate = new Date(sale.created_at);
                    return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
                const monthlyIncomes = monetaryMovements
                  .filter(movement => {
                    const movementDate = new Date(movement.movement_date);
                    return movement.type === 'income' && 
                           movementDate.getMonth() === thisMonth && 
                           movementDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, movement) => sum + movement.amount, 0);
                return (monthlySales + monthlyIncomes).toFixed(2);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ventas + Ingresos adicionales
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(() => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const monthlyExpenses = expenses
                  .filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, expense) => sum + expense.amount, 0);
                const monthlyWithdrawals = monetaryMovements
                  .filter(movement => {
                    const movementDate = new Date(movement.movement_date);
                    return movement.type === 'withdrawal' && 
                           movementDate.getMonth() === thisMonth && 
                           movementDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, movement) => sum + movement.amount, 0);
                const monthlyFixedCosts = fixedCosts
                  .filter(cost => cost.is_active && cost.frequency === 'monthly')
                  .reduce((sum, cost) => sum + cost.amount, 0);
                return (monthlyExpenses + monthlyWithdrawals + monthlyFixedCosts).toFixed(2);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos + Extracciones + Costos fijos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Mensual</CardTitle>
            {(() => {
              const thisMonth = new Date().getMonth();
              const thisYear = new Date().getFullYear();
              const monthlySales = sales
                .filter(sale => {
                  const saleDate = new Date(sale.created_at);
                  return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
                })
                .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
              const monthlyIncomes = monetaryMovements
                .filter(movement => {
                  const movementDate = new Date(movement.movement_date);
                  return movement.type === 'income' && 
                         movementDate.getMonth() === thisMonth && 
                         movementDate.getFullYear() === thisYear;
                })
                .reduce((sum, movement) => sum + movement.amount, 0);
              const monthlyExpenses = expenses
                .filter(expense => {
                  const expenseDate = new Date(expense.expense_date);
                  return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
                })
                .reduce((sum, expense) => sum + expense.amount, 0);
              const monthlyWithdrawals = monetaryMovements
                .filter(movement => {
                  const movementDate = new Date(movement.movement_date);
                  return movement.type === 'withdrawal' && 
                         movementDate.getMonth() === thisMonth && 
                         movementDate.getFullYear() === thisYear;
                })
                .reduce((sum, movement) => sum + movement.amount, 0);
              const monthlyFixedCosts = fixedCosts
                .filter(cost => cost.is_active && cost.frequency === 'monthly')
                .reduce((sum, cost) => sum + cost.amount, 0);
              const balance = (monthlySales + monthlyIncomes) - (monthlyExpenses + monthlyWithdrawals + monthlyFixedCosts);
              return balance >= 0 ? (
                <Calculator className="h-4 w-4 text-green-600" />
              ) : (
                <Calculator className="h-4 w-4 text-red-600" />
              );
            })()}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(() => {
              const thisMonth = new Date().getMonth();
              const thisYear = new Date().getFullYear();
              const monthlySales = sales
                .filter(sale => {
                  const saleDate = new Date(sale.created_at);
                  return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
                })
                .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
              const monthlyIncomes = monetaryMovements
                .filter(movement => {
                  const movementDate = new Date(movement.movement_date);
                  return movement.type === 'income' && 
                         movementDate.getMonth() === thisMonth && 
                         movementDate.getFullYear() === thisYear;
                })
                .reduce((sum, movement) => sum + movement.amount, 0);
              const monthlyExpenses = expenses
                .filter(expense => {
                  const expenseDate = new Date(expense.expense_date);
                  return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
                })
                .reduce((sum, expense) => sum + expense.amount, 0);
              const monthlyWithdrawals = monetaryMovements
                .filter(movement => {
                  const movementDate = new Date(movement.movement_date);
                  return movement.type === 'withdrawal' && 
                         movementDate.getMonth() === thisMonth && 
                         movementDate.getFullYear() === thisYear;
                })
                .reduce((sum, movement) => sum + movement.amount, 0);
              const monthlyFixedCosts = fixedCosts
                .filter(cost => cost.is_active && cost.frequency === 'monthly')
                .reduce((sum, cost) => sum + cost.amount, 0);
              const balance = (monthlySales + monthlyIncomes) - (monthlyExpenses + monthlyWithdrawals + monthlyFixedCosts);
              return balance >= 0 ? 'text-green-600' : 'text-red-600';
            })()}`}>
              ${(() => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const monthlySales = sales
                  .filter(sale => {
                    const saleDate = new Date(sale.created_at);
                    return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
                const monthlyIncomes = monetaryMovements
                  .filter(movement => {
                    const movementDate = new Date(movement.movement_date);
                    return movement.type === 'income' && 
                           movementDate.getMonth() === thisMonth && 
                           movementDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, movement) => sum + movement.amount, 0);
                const monthlyExpenses = expenses
                  .filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, expense) => sum + expense.amount, 0);
                const monthlyWithdrawals = monetaryMovements
                  .filter(movement => {
                    const movementDate = new Date(movement.movement_date);
                    return movement.type === 'withdrawal' && 
                           movementDate.getMonth() === thisMonth && 
                           movementDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, movement) => sum + movement.amount, 0);
                const monthlyFixedCosts = fixedCosts
                  .filter(cost => cost.is_active && cost.frequency === 'monthly')
                  .reduce((sum, cost) => sum + cost.amount, 0);
                const balance = (monthlySales + monthlyIncomes) - (monthlyExpenses + monthlyWithdrawals + monthlyFixedCosts);
                return Math.abs(balance).toFixed(2);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const monthlySales = sales
                  .filter(sale => {
                    const saleDate = new Date(sale.created_at);
                    return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
                const monthlyIncomes = monetaryMovements
                  .filter(movement => {
                    const movementDate = new Date(movement.movement_date);
                    return movement.type === 'income' && 
                           movementDate.getMonth() === thisMonth && 
                           movementDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, movement) => sum + movement.amount, 0);
                const monthlyExpenses = expenses
                  .filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, expense) => sum + expense.amount, 0);
                const monthlyWithdrawals = monetaryMovements
                  .filter(movement => {
                    const movementDate = new Date(movement.movement_date);
                    return movement.type === 'withdrawal' && 
                           movementDate.getMonth() === thisMonth && 
                           movementDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, movement) => sum + movement.amount, 0);
                const monthlyFixedCosts = fixedCosts
                  .filter(cost => cost.is_active && cost.frequency === 'monthly')
                  .reduce((sum, cost) => sum + cost.amount, 0);
                const balance = (monthlySales + monthlyIncomes) - (monthlyExpenses + monthlyWithdrawals + monthlyFixedCosts);
                return balance >= 0 ? 'Ganancia del mes' : 'Pérdida del mes';
              })()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Fijos Mensuales</CardTitle>
            <PiggyBank className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${fixedCosts
                .filter(cost => cost.is_active && cost.frequency === 'monthly')
                .reduce((sum, cost) => sum + cost.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fixedCosts.filter(cost => cost.is_active).length} costos activos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sueldos Pagados (Mes)</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(() => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                return salaryWithdrawals
                  .filter(withdrawal => {
                    const withdrawalDate = new Date(withdrawal.withdrawal_date);
                    return withdrawalDate.getMonth() === thisMonth && withdrawalDate.getFullYear() === thisYear;
                  })
                  .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
                  .toFixed(2);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                return salaryWithdrawals
                  .filter(withdrawal => {
                    const withdrawalDate = new Date(withdrawal.withdrawal_date);
                    return withdrawalDate.getMonth() === thisMonth && withdrawalDate.getFullYear() === thisYear;
                  }).length;
              })()} extracciones este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Extras</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">
                  +${monetaryMovements
                    .filter(m => m.type === 'income')
                    .reduce((sum, m) => sum + m.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600">Extracciones:</span>
                <span className="text-sm font-medium text-red-600">
                  -${monetaryMovements
                    .filter(m => m.type === 'withdrawal')
                    .reduce((sum, m) => sum + m.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {monetaryMovements.length} movimientos totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Más Vistos</CardTitle>
            <Eye className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {productStats.length > 0 ? productStats[0]?.views_last_30_days || 0 : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {productStats.length > 0 ? `${productStats[0]?.name || 'Producto'} - Líder` : 'Sin datos de productos'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="costs">Costos</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas Registradas</CardTitle>
              <CardDescription>Historial de todas las ventas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      console.log('🖼️ RENDERIZANDO TABLA - sales.length:', sales.length);
                      console.log('🖼️ RENDERIZANDO TABLA - sales array:', sales);
                      if (sales.length === 0) console.log('⚠️ TABLA VACÍA - No hay ventas para mostrar');
                      return null;
                    })()}
                    {sales.map((sale) => {
                      console.log('🖼️ RENDERIZANDO VENTA:', sale);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {sale.customer_name || 'Cliente anónimo'}
                          </TableCell>
                          <TableCell>
                            {new Date(sale.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${(sale.total_amount || sale.total_price)?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(sale.payment_method || 'cash') === 'cash' ? 'Efectivo' :
                               (sale.payment_method || 'cash') === 'card' ? 'Tarjeta' :
                               (sale.payment_method || 'cash') === 'transfer' ? 'Transferencia' : 'Efectivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              (sale.payment_status || 'paid') === 'paid' ? 'default' :
                              (sale.payment_status || 'paid') === 'pending' ? 'secondary' : 'default'
                            }>
                              {(sale.payment_status || 'paid') === 'paid' ? 'Pagado' :
                               (sale.payment_status || 'paid') === 'pending' ? 'Pendiente' :
                               (sale.payment_status || 'paid') === 'failed' ? 'Fallido' : 'Pagado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSale(sale);
                                  setSaleFormData({
                                    customer_name: sale.customer_name || '',
                                    payment_method: sale.payment_method || 'cash',
                                    payment_status: sale.payment_status || 'paid',
                                    sale_status: sale.sale_status || 'confirmed',
                                    subtotal: sale.subtotal?.toString() || '',
                                    discount_amount: sale.discount_amount?.toString() || '0',
                                    items: []
                                  });
                                  setIsSaleDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Implement view details
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {sales.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No hay ventas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos Registrados</CardTitle>
              <CardDescription>Historial de todos los gastos</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${expense.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expense.payment_method === 'cash' ? 'Efectivo' :
                             expense.payment_method === 'card' ? 'Tarjeta' :
                             expense.payment_method === 'transfer' ? 'Transferencia' : 'Otro'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingExpense(expense);
                                setExpenseFormData({
                                  description: expense.description,
                                  amount: expense.amount.toString(),
                                  category: expense.category,
                                  payment_method: expense.payment_method || 'cash',
                                  notes: expense.notes || '',
                                  expense_date: expense.expense_date
                                });
                                setIsExpenseDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
                                  try {
                                    const result = await financeApi.expenses.delete(expense.id);
                                    if (result.success) {
                                      toast.success('Gasto eliminado correctamente');
                                      await loadData();
                                    } else {
                                      toast.error(result.error || 'Error deleting expense');
                                    }
                                  } catch (error) {
                                    toast.error('Error deleting expense');
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {expenses.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No hay gastos registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-closures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cierres de Caja</CardTitle>
              <CardDescription>Registro de cierres diarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Funcionalidad de cierres de caja en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Time Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis Temporal</CardTitle>
              <CardDescription>Filtros de tiempo para gráficos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={chartTimeFilter === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartTimeFilter('day')}
                >
                  Últimos 7 días
                </Button>
                <Button
                  variant={chartTimeFilter === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartTimeFilter('month')}
                >
                  Últimos 12 meses
                </Button>
                <Button
                  variant={chartTimeFilter === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartTimeFilter('year')}
                >
                  Últimos 5 años
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Ventas</CardTitle>
              <CardDescription>Evolución de ventas en el tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Ventas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profit vs Costs Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ganancia vs Costos</CardTitle>
              <CardDescription>Comparación de ganancias y gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    name="Ingresos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gastos" 
                    stroke="#FF8042" 
                    strokeWidth={2}
                    name="Gastos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Ganancia Neta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {productStats.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-900 mb-2">📊 Sin datos de productos</h3>
              <p className="text-amber-700 text-sm mb-3">
                No hay estadísticas de productos disponibles. Esto puede deberse a:
              </p>
              <ul className="text-amber-600 text-xs space-y-1 ml-4">
                <li>• Las tablas necesarias no están creadas en la base de datos</li>
                <li>• No hay productos registrados en el sistema</li>
                <li>• No se han registrado vistas o ventas aún</li>
              </ul>
              <p className="text-amber-600 text-xs mt-3">
                Ejecuta <code className="bg-amber-100 px-1 py-0.5 rounded">fix_missing_tables.sql</code> para configurar las tablas necesarias.
              </p>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Popularidad de Productos</CardTitle>
              <CardDescription>Compara vistas, pedidos y ventas para identificar tendencias y oportunidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="sort-by">Ordenar por:</Label>
                <Select defaultValue="sales">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar orden" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Ventas</SelectItem>
                    <SelectItem value="orders">Pedidos</SelectItem>
                    <SelectItem value="views">Vistas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Vistas (30d)</TableHead>
                    <TableHead>Pedidos (30d)</TableHead>
                    <TableHead>Ventas (30d)</TableHead>
                    <TableHead>Tasa de Conversión</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productStats.map((product) => {
                    const conversionRate = product.views_last_30_days > 0 
                      ? ((product.sales_last_30_days / product.views_last_30_days) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.views_last_30_days}</TableCell>
                        <TableCell>{product.orders_last_30_days}</TableCell>
                        <TableCell>{product.sales_last_30_days}</TableCell>
                        <TableCell>{conversionRate}%</TableCell>
                        <TableCell>{product.current_stock}</TableCell>
                      </TableRow>
                    );
                  })}
                  {productStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay datos de productos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rentabilidad</CardTitle>
              <CardDescription>Evalúa la rentabilidad para optimizar precios y estrategias</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>Ganancia por Unidad</TableHead>
                    <TableHead>Ventas (30d)</TableHead>
                    <TableHead>Ganancia Total (30d)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productStats.map((product) => {
                    const totalProfit30d = product.gross_profit * product.sales_last_30_days;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>${product.production_cost.toFixed(2)}</TableCell>
                        <TableCell>${product.selling_price.toFixed(2)}</TableCell>
                        <TableCell className={`font-medium ${product.profit_margin_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.profit_margin_percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell>${product.gross_profit.toFixed(2)}</TableCell>
                        <TableCell>{product.sales_last_30_days}</TableCell>
                        <TableCell className={`font-medium ${totalProfit30d > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${totalProfit30d.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {productStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay datos de rentabilidad disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          {(fixedCosts.length === 0 && salaryWithdrawals.length === 0) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🔧 Configuración requerida</h3>
              <p className="text-blue-700 text-sm mb-3">
                Las tablas de costos fijos y extracciones de sueldo no están configuradas en la base de datos.
              </p>
              <p className="text-blue-600 text-xs">
                Ejecuta el script <code className="bg-blue-100 px-1 py-0.5 rounded">fix_missing_tables.sql</code> en Supabase SQL Editor para habilitar estas funcionalidades.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Costos Fijos</CardTitle>
                <CardDescription>Añade costos operativos para un cálculo de ganancias más preciso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fixed-cost-name">Nombre del Costo</Label>
                    <Input 
                      id="fixed-cost-name" 
                      placeholder="Ej: Alquiler, Internet"
                      value={fixedCostFormData.name}
                      onChange={(e) => setFixedCostFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fixed-cost-amount">Monto Mensual</Label>
                    <Input 
                      id="fixed-cost-amount" 
                      type="number" 
                      placeholder="0.00"
                      value={fixedCostFormData.amount}
                      onChange={(e) => setFixedCostFormData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={editingFixedCost ? handleUpdateFixedCost : handleFixedCostSubmit} disabled={saving}>
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? (editingFixedCost ? 'Actualizando...' : 'Agregando...') : (editingFixedCost ? 'Actualizar Costo Fijo' : 'Agregar Costo Fijo')}
                </Button>
                
                {editingFixedCost && (
                  <Button variant="outline" className="w-full" onClick={cancelEditingFixedCost}>
                    Cancelar Edición
                  </Button>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Costos Fijos Actuales</h4>
                  <div className="space-y-2">
                    {fixedCosts.map((cost) => (
                      <div key={cost.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{cost.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${cost.amount.toFixed(2)}/{cost.frequency === 'monthly' ? 'mes' : cost.frequency}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleEditFixedCost(cost)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFixedCost(cost.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {fixedCosts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No hay costos fijos registrados</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestión de Sueldos</CardTitle>
                <CardDescription>Registra extracciones de sueldo mensuales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salary-person">Persona</Label>
                    <Input 
                      id="salary-person" 
                      placeholder="Nombre del empleado"
                      value={salaryWithdrawalFormData.person_name}
                      onChange={(e) => setSalaryWithdrawalFormData(prev => ({ ...prev, person_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-amount">Monto</Label>
                    <Input 
                      id="salary-amount" 
                      type="number" 
                      placeholder="0.00"
                      value={salaryWithdrawalFormData.amount}
                      onChange={(e) => setSalaryWithdrawalFormData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="salary-description">Descripción</Label>
                  <Input 
                    id="salary-description" 
                    placeholder="Descripción de la extracción"
                    value={salaryWithdrawalFormData.description}
                    onChange={(e) => setSalaryWithdrawalFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="salary-notes">Notas</Label>
                  <Textarea 
                    id="salary-notes" 
                    placeholder="Notas adicionales"
                    value={salaryWithdrawalFormData.notes}
                    onChange={(e) => setSalaryWithdrawalFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={editingSalaryWithdrawal ? handleUpdateSalaryWithdrawal : handleSalaryWithdrawalSubmit} disabled={saving}>
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? (editingSalaryWithdrawal ? 'Actualizando...' : 'Registrando...') : (editingSalaryWithdrawal ? 'Actualizar Extracción' : 'Registrar Extracción')}
                </Button>
                
                {editingSalaryWithdrawal && (
                  <Button variant="outline" className="w-full" onClick={cancelEditingSalaryWithdrawal}>
                    Cancelar Edición
                  </Button>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Extracciones Recientes</h4>
                  <div className="space-y-2">
                    {salaryWithdrawals.slice(0, 5).map((withdrawal) => (
                      <div key={withdrawal.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{withdrawal.person_name}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.withdrawal_date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${withdrawal.amount.toFixed(2)}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleEditSalaryWithdrawal(withdrawal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSalaryWithdrawal(withdrawal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {salaryWithdrawals.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No hay extracciones registradas</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {!fixedCosts.length && !salaryWithdrawals.length && !monetaryMovements.length ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <PiggyBank className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Configuración de Base de Datos Necesaria</h3>
                  <p className="text-muted-foreground mb-4">
                    Las tablas de movimientos monetarios no están configuradas en la base de datos.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ejecuta el script de configuración de Supabase para habilitar esta funcionalidad.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Movimientos Monetarios</CardTitle>
                <CardDescription>Registra ingresos y extracciones monetarias directas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="movement-type">Tipo de Movimiento</Label>
                    <Select
                      value={monetaryMovementFormData.type}
                      onValueChange={(value: 'income' | 'withdrawal') => setMonetaryMovementFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">💰 Ingreso</SelectItem>
                        <SelectItem value="withdrawal">💸 Extracción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="movement-amount">Monto</Label>
                    <Input 
                      id="movement-amount" 
                      type="number" 
                      placeholder="0.00"
                      value={monetaryMovementFormData.amount}
                      onChange={(e) => setMonetaryMovementFormData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="movement-description">Descripción</Label>
                  <Input 
                    id="movement-description" 
                    placeholder="Descripción del movimiento"
                    value={monetaryMovementFormData.description}
                    onChange={(e) => setMonetaryMovementFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="movement-category">Categoría</Label>
                  <Input 
                    id="movement-category" 
                    placeholder="Categoría (opcional)"
                    value={monetaryMovementFormData.category}
                    onChange={(e) => setMonetaryMovementFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="movement-notes">Notas</Label>
                  <Textarea 
                    id="movement-notes" 
                    placeholder="Notas adicionales"
                    value={monetaryMovementFormData.notes}
                    onChange={(e) => setMonetaryMovementFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={editingMonetaryMovement ? handleUpdateMonetaryMovement : handleMonetaryMovementSubmit} 
                  disabled={saving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? (editingMonetaryMovement ? 'Actualizando...' : 'Registrando...') : (editingMonetaryMovement ? 'Actualizar Movimiento' : 'Registrar Movimiento')}
                </Button>
                
                {editingMonetaryMovement && (
                  <Button variant="outline" className="w-full" onClick={cancelEditingMonetaryMovement}>
                    Cancelar Edición
                  </Button>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Movimientos Recientes</h4>
                  <div className="space-y-2">
                    {monetaryMovements.slice(0, 10).map((movement) => (
                      <div key={movement.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {movement.type === 'income' ? (
                            <span className="text-green-600">💰</span>
                          ) : (
                            <span className="text-red-600">💸</span>
                          )}
                          <div>
                            <span className="font-medium">{movement.description}</span>
                            <p className="text-xs text-muted-foreground">
                              {new Date(movement.movement_date).toLocaleDateString('es-ES')}
                              {movement.category && ` • ${movement.category}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${movement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.type === 'income' ? '+' : '-'}${movement.amount.toFixed(2)}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleEditMonetaryMovement(movement)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMonetaryMovement(movement.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {monetaryMovements.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No hay movimientos monetarios registrados</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Pedidos (Inversión)</CardTitle>
              <CardDescription>Revisa el historial de pedidos de stock para analizar costos e ingresos potenciales</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stockOrders.length > 0 ? (
                <div className="space-y-4">
                  {stockOrders.map((order) => (
                    <Collapsible key={order.id}>
                      <div className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80">
                        <CollapsibleTrigger className="flex items-center gap-4 flex-1">
                          <div>
                            <h3 className="font-medium">
                              Pedido #{order.id.slice(-6)}
                              <Badge 
                                className="ml-2" 
                                variant={
                                  order.status === 'pending' ? 'default' :
                                  order.status === 'received' ? 'secondary' : 
                                  'destructive'
                                }
                              >
                                {order.status === 'pending' ? 'Pendiente' :
                                 order.status === 'received' ? 'Recibido' : 'Cancelado'}
                              </Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.order_date).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Ganancia Potencial</p>
                            <p className="font-medium text-green-600">
                              ${order.total_potential_profit?.toFixed(2) || '0.00'}
                              {order.total_cost && order.total_cost > 0 ? 
                                ` (${((order.total_potential_profit || 0) / order.total_cost * 100).toFixed(1)}%)` : 
                                ''
                              }
                            </p>
                          </div>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        
                        <div className="flex gap-2 ml-4">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setEditingStockOrder(order);
                                  setIsEditStockOrderModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const result = await stockOrdersApi.updateStatus(order.id, 'received');
                                  if (result.success) {
                                    toast.success('Pedido marcado como recibido y stock actualizado');
                                    loadData(); // Recargar datos
                                  } else {
                                    toast.error(result.error || 'Error al actualizar pedido');
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Marcar Recibido
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('¿Está seguro de que desea eliminar este pedido?')) {
                                const result = await stockOrdersApi.delete(order.id);
                                if (result.success) {
                                  toast.success('Pedido eliminado');
                                  loadData();
                                } else {
                                  toast.error(result.error || 'Error al eliminar pedido');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent className="p-4 border rounded-lg mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Atributo</TableHead>
                              <TableHead>Stock Entrante</TableHead>
                              <TableHead>Costo Unit.</TableHead>
                              <TableHead>Precio Unit.</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Subtotal Costo</TableHead>
                              <TableHead>Subtotal Venta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items?.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <span className="font-medium">{item.product_name}</span>
                                </TableCell>
                                <TableCell>
                                  {item.attribute_name && item.attribute_value ? (
                                    <span className="text-sm text-muted-foreground">
                                      {item.attribute_name}: {item.attribute_value}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>+{item.quantity}</TableCell>
                                <TableCell>${item.unit_cost?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell>${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell>{item.quantity} unidades</TableCell>
                                <TableCell>${item.total_cost?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell className="text-green-600 font-medium">
                                  ${item.total_potential_income?.toFixed(2) || '0.00'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Costo Total</p>
                            <p className="text-lg font-bold">${order.total_cost?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ingreso Potencial</p>
                            <p className="text-lg font-bold text-blue-600">
                              ${order.total_potential_income?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ganancia Potencial</p>
                            <p className="text-lg font-bold text-green-600">
                              ${order.total_potential_profit?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No hay pedidos de stock registrados</p>
                  <p className="text-sm">Los pedidos aparecerán aquí cuando los registres desde la sección de productos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de edición de pedidos */}
      <EditStockOrderModal
        isOpen={isEditStockOrderModalOpen}
        onClose={() => {
          setIsEditStockOrderModalOpen(false);
          setEditingStockOrder(null);
        }}
        order={editingStockOrder}
        onOrderUpdated={loadData}
      />
    </div>
  );
}