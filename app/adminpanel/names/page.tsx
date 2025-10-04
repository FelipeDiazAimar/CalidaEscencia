
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit, Trash2, Loader2, ChevronUp, ChevronDown, Image, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import type { Category } from '@/types/database';
import ImagePreview from '@/components/ui/image-preview';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    portada_historias: '',
    portada_cards: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load categories from Supabase on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < categories.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // Can't move further
    }

    // Create new array with swapped positions
    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(currentIndex, 1);
    newCategories.splice(newIndex, 0, movedCategory);

    // Update local state immediately for better UX
    setCategories(newCategories);

    try {
      // Create order update array with new order_index values
      const categoryOrders = newCategories.map((category, index) => ({
        id: category.id,
        order_index: index + 1
      }));

      console.log('🔄 Updating category order...', categoryOrders);
      const response = await api.categories.updateOrder(categoryOrders);
      
      if (response.success) {
        toast.success('Orden actualizado correctamente');
        console.log('✅ Order update successful');
        
        // In fallback mode, no need to reload from server
        // The local state is already updated
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
          await loadCategories();
        }
      } else {
        // Revert on error
        setCategories(categories);
        console.error('❌ Order update failed:', response.error);
        toast.error(response.error || 'Error al actualizar el orden');
      }
    } catch (error) {
      // Revert on error
      setCategories(categories);
      console.error('❌ Error updating category order:', error);
      toast.error('Error al actualizar el orden');
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        // Update existing category
        const response = await api.categories.update(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          portada_historias: formData.portada_historias || undefined,
          portada_cards: formData.portada_cards || undefined
        });
        
        if (response.success && response.data) {
          setCategories(categories.map(category => 
            category.id === editingCategory.id ? response.data! : category
          ));
          toast.success('Categoría actualizada correctamente');
        } else {
          toast.error(response.error || 'Error al actualizar la categoría');
          return;
        }
      } else {
        // Create new category
        const response = await api.categories.create({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          portada_historias: formData.portada_historias || undefined,
          portada_cards: formData.portada_cards || undefined
        });
        
        if (response.success && response.data) {
          setCategories([...categories, response.data]);
          toast.success('Categoría creada correctamente');
        } else {
          toast.error(response.error || 'Error al crear la categoría');
          return;
        }
      }

      // Reset form
      setFormData({ name: '', description: '', portada_historias: '', portada_cards: '' });
      setEditingCategory(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error al guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name,
      description: category.description || '',
      portada_historias: category.portada_historias || '',
      portada_cards: category.portada_cards || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        const response = await api.categories.delete(id);
        
        if (response.success) {
          setCategories(categories.filter(category => category.id !== id));
          toast.success('Categoría eliminada correctamente');
        } else {
          toast.error(response.error || 'Error al eliminar la categoría');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Error al eliminar la categoría');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', portada_historias: '', portada_cards: '' });
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
            {(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')) && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                MODO DEMO
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Administra las categorías de productos. Usa los botones ↑↓ para cambiar el orden de aparición en el header.
            {(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')) && (
              <>
                <br />
                <span className="text-yellow-600 text-sm">
                  ⚠️ Supabase no configurado - Los cambios no se guardarán permanentemente
                </span>
              </>
            )}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Modifica la información de la categoría' : 'Ingresa la información de la nueva categoría'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Categoría</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Aros, Collares, Anillos..."
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe brevemente esta categoría..."
                  rows={3}
                />
              </div>

              {/* Portadas de imagen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Portada de Historias */}
                <ImagePreview
                  value={formData.portada_historias}
                  onChange={(value) => setFormData({ ...formData, portada_historias: value })}
                  aspectRatio="9:16"
                  label="Portada de Historias"
                  placeholder="URL de imagen circular para historias"
                />

                {/* Portada de Cards */}
                <ImagePreview
                  value={formData.portada_cards}
                  onChange={(value) => setFormData({ ...formData, portada_cards: value })}
                  aspectRatio="16:9"
                  label="Portada de Cards"
                  placeholder="URL de imagen rectangular para cards"
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
                    {editingCategory ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  editingCategory ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Portadas</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Cargando categorías...</p>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay categorías registradas
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground mr-2">
                        {category.order_index || index + 1}
                      </span>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveCategory(category.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-xs">
                    {category.description ? (
                      <span className="text-sm text-muted-foreground">
                        {category.description.length > 50 
                          ? `${category.description.substring(0, 50)}...` 
                          : category.description
                        }
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Sin descripción</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Portada de Historias */}
                      <div className="flex flex-col items-center">
                        {category.portada_historias ? (
                          <img
                            src={category.portada_historias}
                            alt="Historias"
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Image className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">Historias</span>
                      </div>
                      
                      {/* Portada de Cards */}
                      <div className="flex flex-col items-center">
                        {category.portada_cards ? (
                          <img
                            src={category.portada_cards}
                            alt="Cards"
                            className="w-12 h-7 rounded object-cover border border-gray-200"
                            style={{ aspectRatio: '350.667/197.250' }}
                          />
                        ) : (
                          <div 
                            className="w-12 h-7 rounded bg-gray-100 flex items-center justify-center"
                            style={{ aspectRatio: '350.667/197.250' }}
                          >
                            <Image className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">Cards</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.created_at ? new Date(category.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
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
    </div>
  );
}
