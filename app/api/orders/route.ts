import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api/products';
import type { OrderInsert } from '@/types/database';

// Tipo temporal para items sin order_id
interface OrderItemInput {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone, customer_email, items, notes } = body;

    // Validate required fields
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre, teléfono e items' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const total_amount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.price), 0
    );

    // Create order data
    const orderData: OrderInsert = {
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      status: 'pending',
      total_amount,
      notes: notes || null,
    };

    // Create order items data
    const orderItems: OrderItemInput[] = items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name || item.name, // Aceptar tanto product_name como name
      product_price: item.price, // Mapear price a product_price
      quantity: item.quantity,
      subtotal: item.price * item.quantity, // Calcular subtotal
    }));

    // Create order with items - convertir a OrderItemInsert agregando placeholders
    const orderItemsWithPlaceholder = orderItems.map(item => ({
      ...item,
      order_id: 'placeholder' // Se reemplazará en api.orders.create
    }));

    const response = await api.orders.create(orderData, orderItemsWithPlaceholder as any);

    if (response.error) {
      console.error('Error creating order:', response.error);
      return NextResponse.json(
        { error: 'Error al crear la orden' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: response.data,
      message: 'Orden creada exitosamente'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await api.orders.getAll();
    
    if (response.error) {
      return NextResponse.json(
        { error: 'Error al obtener órdenes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: response.data
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}