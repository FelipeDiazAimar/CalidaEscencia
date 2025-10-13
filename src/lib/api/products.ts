// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import { R2Utils } from '@/lib/cloudflare-r2';
import { checkServerEnvVars } from '@/lib/server-env-check';
import type {
  ApiResponse,
  Product,
  ProductInsert,
  ProductUpdate,
  ProductWithDetails,
  Material,
  MaterialInsert,
  MaterialUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  Subcategory,
  SubcategoryInsert,
  SubcategoryUpdate,
  Model,
  ModelInsert,
  ModelUpdate,
  Name,
  NameInsert,
  NameUpdate,
  FAQ,
  FAQInsert,
  FAQUpdate,
  CarouselImage,
  CarouselImageInsert,
  CarouselImageUpdate,
  ProductMaterial,
  ProductMaterialInsert,
  ProductInventory,
  ProductInventoryInsert,
  ProductInventoryUpdate,
  StockMovement,
  StockMovementInsert,
  SaleItem,
  SaleItemInsert,
  SaleItemUpdate,
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItem,
  OrderItemInsert,
  OrderWithItems,
  OrderStatus,
  VistaPrincipal,
  VistaPrincipalInsert,
  VistaPrincipalUpdate,
  CustomerTestimonial,
  CustomerTestimonialInsert,
  CustomerTestimonialUpdate,
  WebsiteMaterial,
  WebsiteMaterialInsert,
  WebsiteMaterialUpdate,
  MaterialsContent,
  MaterialsContentInsert,
  MaterialsContentUpdate,
  AboutContent,
  AboutContentInsert,
  AboutContentUpdate,
  ShippingMethod,
  ShippingMethodInsert,
  ShippingMethodUpdate,
} from '@/types/database';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const handleError = (error: any): string => {
  console.error('API Error:', error);
  
  // Handle different types of errors
  if (error?.message) {
    console.error('Error message:', error.message);
    return error.message;
  }
  
  if (error?.details) {
    console.error('Error details:', error.details);
    return error.details;
  }
  
  if (error?.hint) {
    console.error('Error hint:', error.hint);
    return error.hint;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  console.error('Unknown error type:', typeof error, error);
  return 'An unexpected error occurred';
};

const createResponse = <T>(data: T | null, error: string | null): ApiResponse<T> => ({
  data,
  error,
  success: !error,
});

// Check if Supabase is properly configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const isConfigured = Boolean(
    supabase !== null && 
    url && 
    key && 
    !url.includes('your_supabase_url_here') && 
    !url.includes('your-project-id') &&
    !key.includes('your_supabase_anon_key_here') &&
    !key.includes('your-anon-key')
  );
  
  console.log('🔍 Supabase configuration check:');
  console.log('- Client exists:', supabase !== null);
  console.log('- URL valid:', !!(url && !url.includes('your')));
  console.log('- Key valid:', !!(key && !key.includes('your')));
  console.log('- Final result:', isConfigured);
  
  return isConfigured;
};

// =====================================================
// CATEGORIES API
// =====================================================

export const categoriesApi = {
  // Get all categories
  async getAll(): Promise<ApiResponse<Category[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning fallback categories');
        // Return fallback categories when Supabase is not configured
        const fallbackCategories: Category[] = [
          { id: '1', name: 'Aros', description: 'Aros de diferentes materiales y estilos', order_index: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', name: 'Collares', description: 'Collares y cadenas elegantes', order_index: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', name: 'Anillos', description: 'Anillos para toda ocasión', order_index: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '4', name: 'Pulseras', description: 'Pulseras y brazaletes modernos', order_index: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '5', name: 'Piercings', description: 'Piercings de alta calidad', order_index: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '6', name: 'Accesorios', description: 'Accesorios complementarios', order_index: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ];
        return createResponse(fallbackCategories, null);
      }

      // Try with order_index first, fallback to name ordering if column doesn't exist
      let { data, error } = await supabase!
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true }); // Secondary sort by name

      // If order_index column doesn't exist, try without it
      if (error && error.message?.includes('order_index')) {
        console.log('order_index column not found, falling back to name ordering');
        const fallbackResult = await supabase!
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Category[], handleError(error));
    }
  },

  // Get category by ID
  async getById(id: string): Promise<ApiResponse<Category | null>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create category
  async create(category: CategoryInsert): Promise<ApiResponse<Category | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating category creation');
        // In fallback mode, create a mock category
        const mockCategory: Category = {
          id: Math.random().toString(36).substr(2, 9),
          name: category.name,
          description: category.description || null,
          order_index: category.order_index || 999,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return createResponse(mockCategory, null);
      }

      const { data, error } = await supabase!
        .from('categories')
        .insert(category as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update category
  async update(id: string, updates: CategoryUpdate): Promise<ApiResponse<Category | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating category update');
        // In fallback mode, return a mock updated category
        const mockCategory: Category = {
          id,
          name: updates.name || 'Updated Category',
          description: updates.description || null,
          order_index: updates.order_index || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return createResponse(mockCategory, null);
      }

      const { data, error } = await supabase!
        .from('categories')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update category order
  async updateOrder(categoryOrders: { id: string; order_index: number }[]): Promise<ApiResponse<boolean>> {
    try {
      console.log('🔍 Checking Supabase configuration...');
      const isConfigured = isSupabaseConfigured();
      console.log('🔍 Supabase configured:', isConfigured);
      
      if (!isConfigured) {
        console.log('⚠️ Supabase not configured, simulating order update');
        // In fallback mode, just simulate success
        // The UI will handle the reordering locally
        return createResponse(true, null);
      }

      console.log('🔄 Attempting to update order in Supabase...');
      // Update each category's order_index
      const updatePromises = categoryOrders.map(({ id, order_index }) =>
        supabase!
          .from('categories')
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Update errors:', errors);
        throw new Error(`Failed to update ${errors.length} categories`);
      }

      return createResponse(true, null);
    } catch (error) {
      console.error('❌ updateOrder error:', error);
      return createResponse(false, handleError(error));
    }
  },

  // Delete category
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating category deletion');
        // In fallback mode, just simulate success
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// SUBCATEGORIES API
// =====================================================

export const subcategoriesApi = {
  // Get all subcategories
  async getAll(): Promise<ApiResponse<Subcategory[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning fallback subcategories');
        // Return fallback subcategories when Supabase is not configured
        const fallbackSubcategories: Subcategory[] = [
          // Aros subcategories
          { id: '1', category_id: '1', name: 'Acero quirúrgico', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', category_id: '1', name: 'Acero blanco', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', category_id: '1', name: 'Acero dorado', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '4', category_id: '1', name: 'Plata 925', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          // Collares subcategories
          { id: '5', category_id: '2', name: 'Acero quirúrgico', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '6', category_id: '2', name: 'Acero blanco', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '7', category_id: '2', name: 'Acero dorado', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '8', category_id: '2', name: 'Plata 925', description: 'Material de alta calidad', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          // Piercings subcategories
          { id: '9', category_id: '5', name: 'Titanio', description: 'Material especializado para piercings', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '10', category_id: '5', name: 'Acero quirúrgico', description: 'Material especializado para piercings', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '11', category_id: '5', name: 'Oro blanco', description: 'Material especializado para piercings', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '12', category_id: '5', name: 'Plata', description: 'Material especializado para piercings', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          // Accesorios subcategories
          { id: '13', category_id: '6', name: 'Varios materiales', description: 'Materiales variados para accesorios', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '14', category_id: '6', name: 'Acero inoxidable', description: 'Materiales variados para accesorios', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '15', category_id: '6', name: 'Aleaciones', description: 'Materiales variados para accesorios', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ];
        return createResponse(fallbackSubcategories, null);
      }

      const { data, error } = await supabase!
        .from('subcategories')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Subcategory[], handleError(error));
    }
  },

  // Get subcategories by category
  async getByCategory(categoryId: string): Promise<ApiResponse<Subcategory[]>> {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Subcategory[], handleError(error));
    }
  },

  // Create subcategory
  async create(subcategory: SubcategoryInsert): Promise<ApiResponse<Subcategory | null>> {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert(subcategory as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update subcategory
  async update(id: string, updates: SubcategoryUpdate): Promise<ApiResponse<Subcategory | null>> {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete subcategory
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// MODELS API
// =====================================================

export const modelsApi = {
  // Get all models
  async getAll(): Promise<ApiResponse<Model[]>> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Model[], handleError(error));
    }
  },

  // Get model by ID
  async getById(id: string): Promise<ApiResponse<Model | null>> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create model
  async create(model: ModelInsert): Promise<ApiResponse<Model | null>> {
    try {
      const { data, error } = await supabase
        .from('models')
        .insert(model as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update model
  async update(id: string, updates: ModelUpdate): Promise<ApiResponse<Model | null>> {
    try {
      const { data, error } = await supabase
        .from('models')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete model
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// NAMES API
// =====================================================

export const namesApi = {
  // Get all names
  async getAll(): Promise<ApiResponse<Name[]>> {
    try {
      const { data, error } = await supabase
        .from('names')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Name[], handleError(error));
    }
  },

  // Create name
  async create(name: NameInsert): Promise<ApiResponse<Name | null>> {
    try {
      const { data, error } = await supabase
        .from('names')
        .insert(name as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update name
  async update(id: string, updates: NameUpdate): Promise<ApiResponse<Name | null>> {
    try {
      const { data, error } = await supabase
        .from('names')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete name
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('names')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// MATERIALS API
// =====================================================

export const materialsApi = {
  // Get all materials
  async getAll(): Promise<ApiResponse<Material[]>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Material[], handleError(error));
    }
  },

  // Get material by ID
  async getById(id: string): Promise<ApiResponse<Material | null>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get low stock materials
  async getLowStock(): Promise<ApiResponse<Material[]>> {
    try {
      const { data, error } = await supabase
        .from('low_stock_materials')
        .select('*')
        .order('stock_difference');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Material[], handleError(error));
    }
  },

  // Create material
  async create(material: MaterialInsert): Promise<ApiResponse<Material | null>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert(material as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update material
  async update(id: string, updates: MaterialUpdate): Promise<ApiResponse<Material | null>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete material
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// PRODUCTS API
// =====================================================

export const productsApi = {
  // Get all products
  async getAll(): Promise<ApiResponse<Product[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning fallback products');
        return createResponse([], null);
      }
      
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Product[], handleError(error));
    }
  },

  // Get product by ID
  async getById(id: string): Promise<ApiResponse<Product | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning null');
        return createResponse(null, null);
      }

      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get product by slug (using name as slug)
  async getBySlug(slug: string): Promise<ApiResponse<Product | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning null');
        return createResponse(null, null);
      }

      // Convert slug back to name format (replace dashes with spaces and title case)
      const searchTerms = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      );

      // Try multiple search strategies
      const data = null;
      const error = null;

      // Strategy 1: Exact match with full reconstructed name
      const fullName = searchTerms.join(' ');
      const exactResponse = await supabase!
        .from('products')
        .select(`
          *,
          categories(name),
          subcategories(id, name)
        `)
        .eq('name', fullName)
        .eq('is_active', true)
        .maybeSingle();

      if (exactResponse.data) {
        return createResponse(exactResponse.data, null);
      }

      // Strategy 2: Case-insensitive partial match
      const partialResponse = await supabase!
        .from('products')
        .select(`
          *,
          categories(name),
          subcategories(id, name)
        `)
        .ilike('name', `%${fullName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (partialResponse.data) {
        return createResponse(partialResponse.data, null);
      }

      // Strategy 3: Search by individual words
      for (const term of searchTerms) {
        if (term.length > 2) { // Only search meaningful words
          const wordResponse = await supabase!
            .from('products')
            .select(`
              *,
              categories(name),
              subcategories(id, name)
            `)
            .ilike('name', `%${term}%`)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (wordResponse.data) {
            return createResponse(wordResponse.data, null);
          }
        }
      }

      // If no product found
      return createResponse(null, null);
      
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Search products by query
  async search(query: string, options?: {
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  }): Promise<ApiResponse<Product[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, using fallback search data');
        
        // Create some fallback products for development
        const fallbackProducts: Product[] = [
          {
            id: '1',
            name: 'Collar Elegante Luna',
            description: 'Hermoso collar con diseño de luna para ocasiones especiales',
            category_id: '1',
            subcategory_id: null,
            model_id: null,
            name_id: null,
            cost: 25,
            price: 45,
            cover_image: 'https://picsum.photos/900/1600?v=10',
            hover_image: 'https://picsum.photos/900/1600?v=20',
            product_images: null,
            is_active: true,
            is_featured: false,
            is_new: true,
            stock: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Anillo de Plata Moderno',
            description: 'Anillo elegante de plata con diseño contemporáneo',
            category_id: '2',
            subcategory_id: null,
            model_id: null,
            name_id: null,
            cost: 20,
            price: 35,
            cover_image: 'https://picsum.photos/900/1600?v=11',
            hover_image: 'https://picsum.photos/900/1600?v=21',
            product_images: null,
            is_active: true,
            is_featured: true,
            is_new: false,
            stock: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Aretes de Oro Rosa',
            description: 'Delicados aretes de oro rosa perfectos para cualquier ocasión',
            category_id: '3',
            subcategory_id: null,
            model_id: null,
            name_id: null,
            cost: 15,
            price: 28,
            cover_image: 'https://picsum.photos/900/1600?v=12',
            hover_image: 'https://picsum.photos/900/1600?v=22',
            product_images: null,
            is_active: true,
            is_featured: false,
            is_new: false,
            stock: 7,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];

        // Filter by search term
        const searchTerm = query.trim().toLowerCase();
        const filteredProducts = fallbackProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm))
        );

        return createResponse(filteredProducts, null);
      }

      if (!query.trim()) {
        return createResponse([], null);
      }

      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const includeInactive = options?.includeInactive || false;

      // Normalize search query
      const searchTerm = query.trim().toLowerCase();
      
      let queryBuilder = supabase!
        .from('products')
        .select('*');

      // Add activity filter
      if (!includeInactive) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      // Search in name and description fields using OR condition
      queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      // Add pagination and ordering
      queryBuilder = queryBuilder
        .order('name')
        .range(offset, offset + limit - 1);

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Product[], handleError(error));
    }
  },

  // Get search suggestions (for autocomplete)
  async searchSuggestions(query: string, limit: number = 5): Promise<ApiResponse<string[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning empty suggestions');
        return createResponse([], null);
      }

      if (!query.trim() || query.length < 2) {
        return createResponse([], null);
      }

      const searchTerm = query.trim().toLowerCase();
      
      const { data, error } = await supabase!
        .from('products')
        .select('name')
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;
      
      const suggestions = (data || []).map(item => item.name);
      return createResponse(suggestions, null);
    } catch (error) {
      return createResponse([] as string[], handleError(error));
    }
  },

  // Create product
  async create(product: ProductInsert): Promise<ApiResponse<Product | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating product creation');
        const mockProduct: Product = {
          id: Math.random().toString(36).substr(2, 9),
          name: product.name || '',
          description: product.description || null,
          category_id: product.category_id || null,
          subcategory_id: product.subcategory_id || null,
          model_id: null,
          name_id: null,
          cost: product.cost || 0,
          price: product.price || 0,
          cover_image: product.cover_image || null,
          hover_image: product.hover_image || null,
          product_images: product.product_images || null,
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
          is_new: product.is_new ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return createResponse(mockProduct, null);
      }

      const { data, error } = await supabase!
        .from('products')
        .insert([product] as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update product
  async update(id: string, updates: ProductUpdate): Promise<ApiResponse<Product | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating product update');
        const mockProduct: Product = {
          id,
          name: updates.name || 'Updated Product',
          description: updates.description || null,
          category_id: updates.category_id || null,
          subcategory_id: updates.subcategory_id || null,
          model_id: null,
          name_id: null,
          cost: updates.cost || 0,
          price: updates.price || 0,
          cover_image: updates.cover_image || null,
          hover_image: updates.hover_image || null,
          product_images: updates.product_images || null,
          is_active: updates.is_active ?? true,
          is_featured: updates.is_featured ?? false,
          is_new: updates.is_new ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return createResponse(mockProduct, null);
      }

      const { data, error } = await supabase!
        .from('products')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete product
  async delete(id: string): Promise<ApiResponse<boolean>> {
    console.log('\n🗑️ ProductsAPI.delete: Starting product deletion process...');
    console.log('📋 ProductsAPI.delete: Product ID:', id);

    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ ProductsAPI.delete: Supabase not configured, simulating deletion');
        return createResponse(true, null);
      }

      console.log('📋 ProductsAPI.delete: Fetching product data to get image URLs...');
      // Primero obtener el producto para conseguir las URLs de las imágenes
      const { data: product, error: fetchError } = await (supabase! as any)
        .from('products')
        .select('cover_image, hover_image, product_images')
        .eq('id', id)
        .single();

      console.log('📊 ProductsAPI.delete: Product fetch result:', { product, fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.log('❌ ProductsAPI.delete: Error fetching product:', fetchError);
        throw fetchError;
      }

      console.log('🗑️ ProductsAPI.delete: Deleting product from database...');
      // Eliminar el producto de la base de datos
      const { error } = await (supabase! as any)
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.log('❌ ProductsAPI.delete: Database deletion failed:', error);
        throw error;
      }
      console.log('✅ ProductsAPI.delete: Product deleted from database successfully');

      // Si el producto tenía imágenes, intentar eliminarlas de Cloudflare R2
      if (product) {
        console.log('📋 ProductsAPI.delete: Product had images, preparing for R2 deletion...');
        const imagesToDelete: string[] = [];
        
        // Añadir imagen de portada
        if (product.cover_image) {
          imagesToDelete.push(product.cover_image);
          console.log('📷 ProductsAPI.delete: Added cover image for deletion:', product.cover_image);
        }
        
        // Añadir imagen hover
        if (product.hover_image) {
          imagesToDelete.push(product.hover_image);
          console.log('🖼️ ProductsAPI.delete: Added hover image for deletion:', product.hover_image);
        }
        
        // Añadir imágenes de galería
        if (product.product_images && Array.isArray(product.product_images)) {
          product.product_images.forEach((imageUrl: string) => {
            if (imageUrl && imageUrl.trim()) {
              imagesToDelete.push(imageUrl);
              console.log('🖼️ ProductsAPI.delete: Added gallery image for deletion:', imageUrl);
            }
          });
        }

        console.log(`📊 ProductsAPI.delete: Total images to delete from R2: ${imagesToDelete.length}`);
        console.log('📋 ProductsAPI.delete: Images list:', imagesToDelete);

        // Eliminar todas las imágenes de R2 en paralelo (no bloquear si falla)
        console.log('🔍 ProductsAPI.delete: Starting R2 image deletion. Checking environment...');
        checkServerEnvVars(); // Debug de variables de entorno del servidor
        
        const deletePromises = imagesToDelete.map(async (imageUrl, index) => {
          console.log(`🗑️ ProductsAPI.delete: Deleting image ${index + 1}/${imagesToDelete.length}: ${imageUrl}`);
          try {
            const result = await R2Utils.deleteProductImageByUrl(imageUrl);
            console.log(`✅ ProductsAPI.delete: Image ${index + 1} deleted successfully:`, { imageUrl, result });
            return { success: true, imageUrl, result };
          } catch (error) {
            console.warn(`⚠️ ProductsAPI.delete: Could not delete image ${index + 1}:`, { imageUrl, error });
            // No fallar la operación completa si no se puede eliminar la imagen
            return { success: false, imageUrl, error };
          }
        });

        console.log('⏳ ProductsAPI.delete: Waiting for all R2 deletions to complete...');
        const deleteResults = await Promise.allSettled(deletePromises);
        console.log('📊 ProductsAPI.delete: R2 deletion results:', deleteResults);

        const successful = deleteResults.filter(r => r.status === 'fulfilled').length;
        const failed = deleteResults.filter(r => r.status === 'rejected').length;
        console.log(`📈 ProductsAPI.delete: R2 deletion summary - Success: ${successful}, Failed: ${failed}`);
      } else {
        console.log('ℹ️ ProductsAPI.delete: Product had no images to delete from R2');
      }

      console.log('✅ ProductsAPI.delete: Product deletion process completed successfully');
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Get featured products
  async getFeatured(limit?: number): Promise<ApiResponse<Product[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning fallback featured products');
        return createResponse([], null);
      }
      
      let query = supabase!
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('name');

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as Product[], handleError(error));
    }
  },
};

// =====================================================
// INVENTORY API
// =====================================================

export const inventoryApi = {
  // Get product inventory
  async getProductInventory(productId: string): Promise<ApiResponse<ProductInventory | null>> {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create or update product inventory
  async upsertProductInventory(inventory: ProductInventoryInsert): Promise<ApiResponse<ProductInventory | null>> {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .upsert(inventory as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update product inventory
  async updateProductInventory(productId: string, updates: ProductInventoryUpdate): Promise<ApiResponse<ProductInventory | null>> {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .update(updates as any)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get stock movements
  async getStockMovements(materialId?: string): Promise<ApiResponse<StockMovement[]>> {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (materialId) {
        query = query.eq('material_id', materialId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as StockMovement[], handleError(error));
    }
  },

  // Create stock movement
  async createStockMovement(movement: StockMovementInsert): Promise<ApiResponse<StockMovement | null>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// FAQS API
// =====================================================

export const faqsApi = {
  // Get all FAQs
  async getAll(): Promise<ApiResponse<FAQ[]>> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as FAQ[], handleError(error));
    }
  },

  // Get FAQs by category
  async getByCategory(category: string): Promise<ApiResponse<FAQ[]>> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as FAQ[], handleError(error));
    }
  },

  // Get active FAQs
  async getActive(): Promise<ApiResponse<FAQ[]>> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as FAQ[], handleError(error));
    }
  },

  // Create FAQ
  async create(faq: FAQInsert): Promise<ApiResponse<FAQ | null>> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert(faq as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update FAQ
  async update(id: string, updates: FAQUpdate): Promise<ApiResponse<FAQ | null>> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete FAQ
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Update FAQ order
  async updateOrder(id: string, newOrder: number): Promise<ApiResponse<FAQ | null>> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .update({ order_index: newOrder })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// CAROUSEL IMAGES API
// =====================================================

export const carouselImagesApi = {
  // Get all carousel images
  async getAll(): Promise<ApiResponse<CarouselImage[]>> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as CarouselImage[], handleError(error));
    }
  },

  // Get active carousel images
  async getActive(): Promise<ApiResponse<CarouselImage[]>> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as CarouselImage[], handleError(error));
    }
  },

  // Get carousel image by ID
  async getById(id: string): Promise<ApiResponse<CarouselImage | null>> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create carousel image
  async create(carouselImage: CarouselImageInsert): Promise<ApiResponse<CarouselImage | null>> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .insert(carouselImage as any)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update carousel image
  async update(id: string, carouselImage: CarouselImageUpdate): Promise<ApiResponse<CarouselImage | null>> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .update(carouselImage as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete carousel image
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('carousel_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Update order
  async updateOrder(id: string, newOrder: number): Promise<ApiResponse<CarouselImage | null>> {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .update({ order_index: newOrder })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// ORDERS API
// =====================================================

const ordersApi = {
  // Get all orders
  async getAll(): Promise<ApiResponse<OrderWithItems[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning empty array');
        return createResponse([], null);
      }

      const { data: orders, error: ordersError } = await supabase!
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get order items for each order
      const ordersWithItems: OrderWithItems[] = [];
      
      for (const order of orders || []) {
        const { data: items, error: itemsError } = await supabase!
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) throw itemsError;

        ordersWithItems.push({
          ...order,
          items: items || []
        });
      }

      return createResponse(ordersWithItems, null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  // Get order by ID with items
  async getById(id: string): Promise<ApiResponse<OrderWithItems | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning null');
        return createResponse(null, null);
      }

      const { data: order, error: orderError } = await supabase!
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase!
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      const orderWithItems: OrderWithItems = {
        ...order,
        items: items || []
      };

      return createResponse(orderWithItems, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create order with items
  async create(orderData: OrderInsert, items: any[]): Promise<ApiResponse<OrderWithItems | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock order');
        const mockOrder: OrderWithItems = {
          id: `mock-${Date.now()}`,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_email: orderData.customer_email || null,
          status: orderData.status || 'pending',
          total_amount: orderData.total_amount || 0,
          notes: orderData.notes || null,
          whatsapp_sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: items.map((item, index) => ({
            id: `mock-item-${index}`,
            order_id: `mock-${Date.now()}`,
            product_id: item.product_id,
            product_name: item.product_name,
            product_price: item.product_price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            created_at: new Date().toISOString()
          }))
        };
        return createResponse(mockOrder, null);
      }

      // Create order first
      const { data: order, error: orderError } = await supabase!
        .from('orders')
        .insert(orderData as any)
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order creation failed');

      // Create order items
      const itemsWithOrderId = items.map((item: any) => ({
        ...item,
        order_id: (order as any).id
      }));

      const { data: createdItems, error: itemsError } = await supabase!
        .from('order_items')
        .insert(itemsWithOrderId as any)
        .select();

      if (itemsError) throw itemsError;

      const orderWithItems: OrderWithItems = {
        ...(order as any),
        items: createdItems || []
      };

      return createResponse(orderWithItems, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update order status
  async updateStatus(id: string, status: OrderStatus, whatsappSent?: boolean): Promise<ApiResponse<Order | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning null');
        return createResponse(null, null);
      }

      const updateData: any = { status };
      
      if (whatsappSent) {
        updateData.whatsapp_sent_at = new Date().toISOString();
      }

      const { data, error } = await supabase!
        .from('orders')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data as any, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get orders by status
  async getByStatus(status: OrderStatus): Promise<ApiResponse<OrderWithItems[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning empty array');
        return createResponse([], null);
      }

      const { data: orders, error: ordersError } = await supabase!
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get order items for each order
      const ordersWithItems: OrderWithItems[] = [];
      
      for (const order of orders || []) {
        const { data: items, error: itemsError } = await supabase!
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) throw itemsError;

        ordersWithItems.push({
          ...order,
          items: items || []
        });
      }

      return createResponse(ordersWithItems, null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  // Delete order
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning true');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  }
};

// =====================================================
// EXPORT ALL APIs
// =====================================================

// =====================================================
// PRODUCT SALES API
// =====================================================

export const productSalesApi = {
  // Get all product sales
  async getAll(): Promise<ApiResponse<SaleItem[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock product sales');
        return createResponse([], null);
      }

      const { data, error } = await supabase!
        .from('sale_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data as SaleItem[] || [], null);
    } catch (error) {
      return createResponse([] as SaleItem[], handleError(error));
    }
  },

  // Get sales by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<SaleItem[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock product sales');
        return createResponse([], null);
      }

      const { data, error } = await supabase!
        .from('sale_items')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data as SaleItem[] || [], null);
    } catch (error) {
      return createResponse([] as SaleItem[], handleError(error));
    }
  },

  // Get sales by product
  async getByProduct(productId: string): Promise<ApiResponse<SaleItem[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock product sales');
        return createResponse([], null);
      }

      const { data, error } = await supabase!
        .from('sale_items')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data as SaleItem[] || [], null);
    } catch (error) {
      return createResponse([] as SaleItem[], handleError(error));
    }
  },

  // Create new product sale
  async create(saleData: SaleItemInsert): Promise<ApiResponse<SaleItem>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating product sale creation');
        const mockSale: SaleItem = {
          id: `mock-sale-${Date.now()}`,
          sale_id: 'mock-sale-id',
          product_id: saleData.product_id || null,
          quantity: saleData.quantity || 1,
          unit_price: saleData.unit_price,
          unit_cost: saleData.unit_cost || 0,
          total_price: saleData.total_price || (saleData.quantity || 1) * saleData.unit_price,
          total_cost: saleData.total_cost || 0,
          created_at: new Date().toISOString(),
        };
        return createResponse(mockSale, null);
      }

      // Calculate total_price if not provided
      const quantity = saleData.quantity || 1;
      const totalPrice = saleData.total_price || (quantity * saleData.unit_price);

      const saleToInsert = {
        product_id: saleData.product_id,
        quantity: quantity,
        unit_price: saleData.unit_price,
        total_price: totalPrice,
        unit_cost: saleData.unit_cost || 0,
        total_cost: saleData.total_cost || 0,
      };

      console.log('🔍 Attempting to insert sale data:', saleToInsert);
      console.log('🔍 Supabase client configured:', !!supabase);

      const { data, error } = await supabase!
        .from('sale_items')
        .insert(saleToInsert)
        .select()
        .single();

      console.log('🔍 Supabase response - data:', data);
      console.log('🔍 Supabase response - error:', error);

      if (error) throw error;
      return createResponse(data as SaleItem, null);
    } catch (error) {
      return createResponse(null as any, handleError(error));
    }
  },

  // Update product sale
  async update(id: string, updates: SaleItemUpdate): Promise<ApiResponse<SaleItem>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating product sale update');
        const mockSale: SaleItem = {
          id,
          sale_id: 'mock-sale-id',
          product_id: 'mock-product-id',
          quantity: 1,
          unit_price: 10,
          unit_cost: 0,
          total_price: 10,
          total_cost: 0,
          created_at: new Date().toISOString(),
          ...updates,
        };
        return createResponse(mockSale, null);
      }

      // Recalculate total_amount if quantity or unit_price changed
      const updateData = { ...updates };
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        const { data: currentSale } = await supabase!
          .from('sale_items')
          .select('quantity, unit_price')
          .eq('id', id)
          .single();

        if (currentSale) {
          const newQuantity = updates.quantity ?? (currentSale as any).quantity;
          const newUnitPrice = updates.unit_price ?? (currentSale as any).unit_price;
          updateData.total_price = newQuantity * newUnitPrice;
        }
      }

      const { data, error } = await supabase!
        .from('sale_items')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data as SaleItem, null);
    } catch (error) {
      return createResponse(null as any, handleError(error));
    }
  },

  // Delete product sale
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, simulating product sale deletion');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('sale_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Get sales statistics
  async getStats(startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalSales: number;
    totalRevenue: number;
    totalQuantity: number;
    averageOrderValue: number;
  }>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock sales stats');
        return createResponse({
          totalSales: 0,
          totalRevenue: 0,
          totalQuantity: 0,
          averageOrderValue: 0,
        }, null);
      }

      let query = supabase!
        .from('sale_items')
        .select('quantity, total_price');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalSales: data?.length || 0,
        totalRevenue: data?.reduce((sum, sale: any) => sum + sale.total_price, 0) || 0,
        totalQuantity: data?.reduce((sum, sale: any) => sum + sale.quantity, 0) || 0,
        averageOrderValue: data?.length ? 
          (data.reduce((sum, sale: any) => sum + sale.total_price, 0) / data.length) : 0,
      };

      return createResponse(stats, null);
    } catch (error) {
      const defaultStats = {
        totalSales: 0,
        totalRevenue: 0,
        totalQuantity: 0,
        averageOrderValue: 0,
      };
      return createResponse(defaultStats, handleError(error));
    }
  },
};

// =====================================================
// VISTA PRINCIPAL API (MAIN VIEW SECTION)
// =====================================================

export const vistaPrincipalApi = {
  // Get all vista principal entries (only active one should be shown)
  async getAll(): Promise<ApiResponse<VistaPrincipal[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning fallback vista principal');
        const fallbackVistaPrincipal: VistaPrincipal = {
          id: 'fallback',
          titulo: 'Descubre la Belleza, Encuentra tu Estilo',
          descripcion: 'Explora nuestra exclusiva colección de joyas, diseñadas para capturar la esencia de la elegancia y la sofisticación. Cada pieza cuenta una historia.',
          enlace: '/products',
          enlace_texto: 'Ver Colección',
          imagen: 'https://picsum.photos/600/400',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse([fallbackVistaPrincipal], null);
      }

      const { data, error } = await supabase!
        .from('vista_principal')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle table not found error
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, returning fallback data. Please run the migration script.');
          const fallbackVistaPrincipal: VistaPrincipal = {
            id: 'fallback',
            titulo: 'Descubre la Belleza, Encuentra tu Estilo',
            descripcion: 'Explora nuestra exclusiva colección de joyas, diseñadas para capturar la esencia de la elegancia y la sofisticación. Cada pieza cuenta una historia.',
            enlace: '/products',
            enlace_texto: 'Ver Colección',
            imagen: 'https://picsum.photos/600/400',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return createResponse([fallbackVistaPrincipal], null);
        }
        throw error;
      }
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as VistaPrincipal[], handleError(error));
    }
  },

  // Get active vista principal (main one to show)
  async getActive(): Promise<ApiResponse<VistaPrincipal | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning fallback vista principal');
        const fallbackVistaPrincipal: VistaPrincipal = {
          id: 'fallback',
          titulo: 'Descubre la Belleza, Encuentra tu Estilo',
          descripcion: 'Explora nuestra exclusiva colección de joyas, diseñadas para capturar la esencia de la elegancia y la sofisticación. Cada pieza cuenta una historia.',
          enlace: '/products',
          enlace_texto: 'Ver Colección',
          imagen: 'https://picsum.photos/600/400',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(fallbackVistaPrincipal, null);
      }

      const { data, error } = await supabase!
        .from('vista_principal')
        .select('*')
        .eq('is_active', true)
        .single();

      // Handle different error cases
      if (error) {
        // PGRST116 = no rows returned (normal case when no active record exists)
        if (error.code === 'PGRST116') {
          return createResponse(null, null);
        }
        // PGRST205 = table not found (table hasn't been migrated yet)
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, returning fallback data. Please run the migration script.');
          const fallbackVistaPrincipal: VistaPrincipal = {
            id: 'fallback',
            titulo: 'Descubre la Belleza, Encuentra tu Estilo',
            descripcion: 'Explora nuestra exclusiva colección de joyas, diseñadas para capturar la esencia de la elegancia y la sofisticación. Cada pieza cuenta una historia.',
            enlace: '/products',
            enlace_texto: 'Ver Colección',
            imagen: 'https://picsum.photos/600/400',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return createResponse(fallbackVistaPrincipal, null);
        }
        throw error;
      }

      return createResponse(data || null, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Get vista principal by ID
  async getById(id: string): Promise<ApiResponse<VistaPrincipal | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning null');
        return createResponse(null, null);
      }

      const { data, error } = await supabase!
        .from('vista_principal')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Handle table not found error
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, returning null. Please run the migration script.');
          return createResponse(null, null);
        }
        if (error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      }
      return createResponse(data || null, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create new vista principal
  async create(vistaPrincipal: VistaPrincipalInsert): Promise<ApiResponse<VistaPrincipal | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, cannot create vista principal');
        return createResponse(null, 'Supabase not configured');
      }

      const { data, error } = await supabase!
        .from('vista_principal')
        .insert(vistaPrincipal)
        .select()
        .single();

      if (error) {
        // Handle table not found error
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, cannot create. Please run the migration script first.');
          return createResponse(null, 'Table vista_principal does not exist. Please run the migration script.');
        }
        throw error;
      }
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update existing vista principal
  async update(id: string, updates: VistaPrincipalUpdate): Promise<ApiResponse<VistaPrincipal | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, cannot update vista principal');
        return createResponse(null, 'Supabase not configured');
      }

      const { data, error } = await supabase!
        .from('vista_principal')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Handle table not found error
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, cannot update. Please run the migration script first.');
          return createResponse(null, 'Table vista_principal does not exist. Please run the migration script.');
        }
        throw error;
      }
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Delete vista principal
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, cannot delete vista principal');
        return createResponse(false, 'Supabase not configured');
      }

      const { error } = await supabase!
        .from('vista_principal')
        .delete()
        .eq('id', id);

      if (error) {
        // Handle table not found error
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, cannot delete. Please run the migration script first.');
          return createResponse(false, 'Table vista_principal does not exist. Please run the migration script.');
        }
        throw error;
      }
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Set as active (deactivate others and activate this one)
  async setActive(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, cannot set active vista principal');
        return createResponse(false, 'Supabase not configured');
      }

      // First, deactivate all
      const { error: deactivateError } = await supabase!
        .from('vista_principal')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (deactivateError) {
        // Handle table not found error
        if (deactivateError.code === 'PGRST205' || deactivateError.message?.includes('Could not find the table')) {
          console.log('⚠️ vista_principal table not found, cannot set active. Please run the migration script first.');
          return createResponse(false, 'Table vista_principal does not exist. Please run the migration script.');
        }
        throw deactivateError;
      }

      // Then activate the selected one
      const { error } = await supabase!
        .from('vista_principal')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// CUSTOMER TESTIMONIALS API
// =====================================================

export const testimonialsApi = {
  // Get all testimonials with optional filters
  async getAll(options?: {
    includeInactive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<CustomerTestimonial[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, using fallback testimonials data');
        
        // Create some fallback testimonials for development
        const fallbackTestimonials: CustomerTestimonial[] = [
          {
            id: '1',
            customer_name: 'María González',
            customer_location: 'San Salvador, El Salvador',
            image_url: 'https://picsum.photos/800/600?v=1',
            is_active: true,
            display_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            customer_name: 'Carlos Martínez',
            customer_location: 'Santa Ana, El Salvador',
            image_url: 'https://picsum.photos/800/600?v=2',
            is_active: true,
            display_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            customer_name: 'Ana Rodríguez',
            customer_location: 'La Libertad, El Salvador',
            image_url: 'https://picsum.photos/800/600?v=3',
            is_active: true,
            display_order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        return createResponse(fallbackTestimonials, null);
      }

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const includeInactive = options?.includeInactive || false;

      let query = supabase!
        .from('customer_testimonials')
        .select('*');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      query = query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([] as CustomerTestimonial[], handleError(error));
    }
  },

  // Get testimonial by ID
  async getById(id: string): Promise<ApiResponse<CustomerTestimonial | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock testimonial');
        const mockTestimonial: CustomerTestimonial = {
          id,
          customer_name: 'Mock Customer',
          customer_location: 'Mock Location',
          image_url: 'https://picsum.photos/800/600?v=1',
          customer_rating: 5,
          testimonial_text: 'Mock testimonial text',
          is_active: true,
          display_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockTestimonial, null);
      }

      const { data, error } = await supabase!
        .from('customer_testimonials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create new testimonial
  async create(testimonial: CustomerTestimonialInsert): Promise<ApiResponse<CustomerTestimonial>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock created testimonial');
        const mockTestimonial: CustomerTestimonial = {
          id: Date.now().toString(),
          ...testimonial,
          is_active: testimonial.is_active ?? true,
          display_order: testimonial.display_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockTestimonial, null);
      }

      const { data, error } = await supabase!
        .from('customer_testimonials')
        .insert(testimonial)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as CustomerTestimonial, handleError(error));
    }
  },

  // Update testimonial
  async update(id: string, updates: CustomerTestimonialUpdate): Promise<ApiResponse<CustomerTestimonial>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock updated testimonial');
        const mockTestimonial: CustomerTestimonial = {
          id,
          customer_name: updates.customer_name || 'Mock Customer',
          customer_location: updates.customer_location || 'Mock Location',
          image_url: updates.image_url || 'https://picsum.photos/800/600?v=1',
          is_active: updates.is_active ?? true,
          display_order: updates.display_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockTestimonial, null);
      }

      const { data, error } = await supabase!
        .from('customer_testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as CustomerTestimonial, handleError(error));
    }
  },

  // Delete testimonial
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock delete success');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('customer_testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Activate testimonial
  async activate(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock activate success');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('customer_testimonials')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Deactivate testimonial
  async deactivate(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock deactivate success');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('customer_testimonials')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Update display order
  async updateOrder(id: string, newOrder: number): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock order update success');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('customer_testimonials')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// WEBSITE MATERIALS API
// =====================================================

const websiteMaterialsApi = {
  // Get all website materials
  async getAll(options: { includeInactive?: boolean } = {}): Promise<ApiResponse<WebsiteMaterial[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock website materials');
        
        // Create some fallback materials for development
        const fallbackMaterials: WebsiteMaterial[] = [
          {
            id: '1',
            title: 'Oro de Calidad',
            description: 'Utilizamos oro de 14k y 18k, conocido por su durabilidad y brillo atemporal. Perfecto para piezas que durarán toda la vida.',
            image_url: 'https://picsum.photos/500/300?v=20',
            is_active: true,
            display_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Plata de Ley 925',
            description: 'Nuestra plata de ley es 92.5% plata pura, ofreciendo un balance ideal entre belleza y resistencia. Ideal para diseños modernos y elegantes.',
            image_url: 'https://picsum.photos/500/300?v=21',
            is_active: true,
            display_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Piedras Preciosas y Semipreciosas',
            description: 'Seleccionamos cuidadosamente cada gema, desde diamantes hasta cuarzos, por su color, corte y claridad para añadir un toque especial a cada joya.',
            image_url: 'https://picsum.photos/500/300?v=22',
            is_active: true,
            display_order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        return createResponse(fallbackMaterials, null);
      }

      let query = supabase!.from('website_materials').select('*');
      
      if (!options.includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  // Create new website material
  async create(material: WebsiteMaterialInsert): Promise<ApiResponse<WebsiteMaterial>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock website material');
        
        const mockMaterial: WebsiteMaterial = {
          id: `mock_${Date.now()}`,
          title: material.title,
          description: material.description,
          image_url: material.image_url,
          is_active: material.is_active !== false,
          display_order: material.display_order || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return createResponse(mockMaterial, null);
      }

      const { data, error } = await (supabase! as any)
        .from('website_materials')
        .insert(material)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as WebsiteMaterial, handleError(error));
    }
  },

  // Update website material
  async update(id: string, updates: WebsiteMaterialUpdate): Promise<ApiResponse<WebsiteMaterial>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock updated website material');
        const mockMaterial: WebsiteMaterial = {
          id,
          title: updates.title || 'Mock Material',
          description: updates.description || 'Mock Description',
          image_url: updates.image_url || 'https://picsum.photos/500/300?v=1',
          is_active: updates.is_active ?? true,
          display_order: updates.display_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockMaterial, null);
      }

      const { data, error } = await (supabase! as any)
        .from('website_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as WebsiteMaterial, handleError(error));
    }
  },

  // Delete website material
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock delete success');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('website_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Activate material
  async activate(id: string): Promise<ApiResponse<WebsiteMaterial>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock activation');
        return createResponse({} as WebsiteMaterial, null);
      }

      const { data, error } = await (supabase! as any)
        .from('website_materials')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as WebsiteMaterial, handleError(error));
    }
  },

  // Deactivate material
  async deactivate(id: string): Promise<ApiResponse<WebsiteMaterial>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock deactivation');
        return createResponse({} as WebsiteMaterial, null);
      }

      const { data, error } = await (supabase! as any)
        .from('website_materials')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as WebsiteMaterial, handleError(error));
    }
  },

  // Update display order
  async updateOrder(id: string, newOrder: number): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock order update success');
        return createResponse(true, null);
      }

      const { error } = await (supabase! as any)
        .from('website_materials')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// Materials Content API
const materialsContentApi = {
  // Get all materials content
  async getAll(options: { includeInactive?: boolean } = {}): Promise<ApiResponse<MaterialsContent[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock materials content');
        
        // Create some fallback content for development
        const fallbackContent: MaterialsContent[] = [
          {
            id: '1',
            section_type: 'care_tips',
            title: 'Cuidado de tus Joyas',
            content: '• Guarda tus piezas individualmente para evitar que se rayen.\n• Evita el contacto con perfumes, cremas y productos de limpieza.\n• Quítate las joyas antes de nadar, bañarte o hacer ejercicio.\n• Límpialas suavemente con un paño seco y suave después de usarlas.',
            icon_name: 'ShieldCheck',
            is_active: true,
            display_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            section_type: 'maintenance',
            title: 'Mantenimiento',
            content: 'Para una limpieza más profunda, puedes usar agua tibia y un jabón neutro. Usa un cepillo de dientes suave para llegar a las zonas difíciles y seca completamente la pieza antes de guardarla. Para piezas con piedras preciosas, recomendamos una limpieza profesional una vez al año.',
            icon_name: 'Wrench',
            is_active: true,
            display_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        return createResponse(fallbackContent, null);
      }

      let query = supabase!.from('materials_content').select('*');
      
      if (!options.includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  // Create new materials content
  async create(content: MaterialsContentInsert): Promise<ApiResponse<MaterialsContent>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock materials content');
        
        const mockContent: MaterialsContent = {
          id: `mock_${Date.now()}`,
          section_type: content.section_type,
          title: content.title,
          content: content.content,
          icon_name: content.icon_name || '',
          is_active: content.is_active !== false,
          display_order: content.display_order || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return createResponse(mockContent, null);
      }

      const { data, error } = await (supabase! as any)
        .from('materials_content')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as MaterialsContent, handleError(error));
    }
  },

  // Update materials content
  async update(id: string, updates: MaterialsContentUpdate): Promise<ApiResponse<MaterialsContent>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock updated materials content');
        const mockContent: MaterialsContent = {
          id,
          section_type: updates.section_type || 'care_tips',
          title: updates.title || 'Mock Title',
          content: updates.content || 'Mock Content',
          icon_name: updates.icon_name || '',
          is_active: updates.is_active ?? true,
          display_order: updates.display_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockContent, null);
      }

      const { data, error } = await (supabase! as any)
        .from('materials_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as MaterialsContent, handleError(error));
    }
  },

  // Delete materials content
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock delete success');
        return createResponse(true, null);
      }

      const { error } = await supabase!
        .from('materials_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// ABOUT CONTENT API
// =====================================================

const aboutContentApi = {
  // Get all about content sections
  async getAll(): Promise<ApiResponse<AboutContent[]>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock about content');
        const mockData: AboutContent[] = [
          {
            id: '1',
            section_type: 'hero',
            title: 'Sobre Nosotros',
            subtitle: 'Conoce la historia detrás de cada joya.',
            content: '',
            image_url: '',
            background_image_url: '',
            extra_data: {},
            is_active: true,
            display_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            section_type: 'mission',
            title: 'Nuestra Misión',
            subtitle: '',
            content: 'En Calida Escencia, creemos que la joyería es más que un simple accesorio; es una forma de expresión, un recuerdo y una celebración de los momentos especiales de la vida. Nacimos en el corazón de El Salvador con la misión de crear piezas atemporales y de alta calidad que te acompañen en tu día a día.\n\nCada una de nuestras joyas es diseñada y elaborada con una meticulosa atención al detalle, utilizando materiales nobles como el oro, la plata de ley y piedras preciosas. Nos inspiramos en la belleza de lo simple y en la elegancia de lo minimalista para ofrecerte diseños que perduren en el tiempo.\n\nSomos más que una marca; somos una comunidad de amantes de la belleza y el buen gusto. Gracias por ser parte de nuestra historia.',
            image_url: 'https://picsum.photos/600/800',
            background_image_url: '',
            extra_data: {},
            is_active: true,
            display_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            section_type: 'shipping',
            title: 'Envíos a todo el país y más allá',
            subtitle: 'Llevamos nuestras joyas hasta la puerta de tu casa. Rápido, seguro y con el cuidado que tus piezas merecen.',
            content: '',
            image_url: '',
            background_image_url: 'https://picsum.photos/1200/400?v=60',
            extra_data: {
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
            },
            is_active: true,
            display_order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '4',
            section_type: 'payment',
            title: 'Paga con total seguridad y comodidad',
            subtitle: 'Ofrecemos múltiples métodos de pago para que elijas el que mejor se adapte a ti. Todas las transacciones son 100% seguras.',
            content: '',
            image_url: '',
            background_image_url: 'https://picsum.photos/1200/400?v=61',
            extra_data: {
              methods: [
                'Tarjetas de Crédito/Débito',
                'Transferencia Bancaria',
                'Pago Contra Entrega (San Salvador)'
              ]
            },
            is_active: true,
            display_order: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '5',
            section_type: 'returns',
            title: 'Tu satisfacción es nuestra prioridad',
            subtitle: 'Queremos que ames tus joyas. Si por alguna razón no estás completamente satisfecha, te facilitamos el proceso de cambio o devolución.',
            content: '',
            image_url: '',
            background_image_url: 'https://picsum.photos/1200/400?v=62',
            extra_data: {
              policy: {
                title: 'Política de Cambios y Devoluciones',
                rules: [
                  'Tienes 7 días desde que recibes tu pedido para solicitar un cambio o devolución.',
                  'La pieza debe estar en perfectas condiciones, sin uso y en su empaque original.',
                  'Los costos de envío para devoluciones corren por cuenta del cliente, a menos que se trate de un defecto de fábrica.',
                  'Para iniciar el proceso, simplemente contáctanos con tu número de orden.'
                ]
              }
            },
            is_active: true,
            display_order: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        return createResponse(mockData, null);
      }

      const { data, error } = await (supabase! as any)
        .from('about_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  // Get about content by section type
  async getBySection(sectionType: string): Promise<ApiResponse<AboutContent | null>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock about content section');
        const mockData: AboutContent = {
          id: '1',
          section_type: sectionType as any,
          title: 'Mock Section',
          subtitle: 'Mock subtitle',
          content: 'Mock content',
          image_url: 'https://picsum.photos/600/400',
          background_image_url: '',
          extra_data: {},
          is_active: true,
          display_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockData, null);
      }

      const { data, error } = await (supabase! as any)
        .from('about_content')
        .select('*')
        .eq('section_type', sectionType)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Create new about content section
  async create(content: AboutContentInsert): Promise<ApiResponse<AboutContent>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock created about content');
        
        const mockContent: AboutContent = {
          id: `mock_${Date.now()}`,
          section_type: content.section_type,
          title: content.title,
          subtitle: content.subtitle || '',
          content: content.content || '',
          image_url: content.image_url || '',
          background_image_url: content.background_image_url || '',
          extra_data: content.extra_data || {},
          is_active: content.is_active !== false,
          display_order: content.display_order || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return createResponse(mockContent, null);
      }

      const { data, error } = await (supabase! as any)
        .from('about_content')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as AboutContent, handleError(error));
    }
  },

  // Update about content section
  async update(id: string, updates: AboutContentUpdate): Promise<ApiResponse<AboutContent>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock updated about content');
        const mockContent: AboutContent = {
          id,
          section_type: updates.section_type || 'hero',
          title: updates.title || 'Mock Title',
          subtitle: updates.subtitle || 'Mock Subtitle',
          content: updates.content || 'Mock Content',
          image_url: updates.image_url || 'https://picsum.photos/600/400',
          background_image_url: updates.background_image_url || '',
          extra_data: updates.extra_data || {},
          is_active: updates.is_active ?? true,
          display_order: updates.display_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return createResponse(mockContent, null);
      }

      const { data, error } = await (supabase! as any)
        .from('about_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as AboutContent, handleError(error));
    }
  },

  // Delete about content section
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock deletion');
        return createResponse(true, null);
      }

      const { error } = await (supabase! as any)
        .from('about_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Activate about content section
  async activate(id: string): Promise<ApiResponse<AboutContent>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock activation');
        return createResponse({} as AboutContent, null);
      }

      const { data, error } = await (supabase! as any)
        .from('about_content')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as AboutContent, handleError(error));
    }
  },

  // Deactivate about content section
  async deactivate(id: string): Promise<ApiResponse<AboutContent>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock deactivation');
        return createResponse({} as AboutContent, null);
      }

      const { data, error } = await (supabase! as any)
        .from('about_content')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse({} as AboutContent, handleError(error));
    }
  },

  // Update display order
  async updateOrder(id: string, newOrder: number): Promise<ApiResponse<boolean>> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, returning mock order update');
        return createResponse(true, null);
      }

      const { error } = await (supabase! as any)
        .from('about_content')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

// =====================================================
// SHIPPING METHODS API
// =====================================================

export const shippingMethodsApi = {
  async getAll(): Promise<ApiResponse<ShippingMethod[]>> {
    try {
      const { data, error } = await supabase!
        .from('shipping_methods')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      return createResponse([], handleError(error));
    }
  },

  async getById(id: string): Promise<ApiResponse<ShippingMethod>> {
    try {
      const { data, error } = await supabase!
        .from('shipping_methods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async create(method: ShippingMethodInsert): Promise<ApiResponse<ShippingMethod>> {
    try {
      const { data, error } = await supabase!
        .from('shipping_methods')
        .insert(method)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async update(id: string, updates: ShippingMethodUpdate): Promise<ApiResponse<ShippingMethod>> {
    try {
      const { data, error } = await supabase!
        .from('shipping_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase!
        .from('shipping_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  async reorder(id: string, newOrder: number): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase!
        .from('shipping_methods')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },
};

export const api = {
  categories: categoriesApi,
  subcategories: subcategoriesApi,
  models: modelsApi,
  names: namesApi,
  materials: materialsApi,
  products: productsApi,
  inventory: inventoryApi,
  faqs: faqsApi,
  carouselImages: carouselImagesApi,
  orders: ordersApi,
  productSales: productSalesApi,
  vistaPrincipal: vistaPrincipalApi, // Updated from novedadApi
  testimonials: testimonialsApi,
  websiteMaterials: websiteMaterialsApi,
  materialsContent: materialsContentApi,
  aboutContent: aboutContentApi,
  shippingMethods: shippingMethodsApi,
};