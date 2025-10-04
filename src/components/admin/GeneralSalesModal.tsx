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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import type { Product, OrderStatus } from '@/types/database';
import { ShoppingCart, Plus, Minus, User } from 'lucide-react';

interface GeneralSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleRegistered?: () => void;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface GeneralSaleFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: OrderStatus;
  payment_method: string;
  notes: string;
  items: SaleItem[];
}

export default function GeneralSalesModal({
  isOpen,
  onClose,
  onSaleRegistered
}: GeneralSalesModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<GeneralSaleFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    status: 'confirmed' as OrderStatus,
    payment_method: 'cash',
    notes: '',
    items: []
  });

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      const response = await api.products.getAll();
      if (response.success && response.data) {
        setProducts(response.data.filter(p => p.is_active));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: '',
        product_name: '',
        quantity: 1,
        unit_price: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Si se selecciona un producto, actualizar el nombre y precio
          if (field === 'product_id') {
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
              updatedItem.product_name = selectedProduct.name;
              updatedItem.unit_price = selectedProduct.price || 0;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_name.trim()) {
      toast.error('El nombre del cliente es requerido');
      return;
    }
    
    if (!formData.customer_phone.trim()) {
      toast.error('El teléfono del cliente es requerido');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Debe agregar al menos un producto a la venta');
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product_id) {
        toast.error(`Debe seleccionar un producto para el ítem ${i + 1}`);
        return;
      }
      if (item.quantity <= 0) {
        toast.error(`La cantidad debe ser mayor a 0 para el ítem ${i + 1}`);
        return;
      }
      if (item.unit_price <= 0) {
        toast.error(`El precio debe ser mayor a 0 para el ítem ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        status: formData.status,
        total_amount: totalAmount,
        notes: formData.notes || undefined
      };

      const orderItems = formData.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.quantity * item.unit_price
      }));

      const response = await api.orders.create(orderData, orderItems);
      
      if (response.success) {
        // Guardar información adicional en localStorage para el historial
        const existingSales = JSON.parse(localStorage.getItem('generalSales') || '[]');
        const newSale = {
          id: response.data?.id || Date.now().toString(),
          ...orderData,
          payment_method: formData.payment_method,
          items: orderItems,
          created_at: new Date().toISOString()
        };
        existingSales.unshift(newSale);
        localStorage.setItem('generalSales', JSON.stringify(existingSales));
        
        toast.success('Venta registrada exitosamente');
        onSaleRegistered?.();
        handleClose();
      } else {
        toast.error(response.error || 'Error al registrar la venta');
      }
    } catch (error) {
      console.error('Error registering sale:', error);
      toast.error('Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      status: 'confirmed' as OrderStatus,
      payment_method: 'cash',
      notes: '',
      items: []
    });
    onClose();
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Registrar Venta General
          </DialogTitle>
          <DialogDescription>
            Registre una venta completa con múltiples productos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Información del Cliente
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Nombre del Cliente *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Teléfono *</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="7000-0000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_email">Email (Opcional)</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="mixed">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado de la Venta</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: OrderStatus) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="delivered">Entregada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
          </div>

          {/* Productos de la Venta */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Productos de la Venta</h3>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Label>Producto</Label>
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
                            {product.name} - ${product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="col-span-3">
                    <Label>Precio Unitario</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Subtotal</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Haga clic en "Agregar Producto" para comenzar</p>
                </div>
              )}
            </div>

            {formData.items.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border">
                <span className="font-medium">Total de la Venta:</span>
                <span className="text-xl font-bold text-green-700">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
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
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Registrando...' : 'Registrar Venta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}