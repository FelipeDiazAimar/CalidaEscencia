'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/products';
import { stockOrdersApi, type StockOrderWithDetails } from '@/lib/api/stockOrders';
import { salesApi } from '@/lib/api/finances';
import { History, Package, ShoppingCart, Plus, Eye, Calendar, User, Phone } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'products' | 'sales' | 'stock';
}

interface GeneralSale {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  payment_method: string;
  status: string;
  total_amount: number;
  items: any[];
  notes: string;
  created_at: string;
}

export default function HistoryModal({
  isOpen,
  onClose,
  defaultTab = 'products'
}: HistoryModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stockOrders, setStockOrders] = useState<StockOrderWithDetails[]>([]);
  const [generalSales, setGeneralSales] = useState<GeneralSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistoryData();
    }
  }, [isOpen]);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      // Cargar productos creados desde la API
      const productsResponse = await api.products.getAll();
      if (productsResponse.success && productsResponse.data) {
        console.log('📦 Productos cargados:', productsResponse.data.length);
        setOrders(productsResponse.data); // Reutilizamos orders para productos
      }

      // Cargar pedidos de stock desde la API
      const stockOrdersResponse = await stockOrdersApi.getAll();
      if (stockOrdersResponse.success && stockOrdersResponse.data) {
        console.log('📋 Stock orders cargados desde API:', stockOrdersResponse.data.length);
        setStockOrders(stockOrdersResponse.data);
      } else {
        // Fallback a localStorage si la API no está disponible
        const stockOrdersData = JSON.parse(localStorage.getItem('stockOrders') || '[]');
        console.log('📋 Stock orders cargados desde localStorage:', stockOrdersData.length);
        setStockOrders(stockOrdersData);
      }

      // Cargar ventas desde la API
      const salesResponse = await salesApi.getAll();
      if (salesResponse.success && salesResponse.data) {
        console.log('💰 Ventas cargadas desde API:', salesResponse.data.length);
        setGeneralSales(salesResponse.data);
      } else {
        // Fallback a localStorage si la API no está disponible
        const generalSalesData = JSON.parse(localStorage.getItem('generalSales') || '[]');
        console.log('💰 Ventas cargadas desde localStorage:', generalSalesData.length);
        setGeneralSales(generalSalesData);
      }

    } catch (error) {
      console.error('Error loading history data:', error);
      // Fallback a localStorage para datos si hay error en la API
      try {
        const stockOrdersData = JSON.parse(localStorage.getItem('stockOrders') || '[]');
        setStockOrders(stockOrdersData);
        
        const generalSalesData = JSON.parse(localStorage.getItem('generalSales') || '[]');
        setGeneralSales(generalSalesData);
      } catch (storageError) {
        console.error('Error loading from localStorage:', storageError);
        setStockOrders([]);
        setGeneralSales([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const showOrderDetails = (order: any, type: 'product' | 'stock' | 'sale') => {
    setSelectedOrder({ ...order, type });
    setDetailsOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Registros
            </DialogTitle>
            <DialogDescription>
              Consulte el historial de productos, ventas y pedidos de stock
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">
                <Plus className="h-4 w-4 mr-2" />
                Productos Creados
              </TabsTrigger>
              <TabsTrigger value="sales">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ventas Registradas
              </TabsTrigger>
              <TabsTrigger value="stock">
                <Package className="h-4 w-4 mr-2" />
                Pedidos de Stock
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Productos Creados</CardTitle>
                  <CardDescription>
                    Todos los productos que han sido creados en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Fecha Creación</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description || 'Sin descripción'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {product.category?.name || 'Sin categoría'}
                              </Badge>
                            </TableCell>
                            <TableCell>${product.price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>
                              <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                                {product.stock || 0} unidades
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(product.created_at)}</TableCell>
                            <TableCell>
                              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                {product.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {orders.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No hay productos registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Ventas Generales</CardTitle>
                  <CardDescription>
                    Todas las ventas registradas desde el panel general
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generalSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-sm">
                            #{(sale.id || '').slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.customer_name || 'Cliente anónimo'}</div>
                              <div className="text-sm text-gray-500">{sale.customer_phone || 'Sin teléfono'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {sale.payment_method === 'cash' ? 'Efectivo' : 
                               sale.payment_method === 'card' ? 'Tarjeta' :
                               sale.payment_method === 'transfer' ? 'Transferencia' : 'Mixto'}
                            </Badge>
                          </TableCell>
                          <TableCell>${(sale.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(sale.status || 'pending')}</TableCell>
                          <TableCell>{formatDate(sale.created_at)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showOrderDetails(sale, 'sale')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {generalSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No hay ventas registradas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pedidos de Stock</CardTitle>
                  <CardDescription>
                    Todos los pedidos de reposición de inventario realizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Total Costo</TableHead>
                        <TableHead>Ganancia Potencial</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            #{(order.id || '').slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                              <div className="text-xs text-gray-500">
                                {order.items.slice(0, 2).map(item => item.product_name).join(', ')}
                                {order.items.length > 2 && '...'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>${(order.total_cost || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className="text-green-600">
                              ${(order.total_potential_profit || 0).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status || 'pending')}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showOrderDetails(order, 'stock')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {stockOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No hay pedidos de stock registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del {
                selectedOrder?.type === 'product' ? 'Pedido' :
                selectedOrder?.type === 'sale' ? 'Venta' : 'Pedido de Stock'
              }
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Información General - Solo para ventas, no para stock */}
              {selectedOrder.type !== 'stock' && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Información del Cliente</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {selectedOrder.customer_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {selectedOrder.customer_phone}
                          </div>
                          {selectedOrder.customer_email && (
                            <div className="text-gray-600">{selectedOrder.customer_email}</div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Información del Pedido</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(selectedOrder.created_at)}
                          </div>
                          <div>Estado: {getStatusBadge(selectedOrder.status)}</div>
                          {selectedOrder.payment_method && (
                            <div>Pago: {selectedOrder.payment_method}</div>
                          )}
                          <div className="font-medium">
                            Total: ${(selectedOrder.total_amount || selectedOrder.total_cost || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Notas</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notas para pedidos de stock (si existen) */}
              {selectedOrder.type === 'stock' && selectedOrder.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-gray-700 mb-2">Notas</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedOrder.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-600">
                            Cantidad: {item.quantity} × ${(item.product_price || item.unit_price || item.unit_cost || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="font-medium">
                          ${(item.subtotal || (item.quantity * (item.product_price || item.unit_price || item.unit_cost || 0))).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}