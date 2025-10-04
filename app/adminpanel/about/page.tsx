'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/products';
import type { AboutContent, AboutContentInsert, AboutContentUpdate } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit, Plus, Eye, EyeOff, Info, ArrowUp, ArrowDown, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AboutAdminPage() {
  const [aboutSections, setAboutSections] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AboutContent | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState<AboutContentInsert>({
    section_type: 'mission',
    title: '',
    subtitle: '',
    content: '',
    image_url: '',
    background_image_url: '',
    extra_data: {},
    is_active: true,
    display_order: 0,
  });

  // Estados específicos para secciones complejas
  const [shippingData, setShippingData] = useState({
    national: {
      title: 'Envíos Nacionales (El Salvador)',
      delivery_time: '2-3 días hábiles',
      cost: '$3.50 tarifa estándar',
      packaging: 'Tus joyas viajan seguras en nuestro empaque de regalo'
    },
    international: {
      title: 'Envíos Internacionales',
      description: '¿Vives fuera de El Salvador? ¡No hay problema! Contáctanos directamente por WhatsApp para cotizar tu envío a cualquier parte del mundo.'
    }
  });

  const [paymentMethods, setPaymentMethods] = useState([
    'Tarjetas de Crédito/Débito',
    'Transferencia Bancaria',
    'Pago Contra Entrega (San Salvador)'
  ]);

  const [returnsPolicyData, setReturnsPolicyData] = useState({
    title: 'Política de Cambios y Devoluciones',
    rules: [
      'Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.',
      'La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.',
      'Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.',
      'Para iniciar el proceso, simplemente contáctanos con tu número de orden.'
    ]
  });

  const loadAboutSections = async () => {
    setLoading(true);
    try {
      const response = await api.aboutContent.getAll();
      if (response.success && response.data) {
        setAboutSections(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al cargar las secciones",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading about sections:', error);
      toast({
        title: "Error",
        description: "Error al cargar las secciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutSections();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'background') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear URL when file is selected
      setFormData({ ...formData, image_url: '' });
    } else {
      setBackgroundImageFile(file);
      setBackgroundImagePreview(URL.createObjectURL(file));
      // Clear URL when file is selected
      setFormData({ ...formData, background_image_url: '' });
    }
  };

  const prepareSectionData = (): AboutContentInsert | AboutContentUpdate => {
    let extra_data = {};

    switch (formData.section_type) {
      case 'shipping':
        extra_data = shippingData;
        break;
      case 'payment':
        extra_data = { methods: paymentMethods };
        break;
      case 'returns':
        extra_data = { policy: returnsPolicyData };
        break;
    }

    return {
      ...formData,
      image_url: imagePreview || formData.image_url,
      background_image_url: backgroundImagePreview || formData.background_image_url,
      extra_data,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      const sectionData = prepareSectionData();

      let response;
      if (editingSection) {
        response = await api.aboutContent.update(editingSection.id, sectionData as AboutContentUpdate);
      } else {
        response = await api.aboutContent.create(sectionData as AboutContentInsert);
      }

      if (response.success) {
        toast({
          title: "Éxito",
          description: editingSection 
            ? "Sección actualizada correctamente" 
            : "Sección creada correctamente",
        });
        resetForm();
        loadAboutSections();
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al guardar la sección",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "Error",
        description: "Error al guardar la sección",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (section: AboutContent) => {
    setEditingSection(section);
    setFormData({
      section_type: section.section_type,
      title: section.title,
      subtitle: section.subtitle || '',
      content: section.content || '',
      image_url: section.image_url || '',
      background_image_url: section.background_image_url || '',
      extra_data: section.extra_data || {},
      is_active: section.is_active,
      display_order: section.display_order,
    });

    // Configurar datos específicos de sección
    if (section.extra_data) {
      if (section.section_type === 'shipping' && section.extra_data.national) {
        setShippingData(section.extra_data as any);
      } else if (section.section_type === 'payment' && section.extra_data.methods) {
        setPaymentMethods(section.extra_data.methods);
      } else if (section.section_type === 'returns' && section.extra_data.policy) {
        setReturnsPolicyData(section.extra_data.policy);
      }
    }

    setImagePreview(section.image_url || null);
    setBackgroundImagePreview(section.background_image_url || null);
    setImageFile(null);
    setBackgroundImageFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sección?')) return;

    try {
      const response = await api.aboutContent.delete(id);
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Sección eliminada correctamente",
        });
        loadAboutSections();
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al eliminar la sección",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la sección",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (section: AboutContent) => {
    try {
      const response = section.is_active 
        ? await api.aboutContent.deactivate(section.id)
        : await api.aboutContent.activate(section.id);

      if (response.success) {
        toast({
          title: "Éxito",
          description: `Sección ${section.is_active ? 'desactivada' : 'activada'} correctamente`,
        });
        loadAboutSections();
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al cambiar el estado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingSection(null);
    setImagePreview(null);
    setBackgroundImagePreview(null);
    setImageFile(null);
    setBackgroundImageFile(null);
    setFormData({
      section_type: 'hero',
      title: '',
      subtitle: '',
      content: '',
      image_url: '',
      background_image_url: '',
      extra_data: {},
      is_active: true,
      display_order: 0,
    });
    setShippingData({
      national: {
        title: 'Envíos Nacionales (El Salvador)',
        delivery_time: '2-3 días hábiles',
        cost: '$3.50 tarifa estándar',
        packaging: 'Tus joyas viajan seguras en nuestro empaque de regalo'
      },
      international: {
        title: 'Envíos Internacionales',
        description: '¿Vives fuera de El Salvador? ¡No hay problema! Contáctanos directamente por WhatsApp para cotizar tu envío a cualquier parte del mundo.'
      }
    });
    setPaymentMethods([
      'Tarjetas de Crédito/Débito',
      'Transferencia Bancaria',
      'Pago Contra Entrega (San Salvador)'
    ]);
    setReturnsPolicyData({
      title: 'Política de Cambios y Devoluciones',
      rules: [
        'Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.',
        'La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.',
        'Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.',
        'Para iniciar el proceso, simplemente contáctanos con tu número de orden.'
      ]
    });
  };

  const getSectionTypeLabel = (type: string) => {
    const labels = {
      hero: 'Hero/Encabezado',
      mission: 'Sección Principal',
      shipping: 'Envíos',
      payment: 'Métodos de Pago',
      returns: 'Devoluciones'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Filter sections based on current tab
  const filteredSections = aboutSections.filter(section => {
    switch (currentTab) {
      case 'active':
        return section.is_active;
      case 'inactive':
        return !section.is_active;
      case 'all':
      default:
        return true;
    }
  });

  // Count sections for tabs
  const activeSections = aboutSections.filter(s => s.is_active);
  const inactiveSections = aboutSections.filter(s => !s.is_active);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando secciones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Sobre Nosotros</h1>
          <p className="text-muted-foreground">
            Administra el contenido de la página "Sobre Nosotros"
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Sección
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Editar Sección' : 'Nueva Sección'}
              </DialogTitle>
              <DialogDescription>
                {editingSection 
                  ? 'Modifica los datos de la sección' 
                  : 'Agrega una nueva sección a la página Sobre Nosotros'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section_type">Tipo de Sección *</Label>
                  <Select 
                    value={formData.section_type} 
                    onValueChange={(value: any) => setFormData({ ...formData, section_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero/Encabezado</SelectItem>
                      <SelectItem value="mission">Sección Principal</SelectItem>
                      <SelectItem value="shipping">Envíos</SelectItem>
                      <SelectItem value="payment">Métodos de Pago</SelectItem>
                      <SelectItem value="returns">Devoluciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Orden de Visualización</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título de la sección"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Subtítulo de la sección"
                />
              </div>

              {(formData.section_type === 'hero' || formData.section_type === 'mission') && (
                <div className="space-y-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Contenido de la sección"
                  />
                </div>
              )}

              {/* Campos específicos para diferentes tipos de secciones */}
              {formData.section_type === 'shipping' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información de Envíos</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Envíos Nacionales</h4>
                      <Input
                        placeholder="Título"
                        value={shippingData.national.title}
                        onChange={(e) => setShippingData({
                          ...shippingData,
                          national: { ...shippingData.national, title: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Tiempo de entrega"
                        value={shippingData.national.delivery_time}
                        onChange={(e) => setShippingData({
                          ...shippingData,
                          national: { ...shippingData.national, delivery_time: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Costo"
                        value={shippingData.national.cost}
                        onChange={(e) => setShippingData({
                          ...shippingData,
                          national: { ...shippingData.national, cost: e.target.value }
                        })}
                      />
                      <Textarea
                        placeholder="Información del empaque"
                        value={shippingData.national.packaging}
                        onChange={(e) => setShippingData({
                          ...shippingData,
                          national: { ...shippingData.national, packaging: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Envíos Internacionales</h4>
                      <Input
                        placeholder="Título"
                        value={shippingData.international.title}
                        onChange={(e) => setShippingData({
                          ...shippingData,
                          international: { ...shippingData.international, title: e.target.value }
                        })}
                      />
                      <Textarea
                        placeholder="Descripción"
                        value={shippingData.international.description}
                        onChange={(e) => setShippingData({
                          ...shippingData,
                          international: { ...shippingData.international, description: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.section_type === 'payment' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Métodos de Pago</h3>
                  <div className="space-y-2">
                    {paymentMethods.map((method, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={method}
                          onChange={(e) => {
                            const newMethods = [...paymentMethods];
                            newMethods[index] = e.target.value;
                            setPaymentMethods(newMethods);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newMethods = paymentMethods.filter((_, i) => i !== index);
                            setPaymentMethods(newMethods);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPaymentMethods([...paymentMethods, ''])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar método
                    </Button>
                  </div>
                </div>
              )}

              {formData.section_type === 'returns' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Política de Devoluciones</h3>
                  <div className="space-y-2">
                    <Input
                      placeholder="Título de la política"
                      value={returnsPolicyData.title}
                      onChange={(e) => setReturnsPolicyData({
                        ...returnsPolicyData,
                        title: e.target.value
                      })}
                    />
                    {returnsPolicyData.rules.map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={rule}
                          onChange={(e) => {
                            const newRules = [...returnsPolicyData.rules];
                            newRules[index] = e.target.value;
                            setReturnsPolicyData({
                              ...returnsPolicyData,
                              rules: newRules
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newRules = returnsPolicyData.rules.filter((_, i) => i !== index);
                            setReturnsPolicyData({
                              ...returnsPolicyData,
                              rules: newRules
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReturnsPolicyData({
                        ...returnsPolicyData,
                        rules: [...returnsPolicyData.rules, '']
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar regla
                    </Button>
                  </div>
                </div>
              )}

              {/* Imagen principal */}
              {(['hero', 'mission'].includes(formData.section_type)) && (
                <div className="space-y-4">
                  <Label>
                    <Image className="h-4 w-4 inline mr-2" />
                    Imagen Principal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Puedes usar una URL de imagen o subir un archivo. Solo se puede usar uno a la vez.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL de la imagen"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          // Clear file when URL is entered
                          if (e.target.value) {
                            setImageFile(null);
                            setImagePreview(null);
                          }
                        }}
                        className="flex-1"
                      />
                      {formData.image_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-center text-muted-foreground">o</div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="flex-1"
                      />
                      {imageFile && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Imagen de fondo */}
              {(['shipping', 'payment', 'returns'].includes(formData.section_type)) && (
                <div className="space-y-4">
                  <Label>
                    <Image className="h-4 w-4 inline mr-2" />
                    Imagen de Fondo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Puedes usar una URL de imagen o subir un archivo. Solo se puede usar uno a la vez.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL de la imagen de fondo"
                        value={formData.background_image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, background_image_url: e.target.value });
                          // Clear file when URL is entered
                          if (e.target.value) {
                            setBackgroundImageFile(null);
                            setBackgroundImagePreview(null);
                          }
                        }}
                        className="flex-1"
                      />
                      {formData.background_image_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, background_image_url: '' })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-center text-muted-foreground">o</div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'background')}
                        className="flex-1"
                      />
                      {backgroundImageFile && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBackgroundImageFile(null);
                            setBackgroundImagePreview(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {backgroundImagePreview && (
                    <div className="mt-2">
                      <img
                        src={backgroundImagePreview}
                        alt="Vista previa fondo"
                        className="w-32 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSection ? 'Actualizar' : 'Crear'} Sección
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de secciones */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setCurrentTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({aboutSections.length})
          </button>
          <button
            onClick={() => setCurrentTab('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Activos ({activeSections.length})
          </button>
          <button
            onClick={() => setCurrentTab('inactive')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'inactive'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Inactivos ({inactiveSections.length})
          </button>
        </div>

        {/* Grid de secciones */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSections.map((section) => (
          <Card key={section.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {getSectionTypeLabel(section.section_type)}
                    </Badge>
                    <Badge variant={section.is_active ? "default" : "secondary"}>
                      {section.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{section.title}</CardTitle>
                  {section.subtitle && (
                    <CardDescription className="line-clamp-2">{section.subtitle}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {section.content && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {section.content}
                </p>
              )}

              {(section.image_url || section.background_image_url) && (
                <div className="flex gap-2">
                  {section.image_url && (
                    <img
                      src={section.image_url}
                      alt="Imagen"
                      className="w-16 h-12 object-cover rounded border"
                    />
                  )}
                  {section.background_image_url && (
                    <img
                      src={section.background_image_url}
                      alt="Fondo"
                      className="w-16 h-12 object-cover rounded border"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Orden: {section.display_order}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(section)}
                    title={section.is_active ? "Ocultar sección" : "Mostrar sección"}
                  >
                    {section.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(section)}
                    title="Editar sección"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {currentTab === 'all' ? 'No hay secciones creadas' : 
               currentTab === 'active' ? 'No hay secciones activas' : 
               'No hay secciones inactivas'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {currentTab === 'all' 
                ? 'Comienza agregando la primera sección para la página Sobre Nosotros'
                : `No hay secciones ${currentTab === 'active' ? 'activas' : 'inactivas'} en este momento`
              }
            </p>
            {currentTab === 'all' && (
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primera sección
              </Button>
            )}
          </div>
        )}
      </div>

      {aboutSections.length === 0 && (
        <div className="text-center py-12">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay secciones creadas</h3>
          <p className="text-muted-foreground mb-4">
            Comienza agregando la primera sección para la página Sobre Nosotros
          </p>
          <Button onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primera sección
          </Button>
        </div>
      )}
    </div>
  );
}