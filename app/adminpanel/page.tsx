// ...existing code...
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Users, 
  MessageSquareQuote, 
  GalleryHorizontal, 
  CircleDollarSign, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Wallet,
  DollarSign,
  Target,
  Eye,
  Calculator,
  PiggyBank,
  CreditCard,
  Building,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Plus,
  Edit,
  Trash2,
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Package2,
  Receipt,
  Sparkles,
  Info,
  Gem,
  Megaphone
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// Import APIs
import { salesApi, financeApi } from '@/lib/api/finances';
import { api } from '@/lib/api/products';
import { stockOrdersApi } from '@/lib/api/stockOrders';

// Tipos para períodos
interface Period {
  id: string;
  name: string;
  isCurrent: boolean;
  closure_date?: Date;
  created_at?: string;
  notes?: string;
}

const dashboardCards = [
  {
    title: 'Vista Principal',
    href: '/adminpanel/vistaprincipal',
    icon: Sparkles,
    description: 'Editar el contenido principal del home',
    color: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
    iconColor: 'text-amber-600'
  },
  {
    title: 'Productos',
    href: '/adminpanel/products',
    icon: Package,
    description: 'Gestionar catálogo y stock de productos',
    color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
    iconColor: 'text-blue-600'
  },
  {
    title: 'Categorías',
    href: '/adminpanel/names',
    icon: Users,
    description: 'Organizar categorías principales',
    color: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20',
    iconColor: 'text-teal-600'
  },
  {
    title: 'Subcategorías',
    href: '/adminpanel/models',
    icon: Users,
    description: 'Administrar subcategorías y variaciones',
    color: 'bg-lime-500/10 hover:bg-lime-500/20 border-lime-500/20',
    iconColor: 'text-lime-600'
  },
  {
    title: 'Carrusel',
    href: '/adminpanel/carousel',
    icon: GalleryHorizontal,
    description: 'Gestionar imágenes destacadas del carrusel',
    color: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20',
    iconColor: 'text-pink-600'
  },
  {
    title: 'Preguntas frecuentes',
    href: '/adminpanel/faq',
    icon: MessageSquareQuote,
    description: 'Actualizar las dudas más comunes de clientes',
    color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20',
    iconColor: 'text-orange-600'
  },
  {
    title: 'Sobre Nosotros',
    href: '/adminpanel/about',
    icon: Info,
    description: 'Editar la información institucional de la marca',
    color: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20',
    iconColor: 'text-sky-600'
  },
  {
    title: 'Materiales',
    href: '/adminpanel/materials',
    icon: Gem,
    description: 'Gestionar materialidad y especificaciones',
    color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20',
    iconColor: 'text-emerald-600'
  },
  {
    title: 'Nuestros clientes',
    href: '/adminpanel/testimonials',
    icon: UserCheck,
    description: 'Administrar testimonios y reseñas',
    color: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
    iconColor: 'text-purple-600'
  },
  {
    title: 'Announcement Bar',
    href: '/adminpanel/announcementbar',
    icon: Megaphone,
    description: 'Configurar mensajes destacados del sitio',
    color: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20',
    iconColor: 'text-rose-600'
  },
  {
    title: 'Pedidos',
    href: '/adminpanel/orders',
    icon: ShoppingCart,
    description: 'Seguimiento y gestión de pedidos de clientes',
    color: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20',
    iconColor: 'text-red-600'
  },
  {
    title: 'Finanzas',
    href: '/adminpanel/finances',
    icon: CircleDollarSign,
    description: 'Analítica financiera y reportes clave',
    color: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
    iconColor: 'text-cyan-600'
  }
];

// Mock data for simple overview
const overviewData = [
  { month: 'Ene', ventas: 4800 },
  { month: 'Feb', ventas: 5200 },
  { month: 'Mar', ventas: 4900 },
  { month: 'Abr', ventas: 6100 },
  { month: 'May', ventas: 5800 },
  { month: 'Jun', ventas: 6800 }
];

const recentActivity = [
  { id: 1, action: 'Nueva venta registrada', time: '2 horas', amount: '$125', type: 'sale' },
  { id: 2, action: 'Producto agregado al carrusel', time: '4 horas', amount: null, type: 'update' },
  { id: 3, action: 'Cliente registrado', time: '6 horas', amount: null, type: 'user' },
  { id: 4, action: 'Pedido de stock realizado', time: '1 día', amount: '$2,400', type: 'order' },
  { id: 5, action: 'FAQ actualizada', time: '2 días', amount: null, type: 'update' }
];

// Componente para cards expandibles del dashboard
interface ExpandableCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  breakdown?: Array<{ label: string; value: number; description?: string }>;
  color?: string;
  lastValue?: string;
  lastDate?: string;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({ 
  title, 
  value, 
  icon, 
  breakdown = [], 
  color = "text-gray-600",
  lastValue,
  lastDate
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {icon}
              {breakdown.length > 0 && (
                isOpen ? 
                <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CardContent>
          <div className={`text-2xl font-bold ${color}`}>
            {value}
          </div>
          {lastValue && lastDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Último: {lastValue} ({lastDate})
            </p>
          )}
          
          {breakdown.length > 0 && (
            <CollapsibleContent className="space-y-2">
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Desglose del cálculo:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-600">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-gray-400">{item.description}</span>
                        )}
                      </div>
                      <span className={`font-medium ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(item.value).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>Total:</span>
                    <span className={color}>{value}</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
};

export default function AdminPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>({ id: 'current', name: 'Período Actual', isCurrent: true }); // Período seleccionado como objeto
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([
    { id: 'current', name: 'Período Actual', isCurrent: true }
  ]);
  const [loading, setLoading] = useState(false);
  
  const [quickStats, setQuickStats] = useState({
    productRevenue: 0,
    monetaryMovements: 0,
    fixedCosts: 0,
    salaryWithdrawals: 0,
    orderCosts: 0,
    lastOrderCost: 0,
    lastOrderDate: '---',
    totalCosts: 0,
    totalRevenue: 0,
    profit: 0,
    totalPatrimony: 0,
    itemsSold: 0,
    conversionRate: 0,
    availableCapital: 0
  });

  // Función para formatear números de manera consistente
  const formatCurrency = (amount: number): string => {
    return Math.round(amount).toLocaleString('en-US');
  };

  // Función para generar los desgloses de cada métrica con datos reales
  const generateBreakdowns = (stats: any) => {
    return {
      productRevenue: [
        { label: 'Ventas de productos', value: stats.productRevenue, description: 'Ingresos por ventas directas de productos' }
      ],
      monetaryMovements: [
        { label: 'Ingresos monetarios', value: stats.monetaryMovements >= 0 ? stats.monetaryMovements : 0, description: 'Entradas de efectivo externas' },
        { label: 'Extracciones monetarias', value: stats.monetaryMovements < 0 ? Math.abs(stats.monetaryMovements) : 0, description: 'Salidas de efectivo externas' }
      ],
      fixedCosts: [
        { label: 'Costos fijos mensuales', value: stats.fixedCosts, description: 'Alquiler, servicios, seguros, etc.' }
      ],
      salaryWithdrawals: [
        { label: 'Extracciones de sueldos', value: stats.salaryWithdrawals, description: 'Pagos a empleados y personal' }
      ],
      orderCosts: [
        { label: 'Costos de pedidos', value: stats.orderCosts, description: 'Inversión en stock e inventario' },
        ...(stats.lastOrderCost > 0 ? [{
          label: `Último pedido (${stats.lastOrderDate})`,
          value: -stats.lastOrderCost,
          description: 'Pedido más reciente registrado'
        }] : [])
      ],
      totalCosts: [
        { label: 'Costos fijos', value: stats.fixedCosts, description: 'Gastos operacionales fijos' },
        { label: 'Extracciones de sueldos', value: stats.salaryWithdrawals, description: 'Pagos de nómina' },
        { label: 'Costos de pedidos', value: stats.orderCosts, description: 'Inversión en inventario' },
        { label: 'Movimientos negativos', value: stats.monetaryMovements < 0 ? stats.monetaryMovements : 0, description: 'Extracciones monetarias' }
      ],
      totalRevenue: [
        { label: 'Ingresos por productos', value: stats.productRevenue, description: 'Ventas de productos' },
        { label: 'Movimientos positivos', value: stats.monetaryMovements > 0 ? stats.monetaryMovements : 0, description: 'Ingresos monetarios externos' }
      ],
      profit: [
        { label: 'Ingresos totales', value: stats.totalRevenue, description: 'Total de entradas de dinero' },
        { label: 'Costos totales', value: stats.totalCosts, description: 'Total de gastos y costos' }
      ],
      totalPatrimony: [
        { label: 'Valor del inventario', value: stats.totalPatrimony, description: 'Costo de todos los productos en stock' }
      ],
      itemsSold: [
        { label: 'Unidades vendidas', value: stats.itemsSold, description: 'Cantidad total de productos vendidos en el período' }
      ],
      conversionRate: [
        { label: 'Tasa de conversión', value: stats.conversionRate, description: 'Porcentaje de ventas concretadas sobre pedidos realizados' }
      ],
      availableCapital: [
        { label: 'Capital histórico disponible', value: stats.availableCapital, description: 'Ingresos históricos totales menos costos históricos totales desde siempre' }
      ]
    };
  };

  // Función para obtener detalles del desglose específicos para cada métrica
  const getBreakdownDetails = (metric: string, stats: any) => {
    const breakdowns = generateBreakdowns(stats);
    return breakdowns[metric as keyof typeof breakdowns] || [];
  };

  // Función para cargar períodos disponibles
  const loadAvailablePeriods = async () => {
    try {
      const response = await financeApi.cashClosures.getAll();
      if (response.success && response.data) {
        const periods = [
          { id: 'current', name: 'Período Actual', isCurrent: true },
          ...response.data.map((closure: any) => {
            // Convertir closure_date a objeto Date válido
            const closureDate = new Date(closure.closure_date);
            return {
              id: closure.id,
              name: `Cierre ${closureDate.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}`,
              isCurrent: false,
              closure_date: closureDate, // Asegurar que sea un objeto Date
              created_at: closure.created_at, // Hora real del cierre
              notes: closure.notes
            };
          })
        ];
        setAvailablePeriods(periods);
        console.log('📅 Períodos cargados:', periods.length);
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar los períodos cerrados:', error);
    }
  };

  // Función para filtrar datos por período
  const filterDataByPeriod = (data: any[], dateField: string = 'created_at') => {
    if (selectedPeriod.isCurrent) {
      // Para período actual, obtener datos después del último cierre (usando hora real del cierre: created_at)
      const lastClosure = availablePeriods
        .filter(p => !p.isCurrent && p.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
      if (lastClosure && lastClosure.created_at) {
        const cutoffDate = new Date(lastClosure.created_at);
        return data.filter(item => {
          const itemDate = new Date(item[dateField]);
          return itemDate.getTime() > cutoffDate.getTime();
        });
      }
      return data;
    } else {
      // Para período cerrado específico, mostrar datos hasta esa fecha (usando hora real del cierre: created_at)
      const selectedClosure = availablePeriods.find(p => p.id === selectedPeriod.id);
      if (selectedClosure && selectedClosure.created_at) {
        const cutoffDate = new Date(selectedClosure.created_at);
        // Encontrar el cierre anterior para delimitar el período
        const previousClosure = availablePeriods
          .filter(p => !p.isCurrent && p.created_at && new Date(p.created_at) < cutoffDate)
          .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
        return data.filter(item => {
          const itemDate = new Date(item[dateField]);
          const isBeforeCutoff = itemDate.getTime() <= cutoffDate.getTime();
          const isAfterPrevious = !previousClosure || !previousClosure.created_at || itemDate.getTime() > new Date(previousClosure.created_at).getTime();
          return isBeforeCutoff && isAfterPrevious;
        });
      }
      return [];
    }
  };

  // Cargar datos reales desde APIs
  useEffect(() => {
    const loadData = async () => {
      if (!selectedPeriod) return; // No cargar datos hasta que se seleccione un período
      
      try {
        setLoading(true);
        console.log(`🔄 Cargando datos del dashboard para el período: ${selectedPeriod.name}`);
        
        // Resto de la función... (que ya está implementada)
        if (selectedPeriod.isCurrent) {
          console.log('📅 Cargando datos del período actual (sin fechas de cierre)');
        } else {
          const closureDate = selectedPeriod.closure_date;
          if (closureDate && closureDate instanceof Date) {
            console.log(`📅 Cargando datos del período cerrado hasta: ${closureDate.toLocaleDateString()}`);
          } else {
            console.log('📅 Cargando datos del período cerrado (fecha no válida)');
          }
        }
        
        // Cargar ventas para calcular ingresos por productos
        const salesResponse = await salesApi.getAll();
        const allSales = salesResponse.success && salesResponse.data ? salesResponse.data : [];
        const sales = filterDataByPeriod(allSales, 'created_at');
        console.log(`💰 Ventas cargadas: ${sales.length} del período (${allSales.length} total)`);
        
        // Cargar pedidos de stock para calcular costos
        const stockOrdersResponse = await stockOrdersApi.getAll();
        const allStockOrders = stockOrdersResponse.success && stockOrdersResponse.data ? stockOrdersResponse.data : [];
        
        // Para pedidos de stock, filtramos por 'updated_at' (cuando se marcó como recibido)
  // Filtramos por 'created_at' para asignar el costo al período en que se pagó/creó el pedido
  const stockOrders = filterDataByPeriod(allStockOrders, 'created_at');
        
        console.log(`📦 Pedidos de stock cargados: ${stockOrders.length} del período (${allStockOrders.length} total)`);
        console.log(`📦 Debug - Período seleccionado:`, {
          periodName: selectedPeriod.name,
          isCurrent: selectedPeriod.isCurrent,
          closureDate: selectedPeriod.closure_date?.toISOString()
        });
        
        if (stockOrders.length > 0) {
          console.log(`📦 Primeros 3 pedidos en período (filtrados por created_at):`, stockOrders.slice(0, 3).map(order => ({
            id: order.id?.substring(0, 8),
            status: order.status,
            created_at: order.created_at,
            created_at_hora: new Date(order.created_at).toLocaleString(),
            updated_at: order.updated_at,
            updated_at_hora: new Date(order.updated_at).toLocaleString(),
            total_cost: order.total_cost
          })));
        }
        
        // Cargar movimientos monetarios
        const monetaryResponse = await financeApi.monetaryMovements.getAll();
        const allMonetaryMovements = monetaryResponse.success && monetaryResponse.data ? monetaryResponse.data : [];
        const monetaryMovements = filterDataByPeriod(allMonetaryMovements, 'movement_date');
        console.log(`💳 Movimientos monetarios cargados: ${monetaryMovements.length} del período (${allMonetaryMovements.length} total)`);
        
        // Cargar costos fijos (NO se filtran por período, son constantes)
        const fixedCostsResponse = await financeApi.fixedCosts.getAll();
        const fixedCosts = fixedCostsResponse.success && fixedCostsResponse.data ? fixedCostsResponse.data : [];
        console.log('🏢 Costos fijos cargados:', fixedCosts.length);
        
        // Cargar retiros de sueldos
        const salaryResponse = await financeApi.salaryWithdrawals.getAll();
        const allSalaryWithdrawals = salaryResponse.success && salaryResponse.data ? salaryResponse.data : [];
        const salaryWithdrawals = filterDataByPeriod(allSalaryWithdrawals, 'withdrawal_date');
        console.log(`👥 Retiros de sueldo cargados: ${salaryWithdrawals.length} del período (${allSalaryWithdrawals.length} total)`);
        
        // Cargar productos para calcular patrimonio total (NO se filtran por período)
        const productsResponse = await api.products.getAll();
        const products = productsResponse.success && productsResponse.data ? productsResponse.data : [];
        console.log('📦 Productos cargados:', products.length);
        
        // Calcular métricas de ventas
        const productRevenue = sales.reduce((total, sale) => total + (sale.total_amount || 0), 0);
        
        // Calcular items vendidos correctamente - sumar cantidades de cada item
        const itemsSold = sales.reduce((total, sale) => {
          if (sale.items && Array.isArray(sale.items)) {
            const saleItemsCount = sale.items.reduce((itemTotal: number, item: any) => {
              return itemTotal + (item.quantity || 1); // Sumar las cantidades de cada item
            }, 0);
            return total + saleItemsCount;
          }
          // Si no hay items detallados, contar como 1 item por venta (fallback)
          return total + 1;
        }, 0);
        
        console.log('📊 Items vendidos calculados:', itemsSold, 'de', sales.length, 'ventas');
        
        // Calcular movimientos monetarios (ingresos - extracciones)
        const totalMonetaryIncome = monetaryMovements
          .filter(m => m.type === 'income')
          .reduce((total, m) => total + (m.amount || 0), 0);
        const totalMonetaryWithdrawals = monetaryMovements
          .filter(m => m.type === 'withdrawal')
          .reduce((total, m) => total + (m.amount || 0), 0);
        const netMonetaryMovements = totalMonetaryIncome - totalMonetaryWithdrawals;
        
        // Calcular costos fijos totales
        const totalFixedCosts = fixedCosts.reduce((total, cost) => total + (cost.amount || 0), 0);
        
        // Calcular retiros de sueldos totales
        const totalSalaryWithdrawals = salaryWithdrawals.reduce((total, withdrawal) => total + (withdrawal.amount || 0), 0);
        
        // Calcular costos de pedidos de stock (solo pedidos recibidos)
        const receivedStockOrders = stockOrders.filter(order => order.status === 'received');
        const orderCosts = receivedStockOrders.reduce((total, order) => total + (order.total_cost || 0), 0);
        
        console.log(`📦 Análisis de pedidos de stock:`, {
          totalStockOrdersInPeriod: stockOrders.length,
          receivedInPeriod: receivedStockOrders.length,
          pendingInPeriod: stockOrders.filter(order => order.status === 'pending').length,
          orderCosts: orderCosts,
          period: selectedPeriod.name,
          isCurrent: selectedPeriod.isCurrent,
          filteredBy: 'created_at (fecha de pago/creación)'
        });

        // Mostrar detalles de pedidos recibidos
        if (receivedStockOrders.length > 0) {
          console.log(`📦 Pedidos recibidos en período:`, receivedStockOrders.map(order => ({
            id: order.id?.substring(0, 8),
            created_at: order.created_at,
            updated_at: order.updated_at,
            total_cost: order.total_cost,
            status: order.status
          })));
        }
          
        // Encontrar último pedido recibido en el período
        const lastOrder = receivedStockOrders
          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0];
        
        // Calcular valores financieros finales según especificaciones del usuario
        const totalFixedCostsCalc = totalFixedCosts;
        const totalSalaryWithdrawalsCalc = totalSalaryWithdrawals;
        const orderCostsCalc = orderCosts;
        const negativeMonetyaryMovements = monetaryMovements
          .filter(m => m.type === 'withdrawal')
          .reduce((total, m) => total + (m.amount || 0), 0);

        // COSTOS TOTALES: suma de costos fijos + sueldos + costos de pedidos + movimientos monetarios negativos
        const totalCosts = totalFixedCostsCalc + totalSalaryWithdrawalsCalc + orderCostsCalc + negativeMonetyaryMovements;

        // INGRESOS TOTALES: suma de ingresos por productos + movimientos monetarios positivos  
        const totalRevenue = productRevenue + totalMonetaryIncome;

        // GANANCIA: Ingresos totales - Costos totales
        const profit = totalRevenue - totalCosts;

        // PATRIMONIO TOTAL: suma de costos de todos los productos en stock
        const totalPatrimony = products.reduce((total: number, product: any) => {
          return total + ((product.cost || 0) * (product.stock || 0));
        }, 0);

        // CAPITAL DISPONIBLE: ingresos históricos totales menos costos históricos totales desde siempre (sin filtro de período)
        // Obtener todos los datos históricos sin filtrar
        const allSalesResponse = await salesApi.getAll();
        const allSalesData = allSalesResponse.success && allSalesResponse.data ? allSalesResponse.data : [];
        const allProductRevenue = allSalesData.reduce((total, sale) => total + (sale.total_amount || 0), 0);
        const allMonetaryResponse = await financeApi.monetaryMovements.getAll();
        const allMonetaryData = allMonetaryResponse.success && allMonetaryResponse.data ? allMonetaryResponse.data : [];
        const allMonetaryIncome = allMonetaryData.filter(m => m.type === 'income').reduce((total, m) => total + (m.amount || 0), 0);
        const allMonetaryWithdrawals = allMonetaryData.filter(m => m.type === 'withdrawal').reduce((total, m) => total + (m.amount || 0), 0);
        const allFixedCostsResponse = await financeApi.fixedCosts.getAll();
        const allFixedCosts = allFixedCostsResponse.success && allFixedCostsResponse.data ? allFixedCostsResponse.data : [];
        const allFixedCostsTotal = allFixedCosts.reduce((total, cost) => total + (cost.amount || 0), 0);
        const allSalaryResponse = await financeApi.salaryWithdrawals.getAll();
        const allSalaryData = allSalaryResponse.success && allSalaryResponse.data ? allSalaryResponse.data : [];
        const allSalaryTotal = allSalaryData.reduce((total, withdrawal) => total + (withdrawal.amount || 0), 0);
        const allStockOrdersResponse = await stockOrdersApi.getAll();
        const allStockOrdersData = allStockOrdersResponse.success && allStockOrdersResponse.data ? allStockOrdersResponse.data : [];
        const allOrderCosts = allStockOrdersData.filter(order => order.status === 'received').reduce((total, order) => total + (order.total_cost || 0), 0);
        const allTotalCosts = allFixedCostsTotal + allSalaryTotal + allOrderCosts + allMonetaryWithdrawals;
        const allTotalRevenue = allProductRevenue + allMonetaryIncome;
        const availableCapital = allTotalRevenue - allTotalCosts;
        
        // TASA DE CONVERSIÓN: porcentaje de ventas concretadas sobre pedidos realizados
        // Aquí asumimos que cada venta representa una conversión exitosa
        const totalOrders = sales.length; // Asumiendo que cada venta es un pedido
        const conversionRate = totalOrders > 0 ? (sales.length / totalOrders) * 100 : 0;
        
        console.log('📊 Métricas calculadas:', {
          productRevenue,
          netMonetaryMovements,
          totalFixedCosts,
          totalSalaryWithdrawals,
          orderCosts,
          profit
        });
        
        // Actualizar estado con datos reales calculados correctamente
        setQuickStats({
          productRevenue: Math.round(productRevenue),
          monetaryMovements: Math.round(netMonetaryMovements),
          fixedCosts: -Math.round(totalFixedCostsCalc), // Negativo para mostrar como gasto
          salaryWithdrawals: -Math.round(totalSalaryWithdrawalsCalc), // Negativo para mostrar como gasto
          orderCosts: -Math.round(orderCostsCalc), // Negativo para mostrar como gasto
          lastOrderCost: lastOrder?.total_cost || 0,
          lastOrderDate: lastOrder?.created_at ? new Date(lastOrder.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
          totalCosts: -Math.round(totalCosts), // Negativo para mostrar como gasto
          totalRevenue: Math.round(totalRevenue),
          profit: Math.round(profit),
          totalPatrimony: Math.round(totalPatrimony),
          itemsSold,
          conversionRate: Math.round(conversionRate * 10) / 10,
          availableCapital: Math.round(availableCapital)
        });
        
        console.log('✅ Dashboard actualizado con datos reales');
        
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Mantener valores por defecto en caso de error
        console.log('🔄 Usando valores por defecto debido al error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedPeriod]); // Dependencia del período seleccionado

  // Cargar períodos disponibles al montar el componente
  useEffect(() => {
    loadAvailablePeriods();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
        <p className="text-muted-foreground" style={{ marginBottom: "12px" }}>Resumen general y acceso rápido a todas las secciones</p>
        {selectedPeriod && selectedPeriod.closure_date && (
          <div className="mt-2 text-xs text-gray-500">
            <span>Cierre de caja: </span>
            <span className="font-mono">{new Date(selectedPeriod.closure_date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Selector de Período */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Período de Datos</CardTitle>
              <CardDescription>Selecciona el período para visualizar los datos financieros</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedPeriod.id} 
                onValueChange={(value) => {
                  const period = availablePeriods.find(p => p.id === value);
                  if (period) {
                    setSelectedPeriod(period);
                    console.log(`📅 Período seleccionado: ${period.name}`);
                  }
                }}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{period.name}</span>
                        {period.isCurrent && (
                          <Badge variant="outline" className="ml-2 text-xs">Actual</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: "12px" }}>
        {/* Ingreso por Productos */}
        <ExpandableCard
          title="Ingreso por Productos"
          value={`$${formatCurrency(quickStats.productRevenue)}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('productRevenue', quickStats)}
        />

        {/* Movimientos Monetarios */}
        <ExpandableCard
          title="Movimientos Monetarios"
          value={`$${formatCurrency(quickStats.monetaryMovements)}`}
          icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('monetaryMovements', quickStats)}
        />

        {/* Costos Fijos */}
        <ExpandableCard
          title="Costos Fijos"
          value={`$${formatCurrency(quickStats.fixedCosts)}`}
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('fixedCosts', quickStats)}
        />

        {/* Extracción de Sueldos */}
        <ExpandableCard
          title="Extracción de Sueldos"
          value={`$${formatCurrency(quickStats.salaryWithdrawals)}`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('salaryWithdrawals', quickStats)}
        />

        {/* Costos de Pedidos */}
        <ExpandableCard
          title="Costos de Pedidos"
          value={`$${formatCurrency(quickStats.orderCosts)}`}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('orderCosts', quickStats)}
        />

        {/* Costos Totales */}
        <ExpandableCard
          title="Costos Totales"
          value={`$${formatCurrency(quickStats.totalCosts)}`}
          icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('totalCosts', quickStats)}
        />

        {/* Ingresos Totales */}
        <ExpandableCard
          title="Ingresos Totales"
          value={`$${formatCurrency(quickStats.totalRevenue)}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('totalRevenue', quickStats)}
        />

        {/* Ganancia */}
        <ExpandableCard
          title="Ganancia"
          value={`$${formatCurrency(quickStats.profit)}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('profit', quickStats)}
        />

        {/* Patrimonio Total */}
        <ExpandableCard
          title="Patrimonio Total"
          value={`$${formatCurrency(quickStats.totalPatrimony)}`}
          icon={<PiggyBank className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('totalPatrimony', quickStats)}
        />

        {/* Items Vendidos */}
        <ExpandableCard
          title="Items Vendidos"
          value={`${quickStats.itemsSold} items`}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('itemsSold', quickStats)}
        />

        {/* Tasa de Conversión */}
        <ExpandableCard
          title="Tasa de Conversión"
          value={`${quickStats.conversionRate}%`}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('conversionRate', quickStats)}
        />

        {/* Capital Disponible */}
        <ExpandableCard
          title="Capital Disponible"
          value={`$${formatCurrency(quickStats.availableCapital)}`}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
          breakdown={getBreakdownDetails('availableCapital', quickStats)}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ventas</CardTitle>
            <CardDescription>Evolución de ventas en los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#8884d8" 
                  strokeWidth={3} 
                  name="Ventas ($)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card style={{ marginTop: "12px", marginBottom: "12px" }}>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                      {activity.type === 'sale' && <DollarSign className="h-5 w-5 text-green-600" />}
                      {activity.type === 'update' && <Settings className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'user' && <Users className="h-5 w-5 text-purple-600" />}
                      {activity.type === 'order' && <Package className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">hace {activity.time}</p>
                    </div>
                    {activity.amount && (
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {activity.amount}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Quick Access Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
          <CardDescription>Gestión de diferentes secciones del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Link 
                  key={card.href} 
                  href={card.href}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${card.color}`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full bg-background/50 ${card.iconColor}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{card.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginTop: "12px" }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Servidor</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Base de Datos</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Conectada</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backup</span>
                <Badge variant="outline" className="text-blue-600 border-blue-600">Actualizado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Próximas Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Actualizar inventario</span>
                <Badge variant="outline" className="text-orange-600 border-orange-600">Hoy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Revisar pedidos</span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Mañana</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Reporte mensual</span>
                <Badge variant="outline" className="text-gray-600 border-gray-600">En 3 días</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Resumen Rápido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Productos activos</span>
                <span className="font-semibold">87</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Categorías</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Imágenes carrusel</span>
                <span className="font-semibold">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
