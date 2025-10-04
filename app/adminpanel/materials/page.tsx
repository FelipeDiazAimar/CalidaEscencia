'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, Upload, X, Gem, Settings } from 'lucide-react';
import { api } from '@/lib/api/products';
import { toast } from 'sonner';
import type { WebsiteMaterial, WebsiteMaterialInsert, WebsiteMaterialUpdate, MaterialsContent, MaterialsContentInsert, MaterialsContentUpdate } from '@/types/database';

export default function MaterialsAdminPage() {
  const [materials, setMaterials] = useState<WebsiteMaterial[]>([]);
  const [contents, setContents] = useState<MaterialsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<WebsiteMaterial | null>(null);
  const [editingContent, setEditingContent] = useState<MaterialsContent | null>(null);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [materialFormData, setMaterialFormData] = useState<WebsiteMaterialInsert>({
    title: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });
  const [contentFormData, setContentFormData] = useState<MaterialsContentInsert>({
    section_type: 'care_tips',
    title: '',
    content: '',
    icon_name: '',
    is_active: true,
    display_order: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.websiteMaterials.getAll({ includeInactive: true });
      
      if (response.error) {
        toast.error('Error al cargar materiales: ' + response.error);
        return;
      }

      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Error al cargar materiales');
    }
  };

  const loadContents = async () => {
    try {
      const response = await api.materialsContent.getAll({ includeInactive: true });
      
      if (response.error) {
        toast.error('Error al cargar contenidos: ' + response.error);
        return;
      }

      setContents(response.data || []);
    } catch (error) {
      console.error('Error loading contents:', error);
      toast.error('Error al cargar contenidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadMaterials();
      await loadContents();
    };
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona solo archivos de imagen');
        return;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }

      setImageFile(file);
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Limpiar URL si había una
      setMaterialFormData({ ...materialFormData, image_url: '' });
    }
  };

  const handleImageUrlChange = (url: string) => {
    setMaterialFormData({ ...materialFormData, image_url: url });
    if (url.trim()) {
      setImagePreview(url);
      setImageFile(null); // Limpiar archivo si se usa URL
    } else {
      setImagePreview(null);
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    // Por ahora, simularemos la subida de archivo devolviendo una URL placeholder
    // En una implementación real, aquí subirías el archivo a tu servicio de almacenamiento
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = `https://picsum.photos/500/300?random=${Date.now()}`;
        resolve(mockUrl);
      }, 1000);
    });
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya imagen (archivo o URL)
    if (!imageFile && !materialFormData.image_url.trim()) {
      toast.error('Por favor proporciona una imagen (archivo o URL)');
      return;
    }
    
    if (!materialFormData.title.trim() || !materialFormData.description.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      let imageUrl = materialFormData.image_url;
      
      // Si hay un archivo, subirlo primero
      if (imageFile) {
        toast.info('Subiendo imagen...');
        imageUrl = await uploadImageFile(imageFile);
      }
      
      const materialData = {
        ...materialFormData,
        image_url: imageUrl
      };
      
      let response;
      
      if (editingMaterial) {
        // Update existing material
        response = await api.websiteMaterials.update(editingMaterial.id, materialData);
        if (response.error) {
          toast.error('Error al actualizar material: ' + response.error);
          return;
        }
        toast.success('Material actualizado exitosamente');
      } else {
        // Create new material
        response = await api.websiteMaterials.create(materialData);
        if (response.error) {
          toast.error('Error al crear material: ' + response.error);
          return;
        }
        toast.success('Material creado exitosamente');
      }

      // Reset form and close dialog
      resetMaterialForm();
      
      // Reload materials
      await loadMaterials();
    } catch (error) {
      console.error('Error submitting material:', error);
      toast.error('Error al procesar material');
    }
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentFormData.title.trim() || !contentFormData.content.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      let response;
      
      if (editingContent) {
        // Update existing content
        response = await api.materialsContent.update(editingContent.id, contentFormData);
        if (response.error) {
          toast.error('Error al actualizar contenido: ' + response.error);
          return;
        }
        toast.success('Contenido actualizado exitosamente');
      } else {
        // Create new content
        response = await api.materialsContent.create(contentFormData);
        if (response.error) {
          toast.error('Error al crear contenido: ' + response.error);
          return;
        }
        toast.success('Contenido creado exitosamente');
      }

      // Reset form and close dialog
      resetContentForm();
      
      // Reload contents
      await loadContents();
    } catch (error) {
      console.error('Error submitting content:', error);
      toast.error('Error al procesar contenido');
    }
  };

  const handleEditMaterial = (material: WebsiteMaterial) => {
    setEditingMaterial(material);
    setMaterialFormData({
      title: material.title,
      description: material.description,
      image_url: material.image_url,
      is_active: material.is_active,
      display_order: material.display_order,
    });
    setImagePreview(material.image_url);
    setImageFile(null);
    setIsMaterialDialogOpen(true);
  };

  const handleEditContent = (content: MaterialsContent) => {
    setEditingContent(content);
    setContentFormData({
      section_type: content.section_type,
      title: content.title,
      content: content.content,
      icon_name: content.icon_name || '',
      is_active: content.is_active,
      display_order: content.display_order,
    });
    setIsContentDialogOpen(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const response = await api.websiteMaterials.delete(id);
      
      if (response.error) {
        toast.error('Error al eliminar material: ' + response.error);
        return;
      }

      toast.success('Material eliminado exitosamente');
      await loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Error al eliminar material');
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      const response = await api.materialsContent.delete(id);
      
      if (response.error) {
        toast.error('Error al eliminar contenido: ' + response.error);
        return;
      }

      toast.success('Contenido eliminado exitosamente');
      await loadContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Error al eliminar contenido');
    }
  };

  const handleToggleActiveMaterial = async (material: WebsiteMaterial) => {
    try {
      const response = material.is_active 
        ? await api.websiteMaterials.deactivate(material.id)
        : await api.websiteMaterials.activate(material.id);
      
      if (response.error) {
        toast.error('Error al cambiar estado: ' + response.error);
        return;
      }

      toast.success(`Material ${material.is_active ? 'desactivado' : 'activado'} exitosamente`);
      await loadMaterials();
    } catch (error) {
      console.error('Error toggling material status:', error);
      toast.error('Error al cambiar estado del material');
    }
  };

  const resetMaterialForm = () => {
    setIsMaterialDialogOpen(false);
    setEditingMaterial(null);
    setImagePreview(null);
    setImageFile(null);
    setMaterialFormData({
      title: '',
      description: '',
      image_url: '',
      is_active: true,
      display_order: 0,
    });
  };

  const resetContentForm = () => {
    setIsContentDialogOpen(false);
    setEditingContent(null);
    setContentFormData({
      section_type: 'care_tips',
      title: '',
      content: '',
      icon_name: '',
      is_active: true,
      display_order: 0,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Materiales</h1>
          <p className="text-muted-foreground">Administra los materiales y contenido de la página /materials</p>
        </div>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            Materiales Principales
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Contenido Adicional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Materiales de Joyería</h2>
            <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingMaterial(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? 'Editar Material' : 'Agregar Nuevo Material'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMaterial 
                      ? 'Modifica la información del material de joyería.' 
                      : 'Completa la información para agregar un nuevo material de joyería.'
                    }
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleMaterialSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material_title">
                        <Gem className="h-4 w-4 inline mr-2" />
                        Título del Material *
                      </Label>
                      <Input
                        id="material_title"
                        placeholder="Ej: Oro de Calidad"
                        value={materialFormData.title}
                        onChange={(e) => setMaterialFormData({ ...materialFormData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_order">Orden de Visualización</Label>
                      <Input
                        id="display_order"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={materialFormData.display_order}
                        onChange={(e) => setMaterialFormData({ ...materialFormData, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material_description">Descripción del Material *</Label>
                    <Textarea
                      id="material_description"
                      placeholder="Describe las características y beneficios del material..."
                      value={materialFormData.description}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, description: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>
                      <Image className="h-4 w-4 inline mr-2" />
                      Imagen del Material *
                    </Label>
                    
                    <div className="space-y-3">
                      {/* Opción 1: Cargar archivo */}
                      <div className="space-y-2">
                        <Label htmlFor="material_image_file" className="text-sm font-medium">
                          <Upload className="h-4 w-4 inline mr-2" />
                          Cargar archivo de imagen
                        </Label>
                        <Input
                          id="material_image_file"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formatos soportados: JPG, PNG, GIF. Máximo 5MB.
                        </p>
                      </div>
                      
                      {/* Separador */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <hr className="flex-1" />
                        <span>O</span>
                        <hr className="flex-1" />
                      </div>
                      
                      {/* Opción 2: URL */}
                      <div className="space-y-2">
                        <Label htmlFor="material_image_url" className="text-sm font-medium">
                          URL de imagen externa
                        </Label>
                        <Input
                          id="material_image_url"
                          type="url"
                          placeholder="https://ejemplo.com/imagen-material.jpg"
                          value={materialFormData.image_url}
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          disabled={!!imageFile}
                        />
                        <p className="text-xs text-muted-foreground">
                          {imageFile ? 'Se usará el archivo cargado arriba' : 'Alternativamente, pega una URL de imagen'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Vista Previa</Label>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {imageFile ? (
                            <>
                              <Upload className="h-3 w-3" />
                              Archivo: {imageFile.name}
                            </>
                          ) : (
                            <>
                              <Image className="h-3 w-3" />
                              URL externa
                            </>
                          )}
                        </div>
                      </div>
                      <div className="relative border rounded-lg overflow-hidden max-w-md">
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-full h-auto"
                          onError={() => setImagePreview(null)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setMaterialFormData({ ...materialFormData, image_url: '' });
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="material_is_active"
                      checked={materialFormData.is_active}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, is_active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="material_is_active">Material activo (visible en la página)</Label>
                  </div>
                </form>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetMaterialForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" onClick={handleMaterialSubmit}>
                    {editingMaterial ? 'Actualizar' : 'Crear'} Material
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <MaterialsGrid 
            materials={materials}
            loading={loading}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
            onToggleActive={handleToggleActiveMaterial}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contenido Adicional</h2>
            <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingContent(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Contenido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingContent ? 'Editar Contenido' : 'Agregar Nuevo Contenido'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingContent 
                      ? 'Modifica la información del contenido adicional.' 
                      : 'Completa la información para agregar nuevo contenido adicional.'
                    }
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleContentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="section_type">Tipo de Sección *</Label>
                      <Select 
                        value={contentFormData.section_type} 
                        onValueChange={(value: 'care_tips' | 'maintenance') => setContentFormData({ ...contentFormData, section_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="care_tips">Consejos de Cuidado</SelectItem>
                          <SelectItem value="maintenance">Mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content_display_order">Orden de Visualización</Label>
                      <Input
                        id="content_display_order"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={contentFormData.display_order}
                        onChange={(e) => setContentFormData({ ...contentFormData, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content_title">Título *</Label>
                    <Input
                      id="content_title"
                      placeholder="Ej: Cuidado de tus Joyas"
                      value={contentFormData.title}
                      onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon_name">Nombre del Icono (Opcional)</Label>
                    <Input
                      id="icon_name"
                      placeholder="Ej: ShieldCheck, Wrench, Settings"
                      value={contentFormData.icon_name}
                      onChange={(e) => setContentFormData({ ...contentFormData, icon_name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nombre del icono de Lucide React (ej: ShieldCheck, Wrench)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content_text">Contenido *</Label>
                    <Textarea
                      id="content_text"
                      placeholder="Escribe el contenido aquí. Usa • para listas."
                      value={contentFormData.content}
                      onChange={(e) => setContentFormData({ ...contentFormData, content: e.target.value })}
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Puedes usar • para crear listas o escribir párrafos normales
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content_is_active"
                      checked={contentFormData.is_active}
                      onChange={(e) => setContentFormData({ ...contentFormData, is_active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="content_is_active">Contenido activo (visible en la página)</Label>
                  </div>
                </form>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetContentForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" onClick={handleContentSubmit}>
                    {editingContent ? 'Actualizar' : 'Crear'} Contenido
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <ContentGrid 
            contents={contents}
            loading={loading}
            onEdit={handleEditContent}
            onDelete={handleDeleteContent}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for Materials Grid
function MaterialsGrid({
  materials,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  materials: WebsiteMaterial[];
  loading: boolean;
  onEdit: (material: WebsiteMaterial) => void;
  onDelete: (id: string) => void;
  onToggleActive: (material: WebsiteMaterial) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando materiales...</p>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <Gem className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No hay materiales</h3>
        <p className="text-muted-foreground">Agrega tu primer material para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {materials.map((material) => (
        <Card key={material.id} className="overflow-hidden">
          <div className="aspect-video overflow-hidden">
            <img
              src={material.image_url}
              alt={material.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.jpg';
              }}
            />
          </div>
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-1">{material.title}</CardTitle>
              </div>
              <Badge variant={material.is_active ? "default" : "secondary"}>
                {material.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {material.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Orden: {material.display_order}</span>
              <span>{new Date(material.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>

          <CardFooter className="pt-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(material)}>
              <Edit2 className="h-3 w-3 mr-1" />
              Editar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggleActive(material)}
              className="min-w-0"
            >
              {material.is_active ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El material "{material.title}" será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(material.id)} className="bg-red-600 hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Component for Content Grid
function ContentGrid({
  contents,
  loading,
  onEdit,
  onDelete,
}: {
  contents: MaterialsContent[];
  loading: boolean;
  onEdit: (content: MaterialsContent) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando contenidos...</p>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="text-center py-12">
        <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No hay contenidos</h3>
        <p className="text-muted-foreground">Agrega tu primer contenido para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {contents.map((content) => (
        <Card key={content.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {content.icon_name && <span className="text-primary">📐</span>}
                  {content.title}
                </CardTitle>
                <CardDescription>
                  {content.section_type === 'care_tips' ? 'Consejos de Cuidado' : 'Mantenimiento'}
                  {content.icon_name && ` • Icono: ${content.icon_name}`}
                </CardDescription>
              </div>
              <Badge variant={content.is_active ? "default" : "secondary"}>
                {content.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-4">
                {content.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Orden: {content.display_order}</span>
                <span>{new Date(content.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(content)}>
              <Edit2 className="h-3 w-3 mr-1" />
              Editar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar contenido?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El contenido "{content.title}" será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(content.id)} className="bg-red-600 hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}