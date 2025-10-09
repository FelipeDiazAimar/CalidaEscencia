'use client';

import { useState, useEffect, useMemo } from 'react';
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
  DialogDescription,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import ImagePreview from '@/components/ui/image-preview';
import ImageGalleryManager from '@/components/ui/image-gallery-manager';
import ImageUpload from '@/components/admin/ImageUpload';
import ImageGalleryUpload from '@/components/admin/ImageGalleryUpload';
import SalesRegistrationModal from '@/components/admin/SalesRegistrationModal';
import StockOrderModal from '@/components/admin/StockOrderModal';
import GeneralSalesModal from '@/components/admin/GeneralSalesModal';
import ProductSalesModal from '@/components/admin/ProductSalesModal';
import HistoryModal from '@/components/admin/HistoryModal';
import { Plus, Edit, Trash2, Package, Loader2, ShoppingBag, Star, Sparkles, History, TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import { tempImageStore } from '@/lib/temp-image-store';
import { TempImageUploader } from '@/lib/temp-image-uploader';

// Import API functions and types
import { api } from '@/lib/api/products';
import { productAttributesApi } from '@/lib/api/productAttributes';
import type { 
  Product,
  ProductInsert,
  Category,
  Subcategory,
  ProductAttribute
} from '@/types/database';

interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  subcategory_id: string;
  attribute_id: string;
  cost: string;
  price: string;
  stock: string;
  cover_image: string;
  hover_image: string;
  gallery_images: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
}

export default function AdminProductsPage() {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [filteredAttributes, setFilteredAttributes] = useState<ProductAttribute[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null);
  const [isStockOrderModalOpen, setIsStockOrderModalOpen] = useState(false);
  const [isGeneralSalesModalOpen, setIsGeneralSalesModalOpen] = useState(false);
  const [isProductSalesModalOpen, setIsProductSalesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDefaultTab, setHistoryDefaultTab] = useState<'products' | 'sales' | 'stock'>('products');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    attribute_id: '',
    cost: '',
    price: '',
    stock: '',
    cover_image: '',
    hover_image: '',
    gallery_images: [],
    is_active: true,
    is_featured: false,
    is_new: false
  });

  // Load initial data
  useEffect(() => {
    loadData();
    // Clean up any malformed temp IDs on component mount
    tempImageStore.cleanupMalformedIds();
  }, []);

  // Clean up malformed IDs in form data
  useEffect(() => {
    let needsUpdate = false;
    const cleanFormData = { ...formData };
    
    if (formData.cover_image?.startsWith('temp_temp_')) {
      cleanFormData.cover_image = formData.cover_image.replace('temp_temp_', '');
      needsUpdate = true;
      console.log('🧹 ProductsPage: cleaned up malformed cover_image ID');
    }
    
    if (formData.hover_image?.startsWith('temp_temp_')) {
      cleanFormData.hover_image = formData.hover_image.replace('temp_temp_', '');
      needsUpdate = true;
      console.log('🧹 ProductsPage: cleaned up malformed hover_image ID');
    }
    
    if (needsUpdate) {
      setFormData(cleanFormData);
    }
  }, [formData.cover_image, formData.hover_image]);

  // Filter subcategories when category changes
  useEffect(() => {
    // Reset subcategory if it doesn't belong to selected category
    if (selectedCategory !== 'all' && selectedSubcategory !== 'all') {
      const availableSubs = getAvailableSubcategories();
      const subcategoryExists = availableSubs.some(sub => sub.id === selectedSubcategory);
      if (!subcategoryExists) {
        setSelectedSubcategory('all');
      }
    }
  }, [selectedCategory, selectedSubcategory, subcategories]);

  // Filter subcategories for form when category changes
  useEffect(() => {
    if (formData.category_id) {
      const filtered = subcategories.filter(sub => sub.category_id === formData.category_id);
      setFilteredSubcategories(filtered);
      
      // Reset subcategory if it doesn't belong to selected category
      if (formData.subcategory_id && !filtered.some(sub => sub.id === formData.subcategory_id)) {
        setFormData(prev => ({ ...prev, subcategory_id: '' }));
      }
    } else {
      setFilteredSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [formData.category_id, subcategories]);

  // Filter attributes for form when subcategory changes
  useEffect(() => {
    if (formData.subcategory_id) {
      const filtered = productAttributes.filter(attr => attr.subcategory_id === formData.subcategory_id && attr.is_active);
      setFilteredAttributes(filtered);
      
      // Reset attribute if it doesn't belong to selected subcategory
      if (formData.attribute_id && !filtered.some(attr => attr.id === formData.attribute_id)) {
        setFormData(prev => ({ ...prev, attribute_id: '' }));
      }
    } else {
      setFilteredAttributes([]);
      setFormData(prev => ({ ...prev, attribute_id: '' }));
    }
  }, [formData.subcategory_id, productAttributes]);

  // Filtered products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(product => product.subcategory_id === selectedSubcategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedSubcategory, sortBy]);

  // Get available subcategories based on selected category
  const getAvailableSubcategories = () => {
    if (selectedCategory === 'all') {
      return subcategories;
    }
    return subcategories.filter(sub => sub.category_id === selectedCategory);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        productsRes,
        categoriesRes,
        subcategoriesRes,
        attributesRes
      ] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
        api.subcategories.getAll(),
        productAttributesApi.getAll()
      ]);

      if (productsRes.success) setProducts(productsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (subcategoriesRes.success) setSubcategories(subcategoriesRes.data || []);
      if (attributesRes.success) setProductAttributes(attributesRes.data || []);

      // Show any errors
      [productsRes, categoriesRes, subcategoriesRes].forEach(res => {
        if (!res.success && res.error) {
          toast.error(`Error loading data: ${res.error}`);
        }
      });

      // Attributes loading is optional - don't show error if table doesn't exist yet
      if (!attributesRes.success && attributesRes.error && attributesRes.error !== 'Table not yet created') {
        console.warn('Product attributes error:', attributesRes.error);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('\n🚀 ProductsPage: Starting product save process...');
    console.log('📋 ProductsPage: Current form data:', formData);
    console.log('✏️ ProductsPage: Editing mode:', editingProduct ? 'UPDATE' : 'CREATE');
    if (editingProduct) {
      console.log('📝 ProductsPage: Editing product:', editingProduct.id);
    }

    // Check for temporary images
    const tempImages = tempImageStore.getAllImages();
    console.log(`📊 ProductsPage: Found ${tempImages.length} temporary images in store`);
    if (tempImages.length > 0) {
      console.log('📋 ProductsPage: Temporary images list:', tempImages.map(img => ({
        id: img.id,
        type: img.type,
        fileName: img.file.name
      })));
    }

    // Validation
    console.log('🔍 ProductsPage: Starting form validation...');
    if (!formData.name.trim()) {
      console.log('❌ ProductsPage: Validation failed - missing name');
      toast.error('El nombre del producto es requerido');
      return;
    }
    if (!formData.category_id) {
      console.log('❌ ProductsPage: Validation failed - missing category');
      toast.error('La categoría es requerida');
      return;
    }
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      console.log('❌ ProductsPage: Validation failed - invalid cost');
      toast.error('El costo debe ser mayor a 0');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      console.log('❌ ProductsPage: Validation failed - invalid price');
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    console.log('✅ ProductsPage: Form validation passed');

    setSaving(true);
    try {
      console.log('📦 ProductsPage: Building product data object...');
      const productData: ProductInsert = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || undefined,
        attribute_id: formData.attribute_id || undefined,
        cost: parseFloat(formData.cost),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        cover_image: formData.cover_image.trim() || undefined,
        hover_image: formData.hover_image.trim() || undefined,
        product_images: formData.gallery_images.filter(img => img.trim() !== ''),
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_new: formData.is_new
      };
      console.log('📋 ProductsPage: Product data object built:', productData);

      let result: any;
      if (editingProduct) {
        console.log('🔄 ProductsPage: Updating existing product...');
        result = await api.products.update(editingProduct.id, productData);
        console.log('📡 ProductsPage: Update API response:', result);
        if (result.success && result.data) {
          setProducts(products.map(product => 
            product.id === editingProduct.id ? result.data! : product
          ));
          toast.success('Producto actualizado correctamente');
          console.log('✅ ProductsPage: Product updated successfully');
        }
      } else {
        console.log('🆕 ProductsPage: Creating new product...');
        result = await api.products.create(productData);
        console.log('📡 ProductsPage: Create API response:', result);
        if (result.success && result.data) {
          setProducts([...products, result.data]);
          toast.success('Producto creado correctamente');
          console.log('✅ ProductsPage: Product created successfully');
        }
      }

      // NOW UPLOAD TEMPORARY IMAGES TO CLOUDFLARE R2
      if (result.success && tempImages.length > 0) {
        console.log('\n🌐 ProductsPage: Starting image upload to Cloudflare R2...');
        console.log(`📤 ProductsPage: Will upload ${tempImages.length} images for product: ${result.data?.id || 'unknown'}`);
        
        const uploadResult = await TempImageUploader.uploadAllTempImages(result.data?.id);
        console.log('📊 ProductsPage: Upload process completed');
        console.log('📈 ProductsPage: Upload results:', uploadResult);
        
        if (uploadResult.errors.length > 0) {
          console.log('⚠️ ProductsPage: Some image uploads failed:', uploadResult.errors);
          toast.error(`Producto guardado, pero ${uploadResult.errors.length} imágenes no se pudieron subir`);
        } else if (uploadResult.uploadedUrls.length > 0) {
          console.log('✅ ProductsPage: All images uploaded successfully');
          toast.success(`Producto guardado y ${uploadResult.uploadedUrls.length} imágenes subidas correctamente`);
          
          // UPDATE PRODUCT WITH REAL R2 URLS
          console.log('🔄 ProductsPage: Updating product with R2 URLs...');
          const updatedProductData = TempImageUploader.mapTempUrlsToReal(
            productData,
            uploadResult.tempUrls,
            uploadResult.uploadedUrls
          );
          console.log('📋 ProductsPage: Updated product data with R2 URLs:', updatedProductData);
          
          const finalUpdateResult = await api.products.update(result.data.id, updatedProductData);
          console.log('📡 ProductsPage: Final update API response:', finalUpdateResult);
          
          if (finalUpdateResult.success) {
            console.log('✅ ProductsPage: Product URLs updated with R2 links');
            // Refresh products list to show updated URLs
            loadData();
          }
        }
      } else if (result.success) {
        console.log('ℹ️ ProductsPage: No temporary images to upload');
      }

      if (result.error) {
        console.log('❌ ProductsPage: API returned error:', result.error);
        toast.error(result.error);
        return;
      }

      // Reset form
      console.log('🧹 ProductsPage: Resetting form and closing dialog...');
      resetForm();
      setIsDialogOpen(false);
      console.log('✅ ProductsPage: Product save process completed successfully');
    } catch (error) {
      console.error('❌ ProductsPage: Error during product save process:', error);
      console.error('🔍 ProductsPage: Error details:', {
        editingMode: editingProduct ? 'update' : 'create',
        productId: editingProduct?.id,
        formData: formData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Error al guardar el producto');
    } finally {
      console.log('🏁 ProductsPage: Finishing save process, setting saving to false');
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      attribute_id: product.attribute_id || '',
      cost: product.cost?.toString() || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '0',
      cover_image: product.cover_image || '',
      hover_image: product.hover_image || '',
      gallery_images: product.product_images || [],
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      is_new: product.is_new ?? false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('\n🗑️ ProductsPage: Starting product deletion process...');
    console.log('📋 ProductsPage: Product ID to delete:', id);
    
    // Find the product to get its images before deletion
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
      console.log('📋 ProductsPage: Product details before deletion:', {
        id: productToDelete.id,
        name: productToDelete.name,
        cover_image: productToDelete.cover_image,
        hover_image: productToDelete.hover_image,
        gallery_images: productToDelete.product_images?.length || 0
      });
    }

    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      console.log('✅ ProductsPage: User confirmed deletion');
      try {
        console.log('🚀 ProductsPage: Calling server-side API to delete product...');
        
        // Call the new server-side API endpoint instead of the client-side API
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📊 ProductsPage: Delete API response:', result);
        
        if (result.success) {
          console.log('✅ ProductsPage: Product deleted successfully from database and R2');
          setProducts(products.filter(product => product.id !== id));
          toast.success('Producto eliminado correctamente');
        } else {
          console.error('❌ ProductsPage: Deletion failed:', result.error);
          toast.error('Error al eliminar el producto: ' + result.error);
        }
      } catch (error) {
        console.error('❌ ProductsPage: Deletion error:', error);
        toast.error('Error al eliminar el producto');
      }
    } else {
      console.log('❌ ProductsPage: User cancelled deletion');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      attribute_id: '',
      cost: '',
      price: '',
      stock: '',
      cover_image: '',
      hover_image: '',
      gallery_images: [],
      is_active: true,
      is_featured: false,
      is_new: false
    });
    setEditingProduct(null);
  };

  // Helper functions
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoría no encontrada';
  };

  const getSubcategoryName = (subcategoryId: string) => {
    if (!subcategoryId) return 'Sin subcategoría';
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory ? subcategory.name : 'Subcategoría no encontrada';
  };

  const getAttributeName = (attributeId: string) => {
    if (!attributeId) return 'Sin atributo';
    const attribute = productAttributes.find(attr => attr.id === attributeId);
    return attribute ? `${attribute.name}: ${attribute.value}` : 'Atributo no encontrado';
  };

  // Action functions for new features
  const handleToggleFeatured = async (product: Product) => {
    try {
      const response = await api.products.update(product.id, {
        is_featured: !product.is_featured
      });

      if (response.success) {
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, is_featured: !p.is_featured }
            : p
        ));
        toast.success(
          product.is_featured 
            ? 'Producto removido de destacados' 
            : 'Producto marcado como destacado'
        );
      } else {
        toast.error(response.error || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleToggleNew = async (product: Product) => {
    try {
      const response = await api.products.update(product.id, {
        is_new: !product.is_new
      });

      if (response.success) {
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, is_new: !p.is_new }
            : p
        ));
        toast.success(
          product.is_new 
            ? 'Producto removido de nuevos' 
            : 'Producto marcado como nuevo'
        );
      } else {
        toast.error(response.error || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error toggling new:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleSaleRegistered = () => {
    // Optionally refresh data or show success message
    toast.success('Venta registrada exitosamente');
    loadData(); // Refresh products in case inventory changed
  };

  const handleStockOrderRegistered = async () => {
    toast.success('Pedido de stock registrado exitosamente');
    // Recargar los datos para mostrar el stock actualizado
    await loadData();
  };

  const handleGeneralSaleRegistered = () => {
    toast.success('Venta general registrada exitosamente');
  };

  const openHistoryModal = (tab: 'products' | 'sales' | 'stock') => {
    setHistoryDefaultTab(tab);
    setIsHistoryModalOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra tu catálogo de productos</p>
        </div>
        
        <div className="flex gap-2">
          {/* Botón de Historial */}
          <Button 
            variant="outline" 
            onClick={() => openHistoryModal('products')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Historial
          </Button>

          {/* Botón de Registrar Pedido de Stock */}
          <Button 
            variant="outline" 
            onClick={() => setIsStockOrderModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Registrar Pedido
          </Button>

          {/* Botón de Registrar Venta con Filtros */}
          <Button 
            variant="outline" 
            onClick={() => setIsProductSalesModalOpen(true)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Registrar Venta
          </Button>
          
          {/* Botón de Agregar Producto */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden">\
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Modifica la información del producto' : 'Ingresa la información del nuevo producto'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 overflow-x-hidden" style={{ maxWidth: '100%', width: '100%' }}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                        .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategoría</Label>
                  <Select 
                    value={formData.subcategory_id} 
                    onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                    disabled={!formData.category_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="attribute">Atributo</Label>
                  <Select 
                    value={formData.attribute_id} 
                    onValueChange={(value) => setFormData({ ...formData, attribute_id: value })}
                    disabled={!formData.subcategory_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un atributo" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAttributes.map((attribute) => (
                        <SelectItem key={attribute.id} value={attribute.id}>
                          {attribute.name}: {attribute.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Aros de acero quirúrgico..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del producto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Costo *</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Precio de Venta *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Stock Disponible</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cantidad de unidades disponibles en inventario
                  </p>
                </div>
              </div>

              {/* Imágenes de Portada */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Imágenes de Portada</h3>
                  <p className="text-sm text-muted-foreground">
                    Estas imágenes se mostrarán en las tarjetas de producto. La imagen hover aparece al pasar el mouse.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    {(() => {
                      console.log('🖼️ ProductsPage: Rendering cover ImageUpload with currentImageUrl:', formData.cover_image);
                      return null;
                    })()}
                    <ImageUpload
                      currentImageUrl={formData.cover_image}
                      onImageUploaded={(imageUrl: string) => {
                        console.log('🖼️ ProductsPage: cover image uploaded, received imageUrl:', imageUrl);
                        
                        // Clean up any malformed temp IDs
                        let cleanImageUrl = imageUrl;
                        if (imageUrl.startsWith('temp_temp_')) {
                          cleanImageUrl = imageUrl.replace('temp_temp_', '');
                          console.log('🧹 ProductsPage: cleaned up malformed cover image ID:', cleanImageUrl);
                        }
                        
                        setFormData({ ...formData, cover_image: cleanImageUrl });
                        console.log('🖼️ ProductsPage: cover_image set in formData');
                      }}
                      onImageRemoved={() => setFormData({ ...formData, cover_image: '' })}
                      label="Imagen Principal *"
                      folder="products/covers"
                      required={true}
                    />
                  </div>
                  
                  <div>
                    {(() => {
                      console.log('🖼️ ProductsPage: Rendering hover ImageUpload with currentImageUrl:', formData.hover_image);
                      return null;
                    })()}
                    <ImageUpload
                      currentImageUrl={formData.hover_image}
                      onImageUploaded={(imageUrl: string) => {
                        console.log('🖼️ ProductsPage: hover image uploaded, received imageUrl:', imageUrl);
                        
                        // Clean up any malformed temp IDs
                        let cleanImageUrl = imageUrl;
                        if (imageUrl.startsWith('temp_temp_')) {
                          cleanImageUrl = imageUrl.replace('temp_temp_', '');
                          console.log('🧹 ProductsPage: cleaned up malformed hover image ID:', cleanImageUrl);
                        }
                        
                        setFormData({ ...formData, hover_image: cleanImageUrl });
                        console.log('🖼️ ProductsPage: hover_image set in formData');
                      }}
                      onImageRemoved={() => setFormData({ ...formData, hover_image: '' })}
                      label="Imagen Hover"
                      folder="products/hover"
                    />
                  </div>
                </div>
              </div>

              {/* Galería de Imágenes del Producto */}
              <div className="w-full max-w-full overflow-hidden" style={{ maxWidth: '100%' }}>
                <ImageGalleryUpload
                  images={formData.gallery_images}
                  onChange={(images) => setFormData({ ...formData, gallery_images: images })}
                  title="Galería del Producto"
                  maxImages={8}
                  folder="products/gallery"
                  productId={editingProduct?.id}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Producto activo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Producto destacado</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_new"
                  checked={formData.is_new}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                />
                <Label htmlFor="is_new">Producto nuevo</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingProduct ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  editingProduct ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredProducts.length}</div>
          <p className="text-xs text-muted-foreground">
            Productos registrados en el catálogo
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters Section - Desktop */}
      <div className="hidden md:block">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            {/* Search Bar on the left */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters and Sort on the right */}
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas las subcategorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las subcategorías</SelectItem>
                  {getAvailableSubcategories().map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                  <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                  <SelectItem value="price-asc">Precio menor a mayor</SelectItem>
                  <SelectItem value="price-desc">Precio mayor a menor</SelectItem>
                  <SelectItem value="stock-asc">Stock menor a mayor</SelectItem>
                  <SelectItem value="stock-desc">Stock mayor a menor</SelectItem>
                  <SelectItem value="newest">Más nuevo primero</SelectItem>
                  <SelectItem value="oldest">Más viejo primero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Search and Filters Section */}
      <div className="md:hidden space-y-4">
        <Card className="p-4">
          <div className="space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Mobile Filters */}
            <div className="grid grid-cols-1 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las subcategorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las subcategorías</SelectItem>
                  {getAvailableSubcategories().map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                  <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                  <SelectItem value="price-asc">Precio menor a mayor</SelectItem>
                  <SelectItem value="price-desc">Precio mayor a menor</SelectItem>
                  <SelectItem value="stock-asc">Stock menor a mayor</SelectItem>
                  <SelectItem value="stock-desc">Stock mayor a menor</SelectItem>
                  <SelectItem value="newest">Más nuevo primero</SelectItem>
                  <SelectItem value="oldest">Más viejo primero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Subcategoría</TableHead>
              <TableHead>Atributo</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Cargando productos...</p>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay productos registrados</h3>
                  <p className="text-muted-foreground">Comienza agregando tu primer producto</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {product.cover_image && (
                          <img
                            src={product.cover_image}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover border mr-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {/* Indicadores de imágenes adicionales */}
                        <div className="absolute -bottom-1 -right-1 flex gap-1">
                          {product.hover_image && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white" title="Tiene imagen hover" />
                          )}
                          {product.product_images && product.product_images.length > 0 && (
                            <div className="w-3 h-3 bg-green-500 rounded-full border border-white" title={`${product.product_images.length} imágenes en galería`} />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {product.name}
                          {product.is_featured && (
                            <span title="Destacado">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            </span>
                          )}
                          {product.is_new && (
                            <span title="Nuevo">
                              <Sparkles className="h-3 w-3 text-blue-500" />
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <div className="text-sm text-muted-foreground">
                            {product.description.length > 50 
                              ? `${product.description.substring(0, 50)}...` 
                              : product.description
                            }
                          </div>
                        )}
                        {/* Info de imágenes */}
                        <div className="flex items-center gap-2 mt-1">
                          {product.cover_image && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Principal</span>
                          )}
                          {product.hover_image && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Hover</span>
                          )}
                          {product.product_images && product.product_images.length > 0 && (
                            <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                              +{product.product_images.length} galería
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryName(product.category_id || '')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getSubcategoryName(product.subcategory_id || '')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getAttributeName(product.attribute_id || '')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.cost ? formatPrice(product.cost) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {product.price ? formatPrice(product.price) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (product.stock || 0) > 10 
                          ? 'bg-green-100 text-green-800'
                          : (product.stock || 0) > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock || 0} unidades
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* Featured Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(product)}
                        title={product.is_featured ? "Quitar de destacados" : "Marcar como destacado"}
                        className={product.is_featured ? "text-yellow-600 hover:text-yellow-700" : "text-gray-400 hover:text-yellow-600"}
                      >
                        <Star className={`h-4 w-4 ${product.is_featured ? 'fill-current' : ''}`} />
                      </Button>
                      
                      {/* New Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleNew(product)}
                        title={product.is_new ? "Quitar de nuevos" : "Marcar como nuevo"}
                        className={product.is_new ? "text-blue-600 hover:text-blue-700" : "text-gray-400 hover:text-blue-600"}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>

                      {/* Register Sale */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProductForSale(product);
                          setIsProductSalesModalOpen(true);
                        }}
                        title="Registrar venta"
                        className="text-green-600 hover:text-green-700"
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        title="Editar producto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        title="Eliminar producto"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sales Registration Modal */}
      <SalesRegistrationModal
        isOpen={isSalesModalOpen}
        onClose={() => {
          setIsSalesModalOpen(false);
          setSelectedProductForSale(null);
        }}
        preselectedProduct={selectedProductForSale}
        onSaleRegistered={handleSaleRegistered}
      />

      {/* Stock Order Modal */}
      <StockOrderModal
        isOpen={isStockOrderModalOpen}
        onClose={() => setIsStockOrderModalOpen(false)}
        onOrderRegistered={handleStockOrderRegistered}
      />

      {/* General Sales Modal */}
      <GeneralSalesModal
        isOpen={isGeneralSalesModalOpen}
        onClose={() => setIsGeneralSalesModalOpen(false)}
        onSaleRegistered={handleGeneralSaleRegistered}
      />

      {/* Product Sales Modal with Filters */}
      <ProductSalesModal
        isOpen={isProductSalesModalOpen}
        onClose={() => {
          setIsProductSalesModalOpen(false);
          setSelectedProductForSale(null);
        }}
        onSaleRegistered={handleSaleRegistered}
        preselectedProduct={selectedProductForSale}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        defaultTab={historyDefaultTab}
      />
    </div>
  );
}