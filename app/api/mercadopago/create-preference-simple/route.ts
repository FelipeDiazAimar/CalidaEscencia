import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

interface PreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
  currency_id?: string;
  picture_url?: string;
}

interface PreferenceBody {
  items: PreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING WITH VALIDATION ===');

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const body = await request.json() as PreferenceBody;
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { items, payer, metadata } = body;

    // Add validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items en el carrito' },
        { status: 400 }
      );
    }

    // Transform items
    const transformedItems = items.map((item: PreferenceItem) => ({
      id: item.id,
      title: item.title,
      description: item.description || item.title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      currency_id: item.currency_id || 'USD',
      picture_url: item.picture_url,
    }));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const resolvedBackUrls = {
      success: `${baseUrl}/payment/success`,
      failure: `${baseUrl}/payment/failure`,
      pending: `${baseUrl}/payment/pending`,
    };

    const resolvedNotificationUrl = `${baseUrl}/api/mercadopago/webhook`;

    const preferenceData: any = {
      items: transformedItems,
      // back_urls: resolvedBackUrls, // Commented out
      // auto_return: 'approved' as const, // Commented out
      // notification_url: resolvedNotificationUrl, // Commented out
      metadata: metadata || {},
      // statement_descriptor: 'CalidaEscencia', // Commented out
      // external_reference: `order_${Date.now()}`, // Commented out
    };

    if (payer) {
      preferenceData.payer = {
        name: payer.name,
        email: payer.email,
        phone: payer.phone
          ? {
              area_code: payer.phone.area_code,
              number: payer.phone.number,
            }
          : undefined,
      };
    }

    console.log('Preference data:', JSON.stringify(preferenceData, null, 2));

    const result = await preference.create({ body: preferenceData });

    console.log('Preference created successfully:', result.id);

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });

  } catch (error) {
    console.error('Error creating preference:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}