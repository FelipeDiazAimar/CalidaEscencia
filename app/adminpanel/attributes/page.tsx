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
import { Plus, Edit, Trash2, Palette, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { productAttributesApi } from '@/lib/api/productAttributes';
import { api } from '@/lib/api/products';
import type { ProductAttribute, Subcategory, Category } from '@/types/database';

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'variant' as ProductAttribute['type'],
    value: '',
    description: '',
    subcategory_id: '',
    color_hex: '',
    sort_order: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load attributes, subcategories and categories from Supabase on component mount
  useEffect(() => {
    loadAttributes();
    loadSubcategories();
    loadCategories();
  }, []);

  const loadAttributes = async () => {
    setIsLoading(true);
    try {
      const response = await productAttributesApi.getAll();
      if (response.success && response.data) {
        setAttributes(response.data);
      } else {
        toast.error(response.error || 'Error al cargar los atributos');
      }
    } catch (error) {
      console.error('Error loading attributes:', error);
      toast.error('Error al cargar los atributos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubcategories = async () => {
    try {
      const response = await api.subcategories.getAll();
      if (response.success && response.data) {
        setSubcategories(response.data);
      } else {
        toast.error(response.error || 'Error al cargar las subcategorías');
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
      toast.error('Error al cargar las subcategorías');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.categories.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        toast.error(response.error || 'Error al cargar las categorías');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Error al cargar las categorías');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del atributo es requerido');
      return;
    }

    if (!formData.value.trim()) {
      toast.error('El valor del atributo es requerido');
      return;
    }

    if (!formData.subcategory_id) {
      toast.error('Debe seleccionar una subcategoría');
      return;
    }

    // Check for duplicates when creating new attribute
    if (!editingAttribute) {
      const existingAttribute = attributes.find(attr =>
        attr.subcategory_id === formData.subcategory_id &&
        attr.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        attr.value.toLowerCase() === formData.value.trim().toLowerCase()
      );

      if (existingAttribute) {
        toast.error('Ya existe un atributo con el mismo nombre y valor en esta subcategoría');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingAttribute) {
        // Update existing attribute
        const updateData: any = {
          name: formData.name.trim(),
          type: formData.type,
          value: formData.value.trim(),
          subcategory_id: formData.subcategory_id,
          sort_order: Number(formData.sort_order) || 0
        };

        // Add optional fields only if they have values
        if (formData.description.trim()) {
          updateData.description = formData.description.trim();
        }
        if (formData.color_hex.trim()) {
          updateData.color_hex = formData.color_hex.trim();
        }

        const response = await productAttributesApi.update(editingAttribute.id!, updateData);

        if (response.success && response.data) {
          setAttributes(attributes.map(attribute =>
            attribute.id === editingAttribute.id ? response.data! : attribute
          ));
          toast.success('Atributo actualizado correctamente');
        } else {
          toast.error(response.error || 'Error al actualizar el atributo');
          return;
        }
      } else {
        // Create new attribute
        const createData: any = {
          name: formData.name.trim(),
          type: formData.type,
          value: formData.value.trim(),
          subcategory_id: formData.subcategory_id,
          sort_order: Number(formData.sort_order) || 0
        };

        // Add optional fields only if they have values
        if (formData.description.trim()) {
          createData.description = formData.description.trim();
        }
        if (formData.color_hex.trim()) {
          createData.color_hex = formData.color_hex.trim();
        }

        const response = await productAttributesApi.create(createData);

        if (response.success && response.data) {
          setAttributes([...attributes, response.data]);
          toast.success('Atributo creado correctamente');
        } else {
          toast.error(response.error || 'Error al crear el atributo');
          return;
        }
      }

      // Reset form
      setFormData({
        name: '',
        type: 'variant',
        value: '',
        description: '',
        subcategory_id: '',
        color_hex: '',
        sort_order: 0
      });
      setEditingAttribute(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast.error('Error al guardar el atributo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (attribute: ProductAttribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name,
      type: attribute.type,
      value: attribute.value,
      description: attribute.description || '',
      subcategory_id: attribute.subcategory_id,
      color_hex: attribute.color_hex || '',
      sort_order: attribute.sort_order || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este atributo?')) {
      try {
        const response = await productAttributesApi.delete(id);

        if (response.success) {
          setAttributes(attributes.filter(attribute => attribute.id !== id));
          toast.success('Atributo eliminado correctamente');
        } else {
          toast.error(response.error || 'Error al eliminar el atributo');
        }
      } catch (error) {
        console.error('Error deleting attribute:', error);
        toast.error('Error al eliminar el atributo');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'variant',
      value: '',
      description: '',
      subcategory_id: '',
      color_hex: '',
      sort_order: 0
    });
    setEditingAttribute(null);
  };

  // Helper function to get subcategory name
  const getSubcategoryName = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory ? subcategory.name : 'Subcategoría no encontrada';
  };

  // Helper function to get category name for a subcategory
  const getCategoryNameForSubcategory = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    if (!subcategory) return 'Categoría no encontrada';

    const category = categories.find(cat => cat.id === subcategory.category_id);
    return category ? category.name : 'Categoría no encontrada';
  };

  // Group attributes by subcategory
  const groupedAttributes = attributes.reduce((acc, attribute) => {
    const subcategoryId = attribute.subcategory_id;
    if (!acc[subcategoryId]) {
      acc[subcategoryId] = [];
    }
    acc[subcategoryId].push(attribute);
    return acc;
  }, {} as Record<string, ProductAttribute[]>);

  // Sort subcategories by their category order, then by subcategory name
  const sortedSubcategories = subcategories
    .filter(subcategory => groupedAttributes[subcategory.id]?.length > 0)
    .sort((a, b) => {
      const categoryA = categories.find(cat => cat.id === a.category_id);
      const categoryB = categories.find(cat => cat.id === b.category_id);

      // First sort by category order_index or name
      if (categoryA && categoryB) {
        if (categoryA.order_index !== undefined && categoryB.order_index !== undefined) {
          const categoryOrder = categoryA.order_index - categoryB.order_index;
          if (categoryOrder !== 0) return categoryOrder;
        }
        const categoryNameOrder = categoryA.name.localeCompare(categoryB.name);
        if (categoryNameOrder !== 0) return categoryNameOrder;
      }

      // Then sort by subcategory name
      return a.name.localeCompare(b.name);
    });

  const getTypeLabel = (type: ProductAttribute['type']) => {
    const labels = {
      color: 'Color',
      aroma: 'Aroma',
      size: 'Tamaño',
      material: 'Material',
      style: 'Estilo',
      variant: 'Variante'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Atributos de Productos</h1>
          <p className="text-muted-foreground">Administra los atributos para las variantes de productos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Atributo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? 'Editar Atributo' : 'Agregar Nuevo Atributo'}
              </DialogTitle>
              <DialogDescription>
                {editingAttribute ? 'Modifica la información del atributo' : 'Ingresa la información del nuevo atributo'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="subcategory">Subcategoría *</Label>
                <Select value={formData.subcategory_id} onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcategory) => {
                      const category = categories.find(cat => cat.id === subcategory.category_id);
                      return (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {category?.name} → {subcategory.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Atributo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Color, Tamaño, Material..."
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Atributo *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ProductAttribute['type'] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="aroma">Aroma</SelectItem>
                      <SelectItem value="size">Tamaño</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="style">Estilo</SelectItem>
                      <SelectItem value="variant">Variante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Valor *</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Ej: Rojo, Grande, Oro..."
                  />
                </div>

                <div>
                  <Label htmlFor="sort_order">Orden de Clasificación</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.type === 'color' && (
                <div>
                  <Label htmlFor="color_hex">Código Hexadecimal (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color_hex"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      placeholder="#FF0000"
                    />
                    {formData.color_hex && (
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: formData.color_hex }}
                      />
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del atributo"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingAttribute ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  editingAttribute ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Atributos</CardTitle>
          <Palette className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{attributes.length}</div>
          <p className="text-xs text-muted-foreground">
            Atributos registrados en el sistema
          </p>
        </CardContent>
      </Card>

      {/* Attributes Grouped by Subcategory */}
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground ml-2">Cargando atributos...</p>
            </CardContent>
          </Card>
        ) : attributes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay atributos registrados</h3>
              <p className="text-muted-foreground">Comienza agregando tu primer atributo</p>
            </CardContent>
          </Card>
        ) : (
          sortedSubcategories.map((subcategory) => (
            <Card key={subcategory.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-green-600" />
                  {getCategoryNameForSubcategory(subcategory.id)} → {subcategory.name}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {groupedAttributes[subcategory.id]?.length || 0} atributos
                  </span>
                </CardTitle>
                {subcategory.description && (
                  <CardDescription>{subcategory.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Atributo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedAttributes[subcategory.id]
                        ?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        ?.map((attribute) => (
                        <TableRow key={attribute.id}>
                          <TableCell className="font-medium">{attribute.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getTypeLabel(attribute.type)}
                            </span>
                          </TableCell>
                          <TableCell>{attribute.value}</TableCell>
                          <TableCell>
                            {attribute.color_hex ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: attribute.color_hex }}
                                />
                                <span className="text-xs font-mono">{attribute.color_hex}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{attribute.sort_order || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(attribute)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(attribute.id!)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}