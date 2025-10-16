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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { productApi } from '@/lib/api';
import { productAttributesApi } from '@/lib/api/productAttributes';
import type { Product, Category, Subcategory, ProductAttribute } from '@/types/database';
import { ShoppingCart, Filter, Package, CheckCircle } from 'lucide-react';

interface ProductSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleRegistered?: () => void;
  preselectedProduct?: Product | null;
  preselectedAttribute?: string;
}

interface SaleFormData {
  selectedCategory: string;
  selectedName: string;
  selectedSubcategory: string;
  selectedProduct: Product | null;
  selectedAttribute: string;
  quantity: number;
}

const ALL_CATEGORIES = '__all_categories__';
const ALL_NAMES = '__all_names__';
const ALL_SUBCATEGORIES = '__all_subcategories__';

export default function ProductSalesModal({
  isOpen,
  onClose,
  onSaleRegistered,
  preselectedProduct,
  preselectedAttribute
}: ProductSalesModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: filters, 2: product selection, 3: quantity
  
  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [productNames, setProductNames] = useState<string[]>([]);
  const [filteredProductNames, setFilteredProductNames] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [filteredAttributes, setFilteredAttributes] = useState<ProductAttribute[]>([]);
  
  const [formData, setFormData] = useState<SaleFormData>({
    selectedCategory: '',
    selectedName: '',
    selectedSubcategory: '',
    selectedProduct: null,
    selectedAttribute: 'none',
    quantity: 1
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      resetForm();
    }
  }, [isOpen]);

  // Handle preselected product
  useEffect(() => {
    if (preselectedProduct && allProducts.length > 0) {
      // Check if the preselected product has attributes
      const hasAttributes = preselectedProduct.attribute_ids && preselectedProduct.attribute_ids.length > 0;

      setFormData(prev => ({
        ...prev,
        selectedCategory: preselectedProduct.category_id || ALL_CATEGORIES,
        selectedSubcategory: preselectedProduct.subcategory_id || ALL_SUBCATEGORIES,
        selectedProduct: preselectedProduct,
        selectedAttribute: preselectedAttribute || 'none' // Use preselected attribute if provided
      }));

      // Filter attributes for the preselected product
      if (hasAttributes && preselectedProduct.attribute_ids) {
        const productAttrs = productAttributes.filter(attr =>
          preselectedProduct.attribute_ids!.includes(attr.id) && attr.is_active
        );
        setFilteredAttributes(productAttrs);
      }

      // If preselected attribute is provided, skip to quantity step
      // If no preselected attribute but product has attributes, go to attribute selection step
      // If no attributes, skip to quantity step
      if (preselectedAttribute) {
        setStep(3); // Skip to quantity step
      } else if (hasAttributes) {
        setStep(2); // Go to attribute selection step
      } else {
        setStep(3); // Skip to quantity step
      }
    }
  }, [preselectedProduct, preselectedAttribute, allProducts, productAttributes]);

  useEffect(() => {
    if (allProducts.length > 0) {
      filterProducts();
      filterSubcategories();
      filterProductNames();
    }
    if (productAttributes.length > 0) {
      filterAttributes();
    }
  }, [formData.selectedCategory, formData.selectedName, formData.selectedSubcategory, allProducts, productAttributes]);

  const resetForm = () => {
    // Only reset if there's no preselected product
    if (!preselectedProduct) {
      setFormData({
        selectedCategory: ALL_CATEGORIES,
        selectedName: ALL_NAMES,
        selectedSubcategory: ALL_SUBCATEGORIES,
        selectedProduct: null,
        selectedAttribute: 'none',
        quantity: 1
      });
      setStep(1);
    } else {
      // Reset only quantity for preselected product, keep attribute selection
      setFormData(prev => ({
        ...prev,
        quantity: 1,
        selectedAttribute: preselectedAttribute || 'none'
      }));
      setStep(3);
    }
  };

  const loadInitialData = async () => {
    try {
      const [categoriesRes, subcategoriesRes, productsRes, attributesRes] = await Promise.all([
        productApi.categories.getAll(),
        productApi.subcategories.getAll(),
        productApi.products.getAll(),
        productAttributesApi.getAll()
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (subcategoriesRes.success && subcategoriesRes.data) {
        setSubcategories(subcategoriesRes.data);
        setFilteredSubcategories(subcategoriesRes.data); // Initialize filtered subcategories
      }
      if (productsRes.success && productsRes.data) {
        const products = productsRes.data.filter((p: any) => p.is_active);
        setAllProducts(products);
        
        // Extract unique product names
        const uniqueNames = Array.from(new Set(products.map((p: any) => p.name))).sort() as string[];
        setProductNames(uniqueNames);
        
        setFilteredProducts(products);
      }
      if (attributesRes.success && attributesRes.data) {
        setProductAttributes(attributesRes.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const filterProducts = async () => {
    try {
      let filtered = [...allProducts];
      
      // Filtrar por categoría
      if (formData.selectedCategory && formData.selectedCategory !== ALL_CATEGORIES) {
        filtered = filtered.filter(p => p.category_id === formData.selectedCategory);
      }
      
      // Filtrar por subcategoría
      if (formData.selectedSubcategory && formData.selectedSubcategory !== ALL_SUBCATEGORIES) {
        filtered = filtered.filter(p => p.subcategory_id === formData.selectedSubcategory);
      }
      
      // Filtrar por nombre
      if (formData.selectedName && formData.selectedName !== ALL_NAMES) {
        filtered = filtered.filter(p => p.name === formData.selectedName);
      }
      
      // Si hay un atributo seleccionado (que no sea 'none'), filtrar productos que tengan ese atributo
      // Nota: Esta lógica puede necesitar ajuste dependiendo de cómo se relacionen productos y atributos en la BD
      if (formData.selectedAttribute && formData.selectedAttribute !== 'none') {
        // Por ahora, solo filtramos por subcategoría si hay atributo seleccionado
        // La lógica específica dependerá de la estructura de la base de datos
        filtered = filtered.filter(p => p.subcategory_id === formData.selectedSubcategory);
      }
      
      setFilteredProducts(filtered);
      
      // Actualizar nombres disponibles según los filtros aplicados
      const availableNames = Array.from(new Set(filtered.map((p: any) => p.name))).sort() as string[];
      setFilteredProductNames(availableNames);
      
    } catch (error) {
      console.error('Error filtering products:', error);
    }
  };

  const filterSubcategories = () => {
    if (formData.selectedCategory && formData.selectedCategory !== ALL_CATEGORIES) {
      // Filtrar subcategorías que pertenecen a la categoría seleccionada
      const categorySubcategories = subcategories.filter(sub => 
        allProducts.some(product => 
          product.category_id === formData.selectedCategory && 
          product.subcategory_id === sub.id
        )
      );
      setFilteredSubcategories(categorySubcategories);
    } else {
      // Mostrar todas las subcategorías si no hay categoría seleccionada
      setFilteredSubcategories(subcategories);
    }
  };

  const filterProductNames = () => {
    let filtered = [...allProducts];
    
    // Aplicar filtro de categoría
    if (formData.selectedCategory && formData.selectedCategory !== ALL_CATEGORIES) {
      filtered = filtered.filter(p => p.category_id === formData.selectedCategory);
    }
    
    // Aplicar filtro de subcategoría
    if (formData.selectedSubcategory && formData.selectedSubcategory !== ALL_SUBCATEGORIES) {
      filtered = filtered.filter(p => p.subcategory_id === formData.selectedSubcategory);
    }
    
    // Obtener nombres únicos de los productos filtrados
    const availableNames = Array.from(new Set(filtered.map((p: any) => p.name))).sort() as string[];
    setFilteredProductNames(availableNames);
  };

  const filterAttributes = () => {
    if (formData.selectedSubcategory && formData.selectedSubcategory !== ALL_SUBCATEGORIES) {
      // Filtrar atributos que pertenecen a la subcategoría seleccionada
      const subcategoryAttributes = productAttributes.filter(attr => 
        attr.subcategory_id === formData.selectedSubcategory && attr.is_active
      );
      setFilteredAttributes(subcategoryAttributes);
    } else {
      // Si no hay subcategoría seleccionada, no mostrar atributos
      setFilteredAttributes([]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (filteredProducts.length === 0) {
        toast.error('No hay productos que coincidan con los filtros seleccionados');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (preselectedProduct) {
        // For preselected product, check if attribute is selected when attributes exist
        if (filteredAttributes.length > 0 && (!formData.selectedAttribute || formData.selectedAttribute === 'none')) {
          toast.error('Debe seleccionar un atributo para este producto');
          return;
        }
      } else {
        // Original flow: check if product is selected
        if (!formData.selectedProduct) {
          toast.error('Debe seleccionar un producto');
          return;
        }
      }
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleProductSelect = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      selectedProduct: product
    }));

    // Filter attributes for the selected product
    if (product.attribute_ids && product.attribute_ids.length > 0) {
      const productAttrs = productAttributes.filter(attr =>
        product.attribute_ids!.includes(attr.id) && attr.is_active
      );
      setFilteredAttributes(productAttrs);
    } else {
      setFilteredAttributes([]);
    }
  };

  const updateProductStock = async () => {
    try {
      if (formData.selectedAttribute && formData.selectedAttribute !== 'none') {
        // Find the specific variant and update its stock
        const selectedAttr = filteredAttributes.find(attr => attr.id === formData.selectedAttribute);
        if (selectedAttr) {
          // Get all variants for this product
          const variantsResponse = await productApi.productVariantInventory.getByProduct(formData.selectedProduct!.id);
          
          if (variantsResponse.success && variantsResponse.data) {
            // Find the variant that matches the selected attribute
            const matchingVariant = variantsResponse.data.find(variant => {
              const variantData = variant.variant_data as any;
              return variantData && 
                     variantData[selectedAttr.name] && 
                     variantData[selectedAttr.name] === selectedAttr.value;
            });

            if (matchingVariant) {
              // Update the variant's stock
              const newQuantity = Math.max(0, matchingVariant.quantity - formData.quantity);
              await productApi.productVariantInventory.updateStock(matchingVariant.id, newQuantity);
            } else {
              console.warn('No matching variant found for selected attribute');
            }
          }
        }
      } else {
        // No attribute selected - this would update general product stock
        // For now, we'll skip this as the system focuses on variant-specific stock
        console.log('No attribute selected - skipping general stock update');
      }
    } catch (error) {
      console.error('Error updating product stock:', error);
      toast.error('Error al actualizar el stock del producto');
    }
  };

  const handleSubmit = async () => {
    if (!formData.selectedProduct) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      // Create the sale record
      const saleData = {
        product_id: formData.selectedProduct.id,
        quantity: formData.quantity,
        unit_price: formData.selectedProduct.price,
        total_price: formData.selectedProduct.price * formData.quantity,
        attribute_id: formData.selectedAttribute && formData.selectedAttribute !== 'none' ? formData.selectedAttribute : undefined, // Include selected attribute if any
      };

      const response = await productApi.productSales.create(saleData);
      
      if (response.success) {
        // Update stock for the specific variant or general product stock
        await updateProductStock();
        
        const attributeInfo = formData.selectedAttribute && formData.selectedAttribute !== 'none' ? 
          ` (${filteredAttributes.find(attr => attr.id === formData.selectedAttribute)?.name}: ${filteredAttributes.find(attr => attr.id === formData.selectedAttribute)?.value})` : '';
        toast.success(`Venta registrada: ${formData.quantity}x ${formData.selectedProduct.name}${attributeInfo} por $${saleData.total_price.toFixed(2)}`);
        onSaleRegistered?.();
        onClose();
        resetForm();
      } else {
        toast.error(`Error al registrar la venta: ${response.error}`);
      }
    } catch (error) {
      console.error('Error registering sale:', error);
      toast.error('Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || '';
  };

  const getNameName = (name: string) => {
    return name;
  };

  const getSubcategoryName = (id: string) => {
    return subcategories.find(s => s.id === id)?.name || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Registrar Venta de Producto
          </DialogTitle>
          <DialogDescription>
            {preselectedProduct && (
              <span className="text-blue-600 font-medium block mb-2">
                Producto preseleccionado: {preselectedProduct.name}
              </span>
            )}
            {step === 1 && 'Seleccione los filtros para encontrar el producto'}
            {step === 2 && (preselectedProduct ? 'Seleccione el atributo del producto' : 'Seleccione el producto específico de la lista')}
            {step === 3 && 'Ingrese la cantidad a vender'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>

          {/* Step 1: Filters */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.selectedCategory}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      selectedCategory: value,
                      selectedSubcategory: ALL_SUBCATEGORIES, // Reset subcategory when category changes
                      selectedName: ALL_NAMES // Reset name when category changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CATEGORIES}>Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory Filter */}
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategoría</Label>
                  <Select
                    value={formData.selectedSubcategory}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      selectedSubcategory: value,
                      selectedName: ALL_NAMES, // Reset name when subcategory changes
                      selectedAttribute: 'none' // Reset attribute when subcategory changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las subcategorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_SUBCATEGORIES}>Todas las subcategorías</SelectItem>
                      {(formData.selectedCategory !== ALL_CATEGORIES ? filteredSubcategories : subcategories).map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name Filter */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Select
                    value={formData.selectedName}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      selectedName: value,
                      selectedAttribute: 'none' // Reset attribute when name changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los nombres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_NAMES}>Todos los nombres</SelectItem>
                      {(filteredProductNames.length > 0 ? filteredProductNames : productNames).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attribute Filter - Only show if there are attributes for the selected subcategory */}
                {filteredAttributes.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="attribute">Atributo</Label>
                    <Select
                      value={formData.selectedAttribute}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, selectedAttribute: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar atributo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin atributo específico</SelectItem>
                        {filteredAttributes.map((attribute) => (
                          <SelectItem key={attribute.id} value={attribute.id}>
                            {attribute.name}: {attribute.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Productos encontrados: <span className="font-medium">{filteredProducts.length}</span>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Product Selection or Attribute Selection */}
          {step === 2 && (
            <div className="space-y-4">
              {preselectedProduct ? (
                /* Attribute Selection for Preselected Product */
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">Producto Seleccionado:</h3>
                      <p className="text-lg font-semibold">{preselectedProduct.name}</p>
                      <p className="text-muted-foreground">${preselectedProduct.price.toFixed(2)} por unidad</p>
                    </CardContent>
                  </Card>

                  {filteredAttributes.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Seleccione el atributo vendido:</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {filteredAttributes.map((attribute) => (
                          <Card
                            key={attribute.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              formData.selectedAttribute === attribute.id
                                ? 'border-2 border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, selectedAttribute: attribute.id }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{attribute.name}: {attribute.value}</h4>
                                  {formData.selectedAttribute === attribute.id && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Este producto no tiene atributos configurados.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Product Selection (Original Flow) */
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Filtros aplicados: {formData.selectedCategory && formData.selectedCategory !== ALL_CATEGORIES && `Categoría: ${getCategoryName(formData.selectedCategory)}`}
                    {formData.selectedName && formData.selectedName !== ALL_NAMES && `, Nombre: ${getNameName(formData.selectedName)}`}
                    {formData.selectedSubcategory && formData.selectedSubcategory !== ALL_SUBCATEGORIES && `, Subcategoría: ${getSubcategoryName(formData.selectedSubcategory)}`}
                    {formData.selectedAttribute && formData.selectedAttribute !== 'none' && `, Atributo: ${filteredAttributes.find(attr => attr.id === formData.selectedAttribute)?.name}: ${filteredAttributes.find(attr => attr.id === formData.selectedAttribute)?.value}`}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          formData.selectedProduct?.id === product.id
                            ? 'border-2 border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                            : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-medium ${
                                  formData.selectedProduct?.id === product.id 
                                    ? 'text-blue-800' 
                                    : 'text-gray-900'
                                }`}>
                                  {product.name}
                                </h3>
                                {formData.selectedProduct?.id === product.id && (
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              {product.description && (
                                <p className={`text-sm mt-1 ${
                                  formData.selectedProduct?.id === product.id 
                                    ? 'text-blue-600' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                formData.selectedProduct?.id === product.id 
                                  ? 'text-blue-700' 
                                  : 'text-gray-900'
                              }`}>
                                ${product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No se encontraron productos con los filtros seleccionados</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Quantity */}
          {step === 3 && formData.selectedProduct && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Producto Seleccionado:</h3>
                  <p className="text-lg font-semibold">{formData.selectedProduct.name}</p>
                  <p className="text-muted-foreground">${formData.selectedProduct.price.toFixed(2)} por unidad</p>
                  {formData.selectedAttribute && formData.selectedAttribute !== 'none' && (
                    <p className="text-sm text-blue-600 mt-1">
                      Atributo: {filteredAttributes.find(attr => attr.id === formData.selectedAttribute)?.name}: {filteredAttributes.find(attr => attr.id === formData.selectedAttribute)?.value}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full"
                />
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold">
                      ${(formData.selectedProduct.price * formData.quantity).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
              >
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            
            {step < 3 ? (
              <Button onClick={handleNextStep}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Venta'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}