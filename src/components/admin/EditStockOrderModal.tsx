'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import { stockOrdersApi } from '@/lib/api/stockOrders';
import type { Product, StockOrderWithDetails, StockOrderItem } from '@/lib/api';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

interface EditStockOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StockOrderWithDetails | null;
  onOrderUpdated?: () => void;
}

export default function EditStockOrderModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated
}: EditStockOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingItems, setEditingItems] = useState<StockOrderItem[]>([]);

  useEffect(() => {
    if (isOpen && order) {
      setEditingItems([...order.items]);
      loadProducts();
    }
  }, [isOpen, order]);

  const loadProducts = async () => {
    try {
      const response = await api.products.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addNewItem = () => {
    setEditingItems(prev => [...prev, {
      product_id: '',
      product_name: '',
      quantity: 1
    }]);
  };

  const removeItem = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StockOrderItem, value: any) => {
    setEditingItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Si se selecciona un producto, actualizar el nombre
        if (field === 'product_id') {
          const selectedProduct = products.find(p => p.id === value);
          if (selectedProduct) {
            updatedItem.product_name = selectedProduct.name;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const updateQuantity = (index: number, delta: number) => {
    setEditingItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!order) return;

    // Validación
    if (editingItems.length === 0) {
      toast.error('Debe tener al menos un producto en el pedido');
      return;
    }

    for (let i = 0; i < editingItems.length; i++) {
      const item = editingItems[i];
      if (!item.product_id) {
        toast.error(`Debe seleccionar un producto para el ítem ${i + 1}`);
        return;
      }
      if (item.quantity <= 0) {
        toast.error(`La cantidad debe ser mayor a 0 para el ítem ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await stockOrdersApi.update(order.id, editingItems as any);
      if (result.success) {
        toast.success('Pedido actualizado exitosamente');
        onOrderUpdated?.();
        onClose();
      } else {
        toast.error(result.error || 'Error al actualizar el pedido');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (order) {
      setEditingItems([...order.items]);
    }
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Editar Pedido #{order.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            Modifica los productos y cantidades del pedido. Solo se pueden editar pedidos pendientes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del pedido */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fecha del pedido:</span>
                <p>{new Date(order.order_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <p className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'received' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status === 'pending' ? 'Pendiente' :
                   order.status === 'received' ? 'Recibido' : 'Cancelado'}
                </p>
              </div>
            </div>
          </div>

          {/* Solo permitir edición si está pendiente */}
          {order.status !== 'pending' ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Este pedido no se puede editar porque ya fue {order.status === 'received' ? 'recibido' : 'cancelado'}.
                Solo se pueden editar pedidos pendientes.
              </p>
            </div>
          ) : (
            <>
              {/* Lista de productos en el pedido */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Productos del Pedido</h3>
                  <Button type="button" onClick={addNewItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editingItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, 'product_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(index, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {editingItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay productos en el pedido</p>
                    <p className="text-sm">Haga clic en "Agregar Producto" para comenzar</p>
                  </div>
                )}
              </div>

              {/* Resumen de cambios */}
              {editingItems.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <h4 className="font-medium text-blue-800 mb-2">Resumen del Pedido</h4>
                  <div className="space-y-1 text-sm">
                    {editingItems.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.product_name || 'Producto no seleccionado'}</span>
                        <span className="font-medium">Cantidad: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800">Total de productos:</span>
                      <span className="font-bold text-blue-700">
                        {editingItems.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          {order.status === 'pending' && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || editingItems.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}