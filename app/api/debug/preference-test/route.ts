import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING PREFERENCE CREATION ===');

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token not found' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Create preference with minimal data first
    const minimalPreferenceData = {
      items: [{
        id: 'test',
        title: 'Test Product',
        unit_price: 10,
        quantity: 1,
        currency_id: 'USD'
      }]
    };

    console.log('Creating minimal preference:', JSON.stringify(minimalPreferenceData, null, 2));

    const result = await preference.create({ body: minimalPreferenceData });
    console.log('Minimal preference created successfully:', result.id);

    // Now try with the full body
    console.log('Creating full preference with request body...');
    const fullResult = await preference.create({ body });

    return NextResponse.json({
      minimal: {
        id: result.id,
        init_point: result.init_point
      },
      full: {
        id: fullResult.id,
        init_point: fullResult.init_point
      }
    });

  } catch (error) {
    console.error('Preference creation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined
    }, { status: 500 });
  }
}