import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING CREATE PREFERENCE ===');

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Crear preferencia con back_urls y notification_url
    const preferenceData = {
      items: [{
        id: 'test',
        title: 'Test Product',
        unit_price: 10,
        quantity: 1,
        currency_id: 'USD'
      }],
      back_urls: {
        success: 'http://localhost:9002/payment/success',
        failure: 'http://localhost:9002/payment/failure',
        pending: 'http://localhost:9002/payment/pending'
      },
      notification_url: 'http://localhost:9002/api/mercadopago/webhook'
    };

    console.log('Creating preference with:', JSON.stringify(preferenceData, null, 2));

    const result = await preference.create({ body: preferenceData });

    console.log('Preference created successfully:', result.id);

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });

  } catch (error) {
    console.error('Error creating preference:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}