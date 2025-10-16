// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import type {
  ApiResponse,
  ProductVariantInventory,
  ProductVariantInventoryInsert,
  ProductVariantInventoryUpdate
} from '@/types/database';

export const productVariantInventoryApi = {
  // Get all product variant inventories
  async getAll(): Promise<ApiResponse<ProductVariantInventory[]>> {
    try {
      const { data, error } = await supabase
        .from('product_variant_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching product variant inventories:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getAll product variant inventories:', error);
      return { success: false, error: 'Failed to fetch product variant inventories' };
    }
  },

  // Get product variant inventories by product ID
  async getByProduct(productId: string): Promise<ApiResponse<ProductVariantInventory[]>> {
    try {
      const { data, error } = await supabase
        .from('product_variant_inventory')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching product variant inventories by product:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getByProduct:', error);
      return { success: false, error: 'Failed to fetch product variant inventories' };
    }
  },

  // Get product variant inventory by ID
  async getById(id: string): Promise<ApiResponse<ProductVariantInventory>> {
    try {
      const { data, error } = await supabase
        .from('product_variant_inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product variant inventory:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getById:', error);
      return { success: false, error: 'Failed to fetch product variant inventory' };
    }
  },

  // Create new product variant inventory
  async create(variant: ProductVariantInventoryInsert): Promise<ApiResponse<ProductVariantInventory>> {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { success: false, error: 'Supabase client not configured' };
      }

      const { data, error } = await supabase
        .from('product_variant_inventory')
        .insert(variant)
        .select()
        .single();

      if (error) {
        console.error('Error creating product variant inventory:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });

        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.code === '23503') { // foreign_key_violation
          errorMessage = 'El producto o atributo referenciado no existe';
        } else if (error.code === '42P01') { // table does not exist
          errorMessage = 'La tabla product_variant_inventory no existe. Por favor ejecuta la migración SQL.';
        }

        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in create product variant inventory:', error);
      return { success: false, error: 'Failed to create product variant inventory' };
    }
  },

  // Update product variant inventory
  async update(id: string, updates: ProductVariantInventoryUpdate): Promise<ApiResponse<ProductVariantInventory>> {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { success: false, error: 'Supabase client not configured' };
      }

      const { data, error } = await supabase
        .from('product_variant_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product variant inventory:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });

        let errorMessage = error.message;
        if (error.code === '23503') { // foreign_key_violation
          errorMessage = 'El producto o atributo referenciado no existe';
        }

        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in update product variant inventory:', error);
      return { success: false, error: 'Failed to update product variant inventory' };
    }
  },

  // Delete product variant inventory
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { success: false, error: 'Supabase client not configured' };
      }

      const { error } = await supabase
        .from('product_variant_inventory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product variant inventory:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in delete product variant inventory:', error);
      return { success: false, error: 'Failed to delete product variant inventory' };
    }
  },

  // Bulk update quantities for a product
  async bulkUpdateQuantities(productId: string, updates: { attributeId: string; quantity: number }[]): Promise<ApiResponse<boolean>> {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { success: false, error: 'Supabase client not configured' };
      }

      // Start a transaction-like operation
      const results = [];

      for (const update of updates) {
        const { data: existingVariants, error: fetchError } = await supabase
          .from('product_variant_inventory')
          .select('id')
          .eq('product_id', productId)
          .eq('variant_data->>attribute_id', update.attributeId);

        if (fetchError) {
          console.error('Error fetching variant for update:', fetchError);
          results.push({ success: false, error: fetchError.message });
          continue;
        }

        if (existingVariants && existingVariants.length > 0) {
          // Update existing
          const { error: updateError } = await supabase
            .from('product_variant_inventory')
            .update({ quantity: update.quantity })
            .eq('id', existingVariants[0].id);

          results.push({ success: !updateError, error: updateError?.message });
        } else {
          // Create new
          const { error: createError } = await supabase
            .from('product_variant_inventory')
            .insert({
              product_id: productId,
              variant_data: { attribute_id: update.attributeId },
              quantity: update.quantity,
              reserved_quantity: 0,
              is_active: true
            });

          results.push({ success: !createError, error: createError?.message });
        }
      }

      const hasErrors = results.some(r => !r.success);
      return {
        success: !hasErrors,
        data: !hasErrors,
        error: hasErrors ? 'Some updates failed' : undefined
      };
    } catch (error) {
      console.error('Error in bulk update quantities:', error);
      return { success: false, error: 'Failed to bulk update quantities' };
    }
  }
};