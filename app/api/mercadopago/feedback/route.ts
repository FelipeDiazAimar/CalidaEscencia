import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const paymentId = params.get('payment_id');
    const status = params.get('status');
    const externalReference = params.get('external_reference');

    if (!paymentId) {
      return NextResponse.json(
        {
          message: 'No se recibió payment_id. Revisa los parámetros enviados por Mercado Pago.',
          params: Object.fromEntries(params.entries()),
        },
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    return NextResponse.json({
      payment,
      status,
      external_reference: externalReference,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener el pago';
    console.error('[MP_FEEDBACK]', message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
