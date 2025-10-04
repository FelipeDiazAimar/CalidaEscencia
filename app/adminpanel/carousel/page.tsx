"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Upload, Eye, Trash2, Edit, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from '@/lib/api/products';
import type { CarouselImage } from '@/types/database';
import ImagePreview from '@/components/ui/image-preview';

export default function AdminCarouselPage() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
    
    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        alt_text: '',
        image_url: '',
        link_url: '',
        is_active: true
    });

    // Load images from Supabase API
    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        setIsLoading(true);
        try {
            const response = await api.carouselImages.getAll();
            if (response.success && response.data) {
                setImages(response.data);
            } else {
                toast.error('Error al cargar las imágenes del carrusel');
            }
        } catch (error) {
            console.error('Error loading carousel images:', error);
            toast.error('Error al cargar las imágenes del carrusel');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            alt_text: '',
            image_url: '',
            link_url: '',
            is_active: true
        });
    };

    // Create new image
    const handleCreate = async () => {
        if (!formData.image_url || !formData.title) {
            toast.error('URL de imagen y título son obligatorios');
            return;
        }

        try {
            const newCarouselImage = {
                ...formData,
                alt_text: formData.alt_text || formData.title,
                order_index: images.length + 1
            };

            const response = await api.carouselImages.create(newCarouselImage);
            
            if (response.success) {
                await loadImages();
                resetForm();
                setIsAddDialogOpen(false);
                toast.success('Imagen agregada al carrusel');
            } else {
                toast.error('Error al crear la imagen');
            }
        } catch (error) {
            console.error('Error creating carousel image:', error);
            toast.error('Error al crear la imagen');
        }
    };

    // Edit image
    const handleEdit = (image: CarouselImage) => {
        setEditingImage(image);
        setFormData({
            title: image.title,
            description: image.description || '',
            alt_text: image.alt_text || '',
            image_url: image.image_url,
            link_url: image.link_url || '',
            is_active: image.is_active
        });
        setIsEditDialogOpen(true);
    };

    // Update image
    const handleUpdate = async () => {
        if (!editingImage || !formData.image_url || !formData.title) {
            toast.error('URL de imagen y título son obligatorios');
            return;
        }

        try {
            const updateData = {
                ...formData,
                alt_text: formData.alt_text || formData.title
            };

            const response = await api.carouselImages.update(editingImage.id, updateData);
            
            if (response.success) {
                await loadImages();
                resetForm();
                setIsEditDialogOpen(false);
                setEditingImage(null);
                toast.success('Imagen actualizada');
            } else {
                toast.error('Error al actualizar la imagen');
            }
        } catch (error) {
            console.error('Error updating carousel image:', error);
            toast.error('Error al actualizar la imagen');
        }
    };

    // Delete image
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
            return;
        }

        try {
            const response = await api.carouselImages.delete(id);
            
            if (response.success) {
                await loadImages();
                toast.success('Imagen eliminada');
            } else {
                toast.error('Error al eliminar la imagen');
            }
        } catch (error) {
            console.error('Error deleting carousel image:', error);
            toast.error('Error al eliminar la imagen');
        }
    };

    // Toggle active status
    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const response = await api.carouselImages.update(id, { is_active: !currentStatus });
            
            if (response.success) {
                await loadImages();
                toast.success(`Imagen ${!currentStatus ? 'activada' : 'desactivada'}`);
            } else {
                toast.error('Error al cambiar el estado de la imagen');
            }
        } catch (error) {
            console.error('Error toggling image status:', error);
            toast.error('Error al cambiar el estado de la imagen');
        }
    };

    // Move image order
    const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
        const imageIndex = images.findIndex(img => img.id === id);
        if (imageIndex === -1) return;

        const targetIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return;

        try {
            const image = images[imageIndex];
            const targetImage = images[targetIndex];

            // Update both images' order_index
            await api.carouselImages.update(image.id, { order_index: targetImage.order_index });
            await api.carouselImages.update(targetImage.id, { order_index: image.order_index });
            
            await loadImages();
            toast.success('Orden actualizado');
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Error al actualizar el orden');
        }
    };

    const stats = {
        total: images.length,
        active: images.filter(img => img.is_active).length,
        inactive: images.filter(img => !img.is_active).length
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Carrusel</h1>
                    <p className="text-muted-foreground">Administra las imágenes del carrusel principal</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Imagen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Agregar Nueva Imagen</DialogTitle>
                            <DialogDescription>
                                Agrega una nueva imagen al carrusel principal
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <ImagePreview
                                    label="Imagen del Carrusel *"
                                    value={formData.image_url}
                                    onChange={(url) => setFormData({...formData, image_url: url})}
                                    aspectRatio="16:9"
                                    placeholder="Sube una imagen para el carrusel o ingresa una URL"
                                />
                            </div>
                            <div>
                                <Label htmlFor="title">Título *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Título de la imagen"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Descripción de la imagen"
                                />
                            </div>
                            <div>
                                <Label htmlFor="alt_text">Texto Alternativo</Label>
                                <Input
                                    id="alt_text"
                                    value={formData.alt_text}
                                    onChange={(e) => setFormData({...formData, alt_text: e.target.value})}
                                    placeholder="Texto alternativo para accesibilidad"
                                />
                            </div>
                            <div>
                                <Label htmlFor="link_url">Enlace (opcional)</Label>
                                <Input
                                    id="link_url"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                                    placeholder="https://ejemplo.com/enlace"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                                />
                                <Label htmlFor="is_active">Imagen activa</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleCreate} className="flex-1">
                                    Agregar Imagen
                                </Button>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
                        <CardDescription>Total de Imágenes</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold text-green-600">{stats.active}</CardTitle>
                        <CardDescription>Imágenes Activas</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold text-gray-500">{stats.inactive}</CardTitle>
                        <CardDescription>Imágenes Inactivas</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Images Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Imágenes del Carrusel</CardTitle>
                    <CardDescription>
                        Gestiona las imágenes que aparecen en el carrusel principal
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-4">Cargando imágenes...</p>
                    ) : images.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">
                            No hay imágenes en el carrusel. Agrega la primera imagen.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Orden</TableHead>
                                    <TableHead className="w-24">Imagen</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="w-16">Estado</TableHead>
                                    <TableHead className="w-32">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {images
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((image, index) => (
                                    <TableRow key={image.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-mono">{image.order_index}</span>
                                                <div className="flex flex-col">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMoveOrder(image.id, 'up')}
                                                        disabled={index === 0}
                                                        className="h-4 p-0"
                                                    >
                                                        <ArrowUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMoveOrder(image.id, 'down')}
                                                        disabled={index === images.length - 1}
                                                        className="h-4 p-0"
                                                    >
                                                        <ArrowDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <img
                                                src={image.image_url}
                                                alt={image.alt_text || image.title}
                                                className="w-16 h-12 object-cover rounded"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://via.placeholder.com/160x120?text=Error';
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{image.title}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {image.description || 'Sin descripción'}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={image.is_active}
                                                onCheckedChange={() => handleToggleActive(image.id, image.is_active)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(image)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(image.id)}
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
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Imagen</DialogTitle>
                        <DialogDescription>
                            Modifica los datos de la imagen del carrusel
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <ImagePreview
                                label="Imagen del Carrusel *"
                                value={formData.image_url}
                                onChange={(url) => setFormData({...formData, image_url: url})}
                                aspectRatio="16:9"
                                placeholder="Sube una imagen para el carrusel o ingresa una URL"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_title">Título *</Label>
                            <Input
                                id="edit_title"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Título de la imagen"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_description">Descripción</Label>
                            <Textarea
                                id="edit_description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Descripción de la imagen"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_alt_text">Texto Alternativo</Label>
                            <Input
                                id="edit_alt_text"
                                value={formData.alt_text}
                                onChange={(e) => setFormData({...formData, alt_text: e.target.value})}
                                placeholder="Texto alternativo para accesibilidad"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_link_url">Enlace (opcional)</Label>
                            <Input
                                id="edit_link_url"
                                value={formData.link_url}
                                onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                                placeholder="https://ejemplo.com/enlace"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit_is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                            />
                            <Label htmlFor="edit_is_active">Imagen activa</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleUpdate} className="flex-1">
                                Guardar Cambios
                            </Button>
                            <Button variant="outline" onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingImage(null);
                                resetForm();
                            }}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}