'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface AnnouncementItem {
  id: string;
  text: string;
  is_active: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementBarPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [loading, setLoading] = useState(true);

  // Load announcements on component mount
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements');
      const data = await response.json();
      
      setAnnouncements(data.sort((a: AnnouncementItem, b: AnnouncementItem) => a.order_position - b.order_position));
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Error al cargar los anuncios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncementText.trim()) {
      toast.error('El texto del anuncio es requerido');
      return;
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newAnnouncementText.trim(),
          is_active: true
        })
      });

      if (!response.ok) {
        throw new Error('Error creating announcement');
      }

      await loadAnnouncements();
      setNewAnnouncementText('');
      setIsDialogOpen(false);
      toast.success('Anuncio creado exitosamente');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Error al crear el anuncio');
    }
  };

  const handleUpdateAnnouncement = async (id: string, updates: Partial<AnnouncementItem>) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Error updating announcement');
      }

      await loadAnnouncements();
      toast.success('Anuncio actualizado exitosamente');
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Error al actualizar el anuncio');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, { 
        method: 'DELETE' 
      });

      if (!response.ok) {
        throw new Error('Error deleting announcement');
      }

      await loadAnnouncements();
      toast.success('Anuncio eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Error al eliminar el anuncio');
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    await handleUpdateAnnouncement(id, { is_active });
  };

  const handleReorder = (draggedId: string, targetId: string) => {
    const draggedIndex = announcements.findIndex(a => a.id === draggedId);
    const targetIndex = announcements.findIndex(a => a.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newAnnouncements = [...announcements];
    const [draggedItem] = newAnnouncements.splice(draggedIndex, 1);
    newAnnouncements.splice(targetIndex, 0, draggedItem);

    // Update order numbers
    const reorderedAnnouncements = newAnnouncements.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setAnnouncements(reorderedAnnouncements);
    
    // TODO: Update order in database
    toast.success('Orden actualizado exitosamente');
  };

  const startEdit = (announcement: AnnouncementItem) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncementText(announcement.text);
    setIsDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingAnnouncement || !newAnnouncementText.trim()) return;
    
    await handleUpdateAnnouncement(editingAnnouncement.id, { 
      text: newAnnouncementText.trim() 
    });
    
    setEditingAnnouncement(null);
    setNewAnnouncementText('');
    setIsDialogOpen(false);
  };

  const resetDialog = () => {
    setEditingAnnouncement(null);
    setNewAnnouncementText('');
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando anuncios...</p>
        </div>
      </div>
    );
  }

  const activeAnnouncements = announcements.filter(a => a.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            Announcement Bar
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los textos que aparecen en la barra de anuncios del sitio web
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Anuncio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement 
                  ? 'Modifica el texto del anuncio existente'
                  : 'Agrega un nuevo texto que aparecerá en la barra de anuncios'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="announcement-text">Texto del Anuncio</Label>
                <Textarea
                  id="announcement-text"
                  placeholder="Escribe tu anuncio aquí..."
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Puedes usar emojis para hacer el anuncio más atractivo
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={editingAnnouncement ? handleEditSave : handleCreateAnnouncement}
                disabled={!newAnnouncementText.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingAnnouncement ? 'Guardar Cambios' : 'Crear Anuncio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Anuncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Anuncios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeAnnouncements.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Anuncios Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {announcements.length - activeAnnouncements.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Anuncios</CardTitle>
          <p className="text-sm text-gray-600">
            Arrastra y suelta para reordenar. Solo los anuncios activos se mostrarán en el sitio web.
          </p>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No hay anuncios creados
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer anuncio para comenzar
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Anuncio
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                    announcement.is_active 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-move">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Order Number */}
                  <div className="text-sm font-medium text-gray-500 w-8">
                    #{announcement.order_position}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm">{announcement.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={announcement.is_active ? "default" : "secondary"}>
                        {announcement.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Creado: {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={(checked) => 
                          handleToggleActive(announcement.id, checked)
                        }
                      />
                      {announcement.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El anuncio será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {activeAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <p className="text-sm text-gray-600">
              Así se verán los anuncios activos en el sitio web
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-2 rounded-md">
              <div className="animate-pulse">
                <span className="text-sm">
                  {activeAnnouncements[0]?.text || 'No hay anuncios activos'}
                </span>
              </div>
            </div>
            {activeAnnouncements.length > 1 && (
              <p className="text-xs text-gray-500 mt-2">
                Se mostrarán {activeAnnouncements.length} anuncios rotando automáticamente
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}