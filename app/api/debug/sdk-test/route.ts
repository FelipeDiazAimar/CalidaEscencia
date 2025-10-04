import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== TESTING SDK IMPORT ===');

    // Test basic import
    const { MercadoPagoConfig, Preference } = await import('mercadopago');
    console.log('SDK imported successfully');

    // Test environment variable
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    console.log('Access token exists:', !!accessToken);
    console.log('Token starts with:', accessToken?.substring(0, 10));

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token not found' }, { status: 500 });
    }

    // Test client creation
    const client = new MercadoPagoConfig({ accessToken });
    console.log('Client created successfully');

    const preference = new Preference(client);
    console.log('Preference client created successfully');

    return NextResponse.json({
      status: 'SDK test passed',
      tokenExists: !!accessToken,
      tokenPrefix: accessToken.substring(0, 10)
    });

  } catch (error) {
    console.error('SDK test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}