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
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, MapPin, User, Upload, X } from 'lucide-react';
import { api } from '@/lib/api/products';
import { toast } from 'sonner';
import type { CustomerTestimonial, CustomerTestimonialInsert, CustomerTestimonialUpdate } from '@/types/database';

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState<CustomerTestimonial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerTestimonialInsert>({
    customer_name: '',
    customer_location: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const response = await api.testimonials.getAll({ includeInactive: true });
      
      if (response.error) {
        toast.error('Error al cargar testimonios: ' + response.error);
        return;
      }

      setTestimonials(response.data || []);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast.error('Error al cargar testimonios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
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
      setFormData({ ...formData, image_url: '' });
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
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
    // (Supabase Storage, Cloudinary, AWS S3, etc.)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
        resolve(mockUrl);
      }, 1000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya imagen (archivo o URL)
    if (!imageFile && !formData.image_url.trim()) {
      toast.error('Por favor proporciona una imagen (archivo o URL)');
      return;
    }
    
    if (!formData.customer_name.trim() || !formData.customer_location.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      let imageUrl = formData.image_url;
      
      // Si hay un archivo, subirlo primero
      if (imageFile) {
        toast.info('Subiendo imagen...');
        imageUrl = await uploadImageFile(imageFile);
      }
      
      const testimonialData = {
        ...formData,
        image_url: imageUrl
      };
      
      let response;
      
      if (editingTestimonial) {
        // Update existing testimonial
        response = await api.testimonials.update(editingTestimonial.id, testimonialData);
        if (response.error) {
          toast.error('Error al actualizar testimonio: ' + response.error);
          return;
        }
        toast.success('Testimonio actualizado exitosamente');
      } else {
        // Create new testimonial
        response = await api.testimonials.create(testimonialData);
        if (response.error) {
          toast.error('Error al crear testimonio: ' + response.error);
          return;
        }
        toast.success('Testimonio creado exitosamente');
      }

      // Reset form and close dialog
      setFormData({
        customer_name: '',
        customer_location: '',
        image_url: '',
        is_active: true,
        display_order: 0,
      });
      setEditingTestimonial(null);
      setIsDialogOpen(false);
      setImagePreview(null);
      setImageFile(null);
      
      // Reload testimonials
      await loadTestimonials();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('Error al procesar testimonio');
    }
  };

  const handleEdit = (testimonial: CustomerTestimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      customer_name: testimonial.customer_name,
      customer_location: testimonial.customer_location,
      image_url: testimonial.image_url,
      is_active: testimonial.is_active,
      display_order: testimonial.display_order,
    });
    setImagePreview(testimonial.image_url);
    setImageFile(null); // Limpiar archivo al editar
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await api.testimonials.delete(id);
      
      if (response.error) {
        toast.error('Error al eliminar testimonio: ' + response.error);
        return;
      }

      toast.success('Testimonio eliminado exitosamente');
      await loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Error al eliminar testimonio');
    }
  };

  const handleToggleActive = async (testimonial: CustomerTestimonial) => {
    try {
      const response = testimonial.is_active 
        ? await api.testimonials.deactivate(testimonial.id)
        : await api.testimonials.activate(testimonial.id);
      
      if (response.error) {
        toast.error('Error al cambiar estado: ' + response.error);
        return;
      }

      toast.success(`Testimonio ${testimonial.is_active ? 'desactivado' : 'activado'} exitosamente`);
      await loadTestimonials();
    } catch (error) {
      console.error('Error toggling testimonial status:', error);
      toast.error('Error al cambiar estado del testimonio');
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    setImagePreview(null);
    setImageFile(null);
    setFormData({
      customer_name: '',
      customer_location: '',
      image_url: '',
      is_active: true,
      display_order: 0,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Testimonios</h1>
          <p className="text-muted-foreground mt-2">
            Administra los testimonios de clientes que aparecen en la galería
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Testimonio
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
              </DialogTitle>
              <DialogDescription>
                {editingTestimonial 
                  ? 'Modifica los datos del testimonio del cliente'
                  : 'Agrega un nuevo testimonio de cliente con captura de pantalla'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">
                    <User className="h-4 w-4 inline mr-2" />
                    Nombre del Cliente *
                  </Label>
                  <Input
                    id="customer_name"
                    placeholder="Ej: María González"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_location">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Ubicación del Cliente *
                  </Label>
                  <Input
                    id="customer_location"
                    placeholder="Ej: San Salvador, El Salvador"
                    value={formData.customer_location}
                    onChange={(e) => setFormData({ ...formData, customer_location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>
                  <Image className="h-4 w-4 inline mr-2" />
                  Imagen del Testimonio *
                </Label>
                
                <div className="space-y-3">
                  {/* Opción 1: Cargar archivo */}
                  <div className="space-y-2">
                    <Label htmlFor="image_file" className="text-sm font-medium">
                      <Upload className="h-4 w-4 inline mr-2" />
                      Cargar archivo de imagen
                    </Label>
                    <Input
                      id="image_file"
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
                    <Label htmlFor="image_url" className="text-sm font-medium">
                      URL de imagen externa
                    </Label>
                    <Input
                      id="image_url"
                      type="url"
                      placeholder="https://ejemplo.com/captura-mensaje.jpg"
                      value={formData.image_url}
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
                        setFormData({ ...formData, image_url: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Orden de Visualización</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Testimonio activo (visible en la galería)</Label>
              </div>
            </form>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" onClick={handleSubmit}>
                {editingTestimonial ? 'Actualizar' : 'Crear'} Testimonio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando testimonios...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Activos ({testimonials.filter(t => t.is_active).length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactivos ({testimonials.filter(t => !t.is_active).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Todos ({testimonials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <TestimonialsGrid 
              testimonials={testimonials.filter(t => t.is_active)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          </TabsContent>

          <TabsContent value="inactive">
            <TestimonialsGrid 
              testimonials={testimonials.filter(t => !t.is_active)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          </TabsContent>

          <TabsContent value="all">
            <TestimonialsGrid 
              testimonials={testimonials}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function TestimonialsGrid({ 
  testimonials, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: {
  testimonials: CustomerTestimonial[];
  onEdit: (testimonial: CustomerTestimonial) => void;
  onDelete: (id: string) => void;
  onToggleActive: (testimonial: CustomerTestimonial) => void;
}) {
  if (testimonials.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No hay testimonios</h3>
        <p className="text-muted-foreground">
          Los testimonios que agregues aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <Card key={testimonial.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {testimonial.customer_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {testimonial.customer_location}
                </CardDescription>
              </div>
              <Badge variant={testimonial.is_active ? "default" : "secondary"}>
                {testimonial.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="space-y-3">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={testimonial.image_url}
                  alt={`Testimonio de ${testimonial.customer_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Orden: {testimonial.display_order}</span>
                <span>{new Date(testimonial.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t">
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(testimonial)}
                className="flex-1"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Editar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(testimonial)}
                className="flex-1"
              >
                {testimonial.is_active ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Mostrar
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar testimonio?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El testimonio de{" "}
                      <strong>{testimonial.customer_name}</strong> será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(testimonial.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}