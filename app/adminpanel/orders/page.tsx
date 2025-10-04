"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/products";
import type { OrderWithItems, OrderStatus, Product } from "@/types/database";
import { Edit, Trash2, Check, X, Plus, Minus, Package, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductWithStock extends Product {
  stock_quantity: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    status: "pending" as OrderStatus
  });

  // Analytics state
  const [lowStockProducts, setLowStockProducts] = useState<ProductWithStock[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderWithItems[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderWithItems[]>([]);
  const [totalUnsatisfiedDemand, setTotalUnsatisfiedDemand] = useState(0);
  const [weeklySales, setWeeklySales] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (orders.length > 0 && products.length > 0) {
      updateAnalytics(orders, products);
    }
  }, [orders, products]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        api.orders.getAll(),
        api.products.getAll()
      ]);
      
      if (ordersResponse.data) {
        setOrders(ordersResponse.data);
      }
      if (productsResponse.data) {
        setProducts(productsResponse.data);
      }

      // Update analytics after data is loaded
      if (ordersResponse.data && productsResponse.data) {
        updateAnalytics(ordersResponse.data, productsResponse.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = (ordersData: OrderWithItems[], productsData: Product[]) => {
    // Calculate analytics with the loaded data
    const lowStock = productsData.filter(product => {
      // Mock stock calculation - in real app would join with inventory
      const mockStock = Math.floor(Math.random() * 20) + 1;
      return mockStock <= 10 && product.is_active;
    }).slice(0, 5);
    setLowStockProducts(lowStock.map(product => ({ ...product, stock_quantity: Math.floor(Math.random() * 10) + 1 })));

    const pending = ordersData.filter(order => order.status === 'pending' || order.status === 'confirmed');
    setPendingOrders(pending);

    const completed = ordersData.filter(order => order.status === 'delivered');
    setCompletedOrders(completed);

    const unsatisfiedDemand = pending.reduce((total, order) => total + order.total_amount, 0);
    setTotalUnsatisfiedDemand(unsatisfiedDemand);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklySalesAmount = completed
      .filter(order => new Date(order.created_at) >= oneWeekAgo)
      .reduce((total, order) => total + order.total_amount, 0);
    setWeeklySales(weeklySalesAmount);
  };

  const handleEditOrder = (order: OrderWithItems) => {
    setEditingOrder(order.id);
    setEditForm({
      customer_name: order.customer_name,
      status: order.status || "pending"
    });
    setEditingItems([...order.items]);
  };

  const handleSaveEdit = async (orderId: string) => {
    try {
      // Update order status
      await api.orders.updateStatus(orderId, editForm.status);
      
      // Note: In a real implementation, you would also update the order items
      // For now, we'll just update locally and reload
      setEditingOrder(null);
      setEditingItems([]);
      loadData();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditingItems([]);
    setEditForm({ customer_name: "", status: "pending" });
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta orden?")) {
      try {
        await api.orders.delete(orderId);
        loadData(); // Reload orders after deletion
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleItemQuantityChange = (itemIndex: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...editingItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: newQuantity,
      subtotal: updatedItems[itemIndex].product_price * newQuantity
    };
    setEditingItems(updatedItems);
  };

  const handleRemoveItem = (itemIndex: number) => {
    if (editingItems.length <= 1) {
      alert("Una orden debe tener al menos un producto");
      return;
    }
    const updatedItems = editingItems.filter((_, index) => index !== itemIndex);
    setEditingItems(updatedItems);
  };

  const calculateOrderTotal = (items: any[]) => {
    return items.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
      preparing: { label: "Preparando", color: "bg-purple-100 text-purple-800" },
      ready: { label: "Listo", color: "bg-green-100 text-green-800" },
      delivered: { label: "Entregado", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Real data calculations
  const getLowStockProducts = () => {
    // Simulate low stock products - in real app this would check inventory
    return products.filter(product => product.is_active).slice(0, 3);
  };

  const getPendingOrders = () => {
    return orders.filter(order => order.status === 'pending' || order.status === 'confirmed');
  };

  const getCompletedOrders = () => {
    return orders.filter(order => order.status === 'delivered');
  };

  const getTotalUnsatisfiedDemand = () => {
    return getPendingOrders().reduce((total, order) => total + order.total_amount, 0);
  };

  const getWeeklySales = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return getCompletedOrders()
      .filter(order => new Date(order.created_at) >= oneWeekAgo)
      .reduce((total, order) => total + order.total_amount, 0);
  };

  const getRecentActivity = () => {
    return orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "hace menos de 1 hora";
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    if (diffInHours < 48) return "ayer";
    return `hace ${Math.floor(diffInHours / 24)} días`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cargando órdenes...</h1>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Actualizar
        </button>
      </div>

      {/* Dashboard Analytics Sections */}
      <div className="space-y-6 mb-8">
        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerta de Stock */}
          <Card className="border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Package className="h-5 w-5" />
                Alerta de Stock
              </CardTitle>
              <CardDescription className="text-orange-600">
                Productos con 5 o menos unidades en total
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <div 
                      key={product.id}
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        product.stock_quantity <= 5 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div>
                        <p className={`font-medium ${
                          product.stock_quantity <= 5 ? 'text-red-900' : 'text-yellow-900'
                        }`}>
                          {product.name}
                        </p>
                        <p className={`text-sm ${
                          product.stock_quantity <= 5 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          Stock: {product.stock_quantity} unidades
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          product.stock_quantity <= 5 
                            ? 'text-red-600 border-red-600' 
                            : 'text-yellow-600 border-yellow-600'
                        }
                      >
                        {product.stock_quantity <= 5 ? 'Crítico' : 'Bajo'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay productos con stock bajo</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/products" className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                  Ver todos los productos →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Demanda No Satisfecha */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <TrendingDown className="h-5 w-5" />
                Demanda No Satisfecha
              </CardTitle>
              <CardDescription className="text-red-600">
                Productos pedidos por clientes que aún no se han convertido en ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pendingOrders.length > 0 ? (
                  pendingOrders.slice(0, 3).map((order) => (
                    <div 
                      key={order.id}
                      className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-red-900">{order.customer_name}</p>
                        <p className="text-sm text-red-600">
                          Pedido hace {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))} días
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-900">${order.total_amount.toFixed(2)}</p>
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          {order.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay demanda pendiente</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-800">Total No Satisfecho:</span>
                  <span className="text-lg font-bold text-red-900">${totalUnsatisfiedDemand.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demanda Satisfecha */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Demanda Satisfecha (Ventas Concretadas)
              </CardTitle>
              <CardDescription className="text-green-600">
                Historial de todas las ventas completadas exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {completedOrders.length > 0 ? (
                  completedOrders.slice(0, 3).map((order) => (
                    <div 
                      key={order.id}
                      className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <p className="font-medium text-green-900">{order.customer_name}</p>
                        <p className="text-sm text-green-600">
                          Vendido hace {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))} días
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-900">${order.total_amount.toFixed(2)}</p>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Completado
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay ventas completadas</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Ventas esta semana:</span>
                  <span className="text-lg font-bold text-green-900">${weeklySales.toFixed(2)}</span>
                </div>
                <Link href="/admin/finances" className="text-sm text-green-600 hover:text-green-800 font-medium mt-2 block">
                  Ver reporte completo →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Pedidos */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <BarChart3 className="h-5 w-5" />
                Historial de Pedidos de Clientes
              </CardTitle>
              <CardDescription className="text-blue-600">
                Todos los productos que los clientes han añadido al carrito, independientemente de si la venta se completó
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {orders.length > 0 ? (
                  orders
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 4)
                    .map((order) => (
                      <div 
                        key={order.id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          order.status === 'delivered' 
                            ? 'bg-green-50 border-green-200' 
                            : order.status === 'pending' 
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${
                            order.status === 'delivered' 
                              ? 'text-green-900' 
                              : order.status === 'pending' 
                              ? 'text-blue-900'
                              : 'text-yellow-900'
                          }`}>
                            {order.customer_name}
                          </p>
                          <p className={`text-sm ${
                            order.status === 'delivered' 
                              ? 'text-green-600' 
                              : order.status === 'pending' 
                              ? 'text-blue-600'
                              : 'text-yellow-600'
                          }`}>
                            Pedido hace {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))} días
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            order.status === 'delivered' 
                              ? 'text-green-900' 
                              : order.status === 'pending' 
                              ? 'text-blue-900'
                              : 'text-yellow-900'
                          }`}>
                            ${order.total_amount.toFixed(2)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={
                              order.status === 'delivered' 
                                ? 'text-green-600 border-green-600' 
                                : order.status === 'pending' 
                                ? 'text-blue-600 border-blue-600'
                                : 'text-yellow-600 border-yellow-600'
                            }
                          >
                            {order.status === 'delivered' ? 'Entregado' : 
                             order.status === 'pending' ? 'Pendiente' : 
                             order.status === 'confirmed' ? 'Confirmado' : 
                             order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay historial de pedidos</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Total de órdenes:</span>
                  <span className="text-lg font-bold text-blue-900">{orders.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Órdenes</h2>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-2">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay órdenes</h3>
            <p className="text-gray-500">No se han creado órdenes aún.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {editingOrder === order.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.customer_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                        className="text-lg font-semibold text-gray-900 bg-gray-50 border rounded px-2 py-1 w-full"
                      />
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                        className="text-sm bg-gray-50 border rounded px-2 py-1"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">Preparando</option>
                        <option value="ready">Listo</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Orden #{order.id.slice(-8)}
                      </h3>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                        {getStatusBadge(order.status || 'pending')}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingOrder === order.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(order.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Guardar cambios"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar orden"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar orden"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">
                      ${editingOrder === order.id ? calculateOrderTotal(editingItems) : order.total_amount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {(editingOrder === order.id ? editingItems : order.items).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      {editingOrder === order.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-600">Cantidad:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleItemQuantityChange(index, item.quantity - 1)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 py-1 bg-white border rounded text-sm font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleItemQuantityChange(index, item.quantity + 1)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.product_price}</p>
                      <p className="text-xs text-gray-500">Subtotal: ${item.subtotal}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mostrar detalles del pedido (método de pago y entrega) */}
              {order.notes && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Detalles del Pedido</h4>
                  <div className="space-y-2">
                    {order.notes.split('.').filter(detail => detail.trim()).map((detail, idx) => {
                      const trimmedDetail = detail.trim();
                      if (trimmedDetail.includes('Método de pago:')) {
                        const paymentMethod = trimmedDetail.replace('Método de pago:', '').trim();
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-blue-600">💳</span>
                            <span className="text-sm text-blue-800">
                              <strong>Pago:</strong> <span className="bg-blue-100 px-2 py-1 rounded-full text-xs">{paymentMethod}</span>
                            </span>
                          </div>
                        );
                      }
                      if (trimmedDetail.includes('Entrega:')) {
                        const deliveryMethod = trimmedDetail.replace('Entrega:', '').trim();
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-blue-600">🚚</span>
                            <span className="text-sm text-blue-800">
                              <strong>Entrega:</strong> <span className="bg-indigo-100 px-2 py-1 rounded-full text-xs">{deliveryMethod}</span>
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
