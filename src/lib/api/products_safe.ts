// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import type {
  ApiResponse,
  Product,
  Category,
  Subcategory,
} from '@/types/database';

// =====================================================
// DEMO DATA FALLBACK
// =====================================================

const demoCategories: Category[] = [
  { id: '1', name: 'aros', description: 'Aros elegantes', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'collares', description: 'Collares únicos', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'anillos', description: 'Anillos hermosos', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', name: 'pulseras', description: 'Pulseras modernas', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const demoSubcategories: Subcategory[] = [
  { id: '1', name: 'Acero quirúrgico', category_id: '1', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'blanco', category_id: '1', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'dorado', category_id: '1', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', name: 'Plata 925', category_id: '1', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', name: 'Acero quirúrgico', category_id: '2', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', name: 'blanco', category_id: '2', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', name: 'dorado', category_id: '2', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', name: 'Plata 925', category_id: '2', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const demoProducts: Product[] = [
  {
    id: '1',
    name: 'Aros Elegantes',
    description: 'Hermosos aros de acero quirúrgico',
    cost: 15.00,
    price: 25.00,
    category_id: '1',
    subcategory_id: '1',
    cover_image: 'https://picsum.photos/900/1600?v=10',
    product_images: ['https://picsum.photos/900/1600?v=10', 'https://picsum.photos/900/1600?v=20'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    model_id: null,
    name_id: null
  },
  {
    id: '2',
    name: 'Collar Luna',
    description: 'Collar elegante con colgante de luna',
    cost: 30.00,
    price: 45.00,
    category_id: '2',
    subcategory_id: '5',
    cover_image: 'https://picsum.photos/900/1600?v=11',
    product_images: ['https://picsum.photos/900/1600?v=11', 'https://picsum.photos/900/1600?v=21'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    model_id: null,
    name_id: null
  },
  {
    id: '3',
    name: 'Anillo Estelar',
    description: 'Anillo con diseño de estrella',
    cost: 20.00,
    price: 35.00,
    category_id: '3',
    subcategory_id: '8',
    cover_image: 'https://picsum.photos/900/1600?v=12',
    product_images: ['https://picsum.photos/900/1600?v=12', 'https://picsum.photos/900/1600?v=22'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    model_id: null,
    name_id: null
  },
  {
    id: '4',
    name: 'Pulsera Infinito',
    description: 'Pulsera con símbolo de infinito',
    cost: 25.00,
    price: 40.00,
    category_id: '4',
    subcategory_id: '3',
    cover_image: 'https://picsum.photos/900/1600?v=13',
    product_images: ['https://picsum.photos/900/1600?v=13', 'https://picsum.photos/900/1600?v=23'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    model_id: null,
    name_id: null
  }
];

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const handleError = (error: any): string => {
  console.error('API Error:', error);
  return error?.message || 'An unexpected error occurred';
};

const createResponse = <T>(data: T | null, error: string | null): ApiResponse<T> => ({
  data,
  error,
  success: !error,
});

const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

// =====================================================
// CATEGORIES API
// =====================================================

export const categoriesApi = {
  async getAll(): Promise<ApiResponse<Category[]>> {
    try {
      if (!isSupabaseAvailable()) {
        console.log('Using demo categories data');
        return createResponse(demoCategories, null);
      }

      const { data, error } = await supabase!
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      console.log('Supabase error, falling back to demo data');
      return createResponse(demoCategories, null);
    }
  },
};

// =====================================================
// SUBCATEGORIES API
// =====================================================

export const subcategoriesApi = {
  async getAll(): Promise<ApiResponse<Subcategory[]>> {
    try {
      if (!isSupabaseAvailable()) {
        console.log('Using demo subcategories data');
        return createResponse(demoSubcategories, null);
      }

      const { data, error } = await supabase!
        .from('subcategories')
        .select('*')
        .order('name');

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      console.log('Supabase error, falling back to demo data');
      return createResponse(demoSubcategories, null);
    }
  },
};

// =====================================================
// PRODUCTS API
// =====================================================

export const productsApi = {
  async getAll(): Promise<ApiResponse<Product[]>> {
    try {
      if (!isSupabaseAvailable()) {
        console.log('Using demo products data');
        return createResponse(demoProducts, null);
      }

      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return createResponse(data || [], null);
    } catch (error) {
      console.log('Supabase error, falling back to demo data');
      return createResponse(demoProducts, null);
    }
  },
};

// =====================================================
// MAIN EXPORT
// =====================================================

export const productApi = {
  products: productsApi,
  categories: categoriesApi,
  subcategories: subcategoriesApi,
};