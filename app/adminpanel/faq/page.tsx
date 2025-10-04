
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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, HelpCircle, Eye, EyeOff, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/products';
import type { FAQ } from '@/types/database';

// FAQ Categories
const FAQ_CATEGORIES = [
  'general',
  'productos',
  'pedidos',
  'envios',
  'pagos',
  'cuidados',
  'otros'
];

const CATEGORY_NAMES = {
  general: 'General',
  productos: 'Productos',
  pedidos: 'Pedidos',
  envios: 'Envíos',
  pagos: 'Pagos',
  cuidados: 'Cuidado y Mantenimiento',
  otros: 'Otros'
};

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    is_active: true
  });

  // Load FAQs from Supabase on component mount
  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setIsLoading(true);
    try {
      const response = await api.faqs.getAll();
      if (response.success && response.data) {
        setFaqs(response.data);
      } else {
        toast.error(response.error || 'Error al cargar las FAQs');
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast.error('Error al cargar las FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.question.trim()) {
      toast.error('La pregunta es requerida');
      return;
    }
    if (!formData.answer.trim()) {
      toast.error('La respuesta es requerida');
      return;
    }

    setIsSaving(true);
    try {
      if (editingFaq) {
        // Update existing FAQ
        const response = await api.faqs.update(editingFaq.id, {
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category,
          is_active: formData.is_active
        });
        
        if (response.success && response.data) {
          setFaqs(faqs.map(faq => 
            faq.id === editingFaq.id ? response.data! : faq
          ));
          toast.success('Pregunta frecuente actualizada correctamente');
        } else {
          toast.error(response.error || 'Error al actualizar la pregunta');
          return;
        }
      } else {
        // Create new FAQ
        const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order_index)) : 0;
        const response = await api.faqs.create({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category,
          is_active: formData.is_active,
          order_index: maxOrder + 1
        });
        
        if (response.success && response.data) {
          setFaqs([...faqs, response.data]);
          toast.success('Pregunta frecuente creada correctamente');
        } else {
          toast.error(response.error || 'Error al crear la pregunta');
          return;
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Error al guardar la pregunta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_active: faq.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta pregunta frecuente?')) {
      try {
        const response = await api.faqs.delete(id);
        
        if (response.success) {
          setFaqs(faqs.filter(faq => faq.id !== id));
          toast.success('Pregunta frecuente eliminada correctamente');
        } else {
          toast.error(response.error || 'Error al eliminar la pregunta');
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        toast.error('Error al eliminar la pregunta');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const faq = faqs.find(f => f.id === id);
      if (!faq) return;

      const response = await api.faqs.update(id, {
        is_active: !faq.is_active
      });

      if (response.success && response.data) {
        setFaqs(faqs.map(f => 
          f.id === id ? response.data! : f
        ));
        toast.success('Estado actualizado correctamente');
      } else {
        toast.error(response.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const faqIndex = faqs.findIndex(f => f.id === id);
    if (faqIndex === -1) return;

    const targetIndex = direction === 'up' ? faqIndex - 1 : faqIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    try {
      // Crear una copia del array con el nuevo orden
      const newFaqs = [...faqs];
      [newFaqs[faqIndex], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[faqIndex]];
      
      // Actualizar order_index en base a la nueva posición
      const faqToUpdate = newFaqs[targetIndex];
      const newOrderIndex = targetIndex + 1;
      
      const response = await api.faqs.updateOrder(faqToUpdate.id, newOrderIndex);
      
      if (response.success) {
        // Refrescar la lista desde la base de datos
        await loadFaqs();
        toast.success('Orden actualizado correctamente');
      } else {
        toast.error('Error al actualizar el orden');
      }
    } catch (error) {
      console.error('Error reordering FAQs:', error);
      toast.error('Error al actualizar el orden');
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      is_active: true
    });
    setEditingFaq(null);
    setIsDialogOpen(false);
  };

  // Filter FAQs by category
  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  // Sort FAQs by order
  const sortedFaqs = [...filteredFaqs].sort((a, b) => a.order_index - b.order_index);

  // Group FAQs by category for preview
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!faq.is_active) return acc;
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  // Calculate stats
  const totalFaqs = faqs.length;
  const activeFaqs = faqs.filter(f => f.is_active).length;
  const faqsByCategories = FAQ_CATEGORIES.map(cat => ({
    category: cat,
    name: CATEGORY_NAMES[cat as keyof typeof CATEGORY_NAMES],
    count: faqs.filter(f => f.category === cat).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Preguntas Frecuentes</h1>
          <p className="text-muted-foreground">Administra las preguntas frecuentes de tu sitio web</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Vista Admin
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </>
            )}
          </Button>
          
          {!previewMode && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Pregunta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingFaq ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingFaq ? 'Modifica la información de la pregunta frecuente' : 'Crea una nueva pregunta frecuente'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {FAQ_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="question">Pregunta</Label>
                    <Input
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Ingresa la pregunta"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="answer">Respuesta</Label>
                    <Textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Ingresa la respuesta detallada"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Pregunta activa (visible al público)</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingFaq ? 'Actualizar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {!previewMode ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFaqs}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FAQs Activas</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeFaqs}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FAQs Inactivas</CardTitle>
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalFaqs - activeFaqs}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{FAQ_CATEGORIES.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 items-center flex-wrap">
            <Label>Filtrar por categoría:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {FAQ_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FAQs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Pregunta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFaqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay preguntas frecuentes{selectedCategory !== 'all' ? ` en la categoría "${CATEGORY_NAMES[selectedCategory as keyof typeof CATEGORY_NAMES]}"` : ''}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFaqs.map((faq, index) => (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">{faq.order_index}</span>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(faq.id, 'up')}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(faq.id, 'down')}
                              disabled={index === sortedFaqs.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="font-medium truncate">{faq.question}</div>
                          <div className="text-sm text-muted-foreground truncate mt-1">
                            {faq.answer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_NAMES[faq.category as keyof typeof CATEGORY_NAMES]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(faq.id)}
                          className={faq.is_active ? 'text-green-600' : 'text-red-600'}
                        >
                          {faq.is_active ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Inactiva
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {faq.updated_at ? new Date(faq.updated_at).toLocaleDateString('es-ES') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(faq.id)}
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
        </>
      ) : (
        /* Preview Mode */
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Vista Previa - Preguntas Frecuentes</h2>
            <p className="text-muted-foreground mb-6">
              Así se verán las preguntas frecuentes en tu sitio web
            </p>
            
            {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="text-muted-foreground">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </div>
            ))}
            
            {Object.keys(faqsByCategory).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay preguntas frecuentes activas para mostrar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
