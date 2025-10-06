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
    const {
      customer_name,
      customer_phone,
      customer_email,
      items,
      notes,
      payment_method,
      shipping_method,
      shipping_cost,
      total_amount,
      payment_surcharge,
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre, teléfono e items' },
        { status: 400 }
      );
    }

    const itemsSubtotal = items.reduce((sum: number, item: any) =>
      sum + (Number(item.quantity) * Number(item.price ?? item.product_price ?? 0)), 0
    );

    const normalizedShippingCost = Number(shipping_cost ?? 0);
    const normalizedSurcharge = Number(payment_surcharge ?? 0);
    const calculatedSurcharge = payment_method === 'mercadopago' && !payment_surcharge
      ? (itemsSubtotal + normalizedShippingCost) * 0.10
      : normalizedSurcharge;
    const normalizedTotal = Number(total_amount ?? (itemsSubtotal + normalizedShippingCost + calculatedSurcharge));

    // Create order data
    const orderData: OrderInsert = {
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      status: 'pending',
      total_amount: Number(normalizedTotal.toFixed(2)),
      payment_method,
      shipping_method,
      shipping_cost: Number(normalizedShippingCost.toFixed(2)),
      notes: notes || null,
    };

    // Create order items data
    const orderItems: OrderItemInput[] = items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name || item.name, // Aceptar tanto product_name como name
      product_price: Number(item.price ?? item.product_price ?? 0), // Mapear price a product_price
      quantity: item.quantity,
      subtotal: Number((Number(item.price ?? item.product_price ?? 0) * Number(item.quantity)).toFixed(2)), // Calcular subtotal
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