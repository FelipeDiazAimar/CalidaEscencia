// @ts-nocheck
// src/lib/api/stockOrders.ts
// NOTA: Este archivo tendrá errores de TypeScript hasta que se ejecute el SQL create_stock_orders_table.sql
// Estos errores son esperados porque Supabase aún no conoce las tablas stock_orders y stock_order_items
import { supabase } from '../supabaseClient';
import { api } from './products';

export interface StockOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  unit_price?: number;
  total_potential_income?: number;
  attribute_id?: string | null;
  attribute_name?: string | null;
  attribute_value?: string | null;
}

export interface StockOrder {
  id: string;
  order_date: string;
  status: 'pending' | 'received' | 'cancelled';
  total_items?: number;
  total_cost?: number;
  total_potential_income?: number;
  total_potential_profit?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface StockOrderWithDetails extends StockOrder {
  items: StockOrderItem[];
  // Legacy compatibility
  items_with_prices?: Array<StockOrderItem & {
    cost: number;
    price: number;
    current_stock: number;
  }>;
}

// Interfaces para inserción
export interface StockOrderInsert {
  order_date?: string;
  status?: 'pending' | 'received' | 'cancelled';
  notes?: string;
}

export interface StockOrderItemInsert {
  stock_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  unit_price?: number;
  total_potential_income?: number;
  attribute_id?: string | null;
  attribute_name?: string | null;
  attribute_value?: string | null;
}

// API para manejar pedidos de stock
export const stockOrdersApi = {
  // Obtener todos los pedidos con sus items
  getAll: async (): Promise<{ success: boolean; data: StockOrderWithDetails[]; error?: string }> => {
    try {
      const { data: orders, error } = await supabase!
        .from('stock_orders' as any)
        .select(`
          *,
          stock_order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_cost,
            total_cost,
            unit_price,
            total_potential_income,
            attribute_id,
            attribute_name,
            attribute_value,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock orders:', error);
        return {
          success: false,
          data: [],
          error: error.message
        };
      }

      const enrichedOrders: StockOrderWithDetails[] = orders?.map((order: any) => ({
        ...order,
        items: order.stock_order_items || []
      })) || [];

      return {
        success: true,
        data: enrichedOrders
      };
    } catch (error) {
      console.error('Error getting stock orders:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  // Crear un nuevo pedido de stock con sus items
  create: async (orderData: StockOrderInsert, items: Omit<StockOrderItemInsert, 'stock_order_id'>[]): Promise<{ success: boolean; data?: StockOrderWithDetails; error?: string }> => {
    try {
      // Obtener información de productos para calcular costos
      const productsResponse = await api.products.getAll();
      if (!productsResponse.success || !productsResponse.data) {
        return { success: false, error: 'Error obteniendo productos' };
      }

      const products = productsResponse.data;

      // Enriquecer items con información de precios
      const enrichedItems = items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const unitCost = product?.cost || 0;
        const unitPrice = product?.price || 0;
        
        return {
          ...item,
          unit_cost: unitCost,
          total_cost: unitCost * item.quantity,
          unit_price: unitPrice,
          total_potential_income: unitPrice * item.quantity
        };
      });

      // Crear el pedido principal
      const { data: order, error: orderError } = await supabase!
        .from('stock_orders' as any)
        .insert([{
          order_date: orderData.order_date || new Date().toISOString().split('T')[0],
          status: orderData.status || 'pending',
          notes: orderData.notes
        }] as any)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating stock order:', orderError);
        return { success: false, error: orderError.message };
      }

      // Crear los items del pedido
      const itemsToInsert = enrichedItems.map(item => ({
        ...item,
        stock_order_id: (order as any).id
      }));

      const { data: orderItems, error: itemsError } = await supabase!
        .from('stock_order_items' as any)
        .insert(itemsToInsert as any)
        .select();

      if (itemsError) {
        console.error('Error creating stock order items:', itemsError);
        // Limpiar pedido si falló la inserción de items
        await supabase!.from('stock_orders' as any).delete().eq('id', (order as any).id);
        return { success: false, error: itemsError.message };
      }

      // Retornar el pedido completo
      const result: StockOrderWithDetails = {
        ...order,
        items: orderItems || []
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error creating stock order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  // Actualizar estado de un pedido
  updateStatus: async (orderId: string, status: StockOrder['status']): Promise<{ success: boolean; error?: string }> => {
    try {
      // If marking as received, update inventory first
      if (status === 'received') {
        // Get the order items to update inventory
        const { data: orderData, error: fetchError } = await supabase!
          .from('stock_orders' as any)
          .select(`
            id,
            stock_order_items (
              product_id,
              quantity,
              attribute_id,
              attribute_name,
              attribute_value
            )
          `)
          .eq('id', orderId)
          .single();

        if (fetchError) {
          console.error('Error fetching order items for inventory update:', fetchError);
          return { success: false, error: `Error al obtener items del pedido: ${fetchError.message}` };
        }

        if (orderData?.stock_order_items) {
          // Update inventory for each item
          for (const item of orderData.stock_order_items) {
            if (item.attribute_id) {
              // Item has attributes - update product_variant_inventory
              const variantData = {
                attribute_id: item.attribute_id,
                attribute_name: item.attribute_name,
                attribute_value: item.attribute_value
              };

              // Check if variant exists
              const { data: existingVariant, error: checkError } = await supabase!
                .from('product_variant_inventory')
                .select('id, quantity')
                .eq('product_id', item.product_id)
                .eq('variant_data->>attribute_id', item.attribute_id)
                .single();

              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
                console.error('Error checking existing variant:', checkError);
                continue;
              }

              if (existingVariant) {
                // Update existing variant quantity
                const { error: updateError } = await supabase!
                  .from('product_variant_inventory')
                  .update({
                    quantity: existingVariant.quantity + item.quantity,
                    last_updated: new Date().toISOString()
                  })
                  .eq('id', existingVariant.id);

                if (updateError) {
                  console.error('Error updating variant inventory:', updateError);
                }
              } else {
                // Create new variant
                const { error: insertError } = await supabase!
                  .from('product_variant_inventory')
                  .insert({
                    product_id: item.product_id,
                    variant_data: variantData,
                    quantity: item.quantity,
                    reserved_quantity: 0,
                    is_active: true
                  });

                if (insertError) {
                  console.error('Error creating variant inventory:', insertError);
                }
              }
            } else {
              // Item without attributes - this shouldn't happen in current system
              // but keeping for backwards compatibility
              console.warn('Stock order item without attribute_id found - skipping inventory update');
            }
          }
        }
      }

      // Update the order status
      const { error } = await supabase!
        .from('stock_orders' as any)
        .update({
          status,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating stock order status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating stock order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  // Actualizar un pedido completo
  update: async (orderId: string, orderData: Partial<StockOrderInsert>, items?: Omit<StockOrderItemInsert, 'stock_order_id'>[]): Promise<{ success: boolean; error?: string }> => {
    try {
      // Actualizar el pedido principal
      const { error: orderError } = await supabase!
        .from('stock_orders' as any)
        .update({
          ...orderData,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating stock order:', orderError);
        return { success: false, error: orderError.message };
      }

      // Si se proporcionaron items, actualizarlos
      if (items) {
        // Primero eliminar items existentes
        const { error: deleteError } = await supabase!
          .from('stock_order_items' as any)
          .delete()
          .eq('stock_order_id', orderId);

        if (deleteError) {
          console.error('Error deleting old stock order items:', deleteError);
          return { success: false, error: deleteError.message };
        }

        // Obtener información de productos para calcular costos
        const productsResponse = await api.products.getAll();
        if (productsResponse.success && productsResponse.data) {
          const products = productsResponse.data;

          // Enriquecer items con información de precios
          const enrichedItems = items.map(item => {
            const product = products.find(p => p.id === item.product_id);
            const unitCost = product?.cost || 0;
            const unitPrice = product?.price || 0;
            
            return {
              ...item,
              stock_order_id: orderId,
              unit_cost: unitCost,
              total_cost: unitCost * item.quantity,
              unit_price: unitPrice,
              total_potential_income: unitPrice * item.quantity
            };
          });

          // Insertar nuevos items
          const { error: insertError } = await supabase!
            .from('stock_order_items' as any)
            .insert(enrichedItems as any);

          if (insertError) {
            console.error('Error inserting new stock order items:', insertError);
            return { success: false, error: insertError.message };
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating stock order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  // Eliminar un pedido
  delete: async (orderId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase!
        .from('stock_orders' as any)
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting stock order:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting stock order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  // Obtener un pedido específico por ID
  getById: async (orderId: string): Promise<{ success: boolean; data?: StockOrderWithDetails; error?: string }> => {
    try {
      const { data: order, error } = await supabase!
        .from('stock_orders' as any)
        .select(`
          *,
          stock_order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_cost,
            total_cost,
            unit_price,
            total_potential_income,
            created_at
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching stock order:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const result: StockOrderWithDetails = {
        ...order,
        items: (order as any).stock_order_items || []
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting stock order by id:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
};