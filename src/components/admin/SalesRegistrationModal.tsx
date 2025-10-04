'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import type { Product, OrderStatus } from '@/types/database';
import { ShoppingCart, User, Phone, Calculator } from 'lucide-react';

interface SalesRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: Product | null;
  onSaleRegistered?: () => void;
}

interface SaleFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  status: OrderStatus;
  notes: string;
}

export default function SalesRegistrationModal({
  isOpen,
  onClose,
  preselectedProduct,
  onSaleRegistered
}: SalesRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SaleFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_id: preselectedProduct?.id || '',
    quantity: 1,
    unit_price: preselectedProduct?.price || 0,
    status: 'confirmed' as OrderStatus,
    notes: ''
  });

  // Reset form when modal opens/closes or product changes
  useState(() => {
    if (preselectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: preselectedProduct.id,
        unit_price: preselectedProduct.price
      }));
    }
  });

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

    if (!formData.product_id) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (formData.unit_price <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      // Create order with the sale information
      const orderData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        status: formData.status,
        total_amount: formData.quantity * formData.unit_price,
        notes: formData.notes || undefined
      };

      const orderItems = [{
        product_id: formData.product_id,
        product_name: preselectedProduct?.name || 'Producto',
        product_price: formData.unit_price,
        quantity: formData.quantity,
        subtotal: formData.quantity * formData.unit_price
      }];

      const response = await api.orders.create(orderData, orderItems);
      
      if (response.success) {
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
      product_id: preselectedProduct?.id || '',
      quantity: 1,
      unit_price: preselectedProduct?.price || 0,
      status: 'confirmed' as OrderStatus,
      notes: ''
    });
    onClose();
  };

  const totalAmount = formData.quantity * formData.unit_price;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Registrar Venta
          </DialogTitle>
          <DialogDescription>
            Complete los datos del cliente y la venta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Información del Cliente
            </div>
            
            <div>
              <Label htmlFor="customer_name">Nombre del Cliente *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="customer_phone">Teléfono *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="7000-0000"
                  className="pl-10"
                  required
                />
              </div>
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
          </div>

          {/* Sale Information */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calculator className="h-4 w-4" />
              Información de la Venta
            </div>

            {preselectedProduct && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{preselectedProduct.name}</div>
                <div className="text-sm text-gray-600">
                  Precio unitario: ${preselectedProduct.price.toFixed(2)}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="unit_price">Precio Unitario *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

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
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre la venta"
              />
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border">
              <span className="font-medium">Total de la Venta:</span>
              <span className="text-xl font-bold text-green-700">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
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