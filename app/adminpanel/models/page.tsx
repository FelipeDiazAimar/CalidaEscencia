
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
import { Plus, Edit, Trash2, Users, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import type { Subcategory, Category } from '@/types/database';

export default function AdminSubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    category_id: '' 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load subcategories and categories from Supabase on component mount
  useEffect(() => {
    loadSubcategories();
    loadCategories();
  }, []);

  const loadSubcategories = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
      toast.error('El nombre de la subcategoría es requerido');
      return;
    }

    if (!formData.category_id) {
      toast.error('Debe seleccionar una categoría');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSubcategory) {
        // Update existing subcategory
        const response = await api.subcategories.update(editingSubcategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category_id: formData.category_id
        });
        
        if (response.success && response.data) {
          setSubcategories(subcategories.map(subcategory => 
            subcategory.id === editingSubcategory.id ? response.data! : subcategory
          ));
          toast.success('Subcategoría actualizada correctamente');
        } else {
          toast.error(response.error || 'Error al actualizar la subcategoría');
          return;
        }
      } else {
        // Create new subcategory
        const response = await api.subcategories.create({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category_id: formData.category_id
        });
        
        if (response.success && response.data) {
          setSubcategories([...subcategories, response.data]);
          toast.success('Subcategoría creada correctamente');
        } else {
          toast.error(response.error || 'Error al crear la subcategoría');
          return;
        }
      }

      // Reset form
      setFormData({ name: '', description: '', category_id: '' });
      setEditingSubcategory(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast.error('Error al guardar la subcategoría');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({ 
      name: subcategory.name,
      description: subcategory.description || '',
      category_id: subcategory.category_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta subcategoría?')) {
      try {
        const response = await api.subcategories.delete(id);
        
        if (response.success) {
          setSubcategories(subcategories.filter(subcategory => subcategory.id !== id));
          toast.success('Subcategoría eliminada correctamente');
        } else {
          toast.error(response.error || 'Error al eliminar la subcategoría');
        }
      } catch (error) {
        console.error('Error deleting subcategory:', error);
        toast.error('Error al eliminar la subcategoría');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category_id: '' });
    setEditingSubcategory(null);
  };

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoría no encontrada';
  };

  // Group subcategories by category
  const groupedSubcategories = subcategories.reduce((acc, subcategory) => {
    const categoryId = subcategory.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(subcategory);
    return acc;
  }, {} as Record<string, Subcategory[]>);

  // Sort categories by order_index if available, otherwise by name
  const sortedCategories = categories
    .filter(category => groupedSubcategories[category.id]?.length > 0)
    .sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined) {
        return a.order_index - b.order_index;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Subcategorías</h1>
          <p className="text-muted-foreground">Administra las subcategorías para organizar mejor tus productos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Subcategoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory ? 'Editar Subcategoría' : 'Agregar Nueva Subcategoría'}
              </DialogTitle>
              <DialogDescription>
                {editingSubcategory ? 'Modifica la información de la subcategoría' : 'Ingresa la información de la nueva subcategoría'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Categoría Principal *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Nombre de la Subcategoría *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Aros largos, Collares choker..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la subcategoría"
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
                    {editingSubcategory ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  editingSubcategory ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Subcategorías</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subcategories.length}</div>
          <p className="text-xs text-muted-foreground">
            Subcategorías registradas en el sistema
          </p>
        </CardContent>
      </Card>

      {/* Subcategories Grouped by Category */}
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground ml-2">Cargando subcategorías...</p>
            </CardContent>
          </Card>
        ) : subcategories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay subcategorías registradas</h3>
              <p className="text-muted-foreground">Comienza agregando tu primera subcategoría</p>
            </CardContent>
          </Card>
        ) : (
          sortedCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {category.name}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {groupedSubcategories[category.id]?.length || 0} subcategorías
                  </span>
                </CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcategoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedSubcategories[category.id]?.map((subcategory) => (
                        <TableRow key={subcategory.id}>
                          <TableCell className="font-medium">{subcategory.name}</TableCell>
                          <TableCell className="max-w-xs">
                            {subcategory.description ? (
                              <span className="text-sm text-muted-foreground">
                                {subcategory.description.length > 80 
                                  ? `${subcategory.description.substring(0, 80)}...` 
                                  : subcategory.description
                                }
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sin descripción</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {subcategory.created_at ? new Date(subcategory.created_at).toLocaleDateString('es-ES') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(subcategory)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(subcategory.id)}
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
