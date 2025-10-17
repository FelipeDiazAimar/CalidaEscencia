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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import { productAttributesApi } from '@/lib/api/productAttributes';
import { stockOrdersApi, StockOrderInsert, StockOrderItemInsert } from '@/lib/api/stockOrders';
import type { Product, Category, ProductAttribute } from '@/types/database';
import { Package, Search, ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';

interface StockOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderRegistered?: () => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  attribute_id?: string;
  attribute_name?: string;
  attribute_value?: string;
}

interface GroupedProducts {
  [categoryName: string]: Product[];
}

export default function StockOrderModal({
  isOpen,
  onClose,
  onOrderRegistered
}: StockOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    groupProductsByCategory();
  }, [products, categories]);

  const loadData = async () => {
    try {
      const [productsResponse, categoriesResponse, attributesResponse] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
        productAttributesApi.getAll()
      ]);
      
      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      }
      
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (attributesResponse.success && attributesResponse.data) {
        setAttributes(attributesResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const groupProductsByCategory = () => {
    const grouped: GroupedProducts = {};
    
    categories.forEach(category => {
      const categoryProducts = products.filter(product => product.category_id === category.id);
      if (categoryProducts.length > 0) {
        grouped[category.name] = categoryProducts;
      }
    });
    
    // Productos sin categoría
    const uncategorizedProducts = products.filter(product => 
      !categories.some(cat => cat.id === product.category_id)
    );
    if (uncategorizedProducts.length > 0) {
      grouped['Sin Categoría'] = uncategorizedProducts;
    }
    
    setGroupedProducts(grouped);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleProduct = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const updateQuantity = (productId: string, productName: string, quantity: number, attributeId?: string, attributeName?: string, attributeValue?: string) => {
    setItems(prev => {
      const existing = prev.find(item => 
        item.product_id === productId && 
        item.attribute_id === attributeId
      );
      if (existing) {
        if (quantity <= 0) {
          // Remover item si cantidad es 0
          return prev.filter(item => 
            !(item.product_id === productId && item.attribute_id === attributeId)
          );
        } else {
          // Actualizar cantidad
          return prev.map(item => 
            (item.product_id === productId && item.attribute_id === attributeId)
              ? { ...item, quantity }
              : item
          );
        }
      } else if (quantity > 0) {
        // Agregar nuevo item
        return [...prev, { 
          product_id: productId, 
          product_name: productName, 
          quantity,
          attribute_id: attributeId,
          attribute_name: attributeName,
          attribute_value: attributeValue
        }];
      }
      return prev;
    });
  };

  const getProductQuantity = (productId: string, attributeId?: string) => {
    const item = items.find(item => 
      item.product_id === productId && 
      item.attribute_id === attributeId
    );
    return item ? item.quantity : 0;
  };

  const filteredGroupedProducts = () => {
    if (!searchTerm) return groupedProducts;
    
    const filtered: GroupedProducts = {};
    Object.entries(groupedProducts).forEach(([categoryName, categoryProducts]) => {
      const filteredProducts = categoryProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredProducts.length > 0) {
        filtered[categoryName] = filteredProducts;
      }
    });
    return filtered;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Debe agregar al menos un producto al pedido');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos del pedido
      const orderData: StockOrderInsert = {
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending', // Cambiado: Crear como pendiente para poder confirmar después
        notes: 'Pedido de reposición de stock'
      };

      // Preparar items del pedido
      const orderItems: Omit<StockOrderItemInsert, 'stock_order_id'>[] = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        attribute_id: item.attribute_id || null,
        attribute_name: item.attribute_name || null,
        attribute_value: item.attribute_value || null
      }));

      // Crear el pedido usando la nueva API
      const result = await stockOrdersApi.create(orderData, orderItems);

      if (result.success) {
        console.log('✅ Pedido de stock creado exitosamente:', result.data);
        toast.success('Pedido de stock registrado exitosamente. Ve a Finanzas > Análisis de Pedidos para marcarlo como recibido.');
        onOrderRegistered?.();
        handleClose();
      } else {
        console.error('❌ Error creando pedido de stock:', result.error);
        toast.error('Error al registrar el pedido de stock: ' + result.error);
      }

    } catch (error) {
      console.error('Error registering stock order:', error);
      toast.error('Error al registrar el pedido de stock: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setItems([]);
    setSearchTerm('');
    setExpandedCategories(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Registrar Pedido de Stock
          </DialogTitle>
          <DialogDescription>
            Registre un pedido a proveedores para reponer el inventario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buscador */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Productos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos por nombre..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Productos por Categoría */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Productos Disponibles</h3>
            
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {Object.entries(filteredGroupedProducts()).map(([categoryName, categoryProducts]) => (
                <Collapsible
                  key={categoryName}
                  open={expandedCategories.has(categoryName)}
                  onOpenChange={() => toggleCategory(categoryName)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(categoryName) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{categoryName}</span>
                      <span className="text-sm text-gray-500">({categoryProducts.length} productos)</span>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="space-y-2 p-2">
                      {categoryProducts.map((product) => {
                        const hasAttributes = product.attribute_ids && product.attribute_ids.length > 0;
                        const productAttributes = attributes.filter(attr => 
                          product.attribute_ids?.includes(attr.id)
                        );

                        if (hasAttributes) {
                          // Producto con atributos - mostrar colapsable
                          return (
                            <Collapsible
                              key={product.id}
                              open={expandedProducts.has(product.id)}
                              onOpenChange={() => toggleProduct(product.id)}
                            >
                              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded border">
                                <div className="flex items-center gap-2">
                                  {expandedProducts.has(product.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <div className="text-left">
                                    <span className="text-sm font-medium">{product.name}</span>
                                    <div className="text-xs text-gray-500">
                                      Stock actual: {product.stock || 0} | {productAttributes.length} atributos
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent className="ml-6 mt-2 space-y-2">
                                {productAttributes.map((attribute) => (
                                  <div key={attribute.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex-1">
                                      <span className="text-sm">{attribute.name}: {attribute.value}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(
                                          product.id, 
                                          product.name, 
                                          getProductQuantity(product.id, attribute.id) - 1,
                                          attribute.id,
                                          attribute.name,
                                          attribute.value
                                        )}
                                        disabled={getProductQuantity(product.id, attribute.id) === 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      
                                      <Input
                                        type="number"
                                        min="0"
                                        value={getProductQuantity(product.id, attribute.id)}
                                        onChange={(e) => updateQuantity(
                                          product.id, 
                                          product.name, 
                                          parseInt(e.target.value) || 0,
                                          attribute.id,
                                          attribute.name,
                                          attribute.value
                                        )}
                                        className="w-16 h-8 text-center"
                                      />
                                      
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(
                                          product.id, 
                                          product.name, 
                                          getProductQuantity(product.id, attribute.id) + 1,
                                          attribute.id,
                                          attribute.name,
                                          attribute.value
                                        )}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        } else {
                          // Producto sin atributos - comportamiento original
                          return (
                            <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="text-sm font-medium">{product.name}</span>
                                <div className="text-xs text-gray-500">
                                  Stock actual: {product.stock || 0}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, product.name, getProductQuantity(product.id) - 1)}
                                  disabled={getProductQuantity(product.id) === 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <Input
                                  type="number"
                                  min="0"
                                  value={getProductQuantity(product.id)}
                                  onChange={(e) => updateQuantity(product.id, product.name, parseInt(e.target.value) || 0)}
                                  className="w-16 h-8 text-center"
                                />
                                
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, product.name, getProductQuantity(product.id) + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              
              {Object.keys(filteredGroupedProducts()).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen del Pedido */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Resumen del Pedido</h3>
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={`${item.product_id}-${item.attribute_id || 'no-attribute'}`} className="flex justify-between items-center">
                      <span className="text-sm">
                        {item.product_name}
                        {item.attribute_name && item.attribute_value && (
                          <span className="text-gray-600 ml-2">
                            ({item.attribute_name}: {item.attribute_value})
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-medium">Cantidad: {item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total de productos:</span>
                    <span className="font-bold text-blue-700">
                      {items.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Registrando...' : 'Registrar Pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}