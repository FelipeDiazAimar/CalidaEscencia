export interface TempImageData {
  id: string;
  file: File;
  previewUrl: string;
  type: 'cover' | 'hover' | 'gallery';
  index?: number;
}

export class TempImageStore {
  private static instance: TempImageStore;
  private images: Map<string, TempImageData> = new Map();

  static getInstance(): TempImageStore {
    if (!TempImageStore.instance) {
      TempImageStore.instance = new TempImageStore();
    }
    return TempImageStore.instance;
  }

  // Agregar imagen temporal
  addImage(data: TempImageData): void {
    this.images.set(data.id, data);
    console.log(`📁 Imagen temporal agregada: ${data.id}`);
  }

  // Obtener imagen temporal
  getImage(id: string): TempImageData | undefined {
    return this.images.get(id);
  }

  // Obtener todas las imágenes temporales
  getAllImages(): TempImageData[] {
    return Array.from(this.images.values());
  }

  // Eliminar imagen temporal
  removeImage(id: string): void {
    const image = this.images.get(id);
    if (image) {
      // Liberar la URL del blob para evitar memory leaks
      URL.revokeObjectURL(image.previewUrl);
      this.images.delete(id);
      console.log(`🗑️ Imagen temporal eliminada: ${id}`);
    }
  }

  // Limpiar todas las imágenes temporales
  clearAll(): void {
    this.images.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });
    this.images.clear();
    console.log('🧹 Todas las imágenes temporales eliminadas');
  }

  // Generar ID único para imagen temporal
  generateTempId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Verificar si una URL es temporal
  static isTempUrl(url: string): boolean {
    // Un ID temporal es solo números y letras con guiones bajos, sin prefijo
    // Formato: 1758712026022_o4x2rmcex
    return /^\d+_[a-z0-9]+$/.test(url) || url.startsWith('blob:');
  }

  // Method to get all temp images
  getAllTempImages(): Map<string, TempImageData> {
    return this.images;
  }

  // Clean up any malformed temp IDs with double prefix
  cleanupMalformedIds(): void {
    console.log('🧹 TempImageStore: cleaning up malformed IDs...');
    const malformedIds: string[] = [];
    
    this.images.forEach((data, id) => {
      if (id.startsWith('temp_temp_')) {
        malformedIds.push(id);
      }
    });
    
    malformedIds.forEach(malformedId => {
      const cleanId = malformedId.replace('temp_temp_', '');
      const tempData = this.images.get(malformedId);
      
      if (tempData && !this.images.has(cleanId)) {
        console.log(`🧹 Moving malformed ID ${malformedId} to clean ID ${cleanId}`);
        this.images.set(cleanId, tempData);
      }
      
      console.log(`🗑️ Removing malformed ID: ${malformedId}`);
      const data = this.images.get(malformedId);
      if (data?.previewUrl && data.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(data.previewUrl);
      }
      this.images.delete(malformedId);
    });
    
    console.log('✅ TempImageStore: cleanup completed');
  }
}

export const tempImageStore = TempImageStore.getInstance();