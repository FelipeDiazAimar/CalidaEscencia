// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import type {
  ApiResponse,
  ProductAttribute,
  ProductAttributeInsert,
  ProductAttributeUpdate
} from '@/types/database';

export const productAttributesApi = {
  // Get all product attributes
  async getAll(): Promise<ApiResponse<ProductAttribute[]>> {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching product attributes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getAll product attributes:', error);
      return { success: false, error: 'Failed to fetch product attributes' };
    }
  },

  // Get product attributes by subcategory
  async getBySubcategory(subcategoryId: string): Promise<ApiResponse<ProductAttribute[]>> {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching product attributes by subcategory:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getBySubcategory:', error);
      return { success: false, error: 'Failed to fetch product attributes' };
    }
  },

  // Get product attribute by ID
  async getById(id: string): Promise<ApiResponse<ProductAttribute>> {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product attribute:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getById:', error);
      return { success: false, error: 'Failed to fetch product attribute' };
    }
  },

  // Create new product attribute
  async create(attribute: ProductAttributeInsert): Promise<ApiResponse<ProductAttribute>> {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { success: false, error: 'Supabase client not configured' };
      }

      const { data, error } = await supabase
        .from('product_attributes')
        .insert(attribute)
        .select()
        .single();

      if (error) {
        console.error('Error creating product attribute:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });

        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.code === '23505') { // unique_violation
          errorMessage = 'Ya existe un atributo con el mismo nombre y valor en esta subcategoría';
        } else if (error.code === '23503') { // foreign_key_violation
          errorMessage = 'La subcategoría seleccionada no existe';
        } else if (error.code === '42P01') { // table does not exist
          errorMessage = 'La tabla product_attributes no existe. Por favor ejecuta la migración SQL.';
        }

        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in create:', error);
      return { success: false, error: 'Failed to create product attribute' };
    }
  },

  // Update product attribute
  async update(id: string, updates: ProductAttributeUpdate): Promise<ApiResponse<ProductAttribute>> {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product attribute:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });

        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.code === '23505') { // unique_violation
          errorMessage = 'Ya existe un atributo con el mismo nombre y valor en esta subcategoría';
        } else if (error.code === '23503') { // foreign_key_violation
          errorMessage = 'La subcategoría seleccionada no existe';
        }

        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in update:', error);
      return { success: false, error: 'Failed to update product attribute' };
    }
  },

  // Delete product attribute
  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('product_attributes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product attribute:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error('Error in delete:', error);
      return { success: false, error: 'Failed to delete product attribute' };
    }
  },

  // Toggle active status
  async toggleActive(id: string): Promise<ApiResponse<ProductAttribute>> {
    try {
      // First get current status
      const current = await this.getById(id);
      if (!current.success) {
        return current;
      }

      // Toggle the status
      return this.update(id, { is_active: !current.data!.is_active });
    } catch (error) {
      console.error('Error in toggleActive:', error);
      return { success: false, error: 'Failed to toggle product attribute status' };
    }
  }
};