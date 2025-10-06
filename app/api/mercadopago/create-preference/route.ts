import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes';

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
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  notification_url?: string;
  external_reference?: string;
  shipments?: PreferenceRequest['shipments'];
  payment_methods?: PreferenceRequest['payment_methods'];
}

function createMercadoPagoPreferenceClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
  }

  const client = new MercadoPagoConfig({ accessToken });
  return new Preference(client);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE PREFERENCE REQUEST ===');
    console.log('MERCADOPAGO_ACCESS_TOKEN exists:', !!process.env.MERCADOPAGO_ACCESS_TOKEN);
    console.log('Token starts with:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10));

    const preferenceClient = createMercadoPagoPreferenceClient();
    console.log('Preference client created successfully');

    const body = (await request.json()) as PreferenceBody;
    console.log('Request body:', JSON.stringify(body, null, 2));
    const {
      items,
      payer,
      metadata,
      back_urls,
      notification_url,
      external_reference,
      shipments,
      payment_methods,
    } = body;

    // Validar que tenemos items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items en el carrito' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:9002' : 'https://tu-dominio.com');

    // Configurar URLs de retorno según las mejores prácticas de Mercado Pago
    const resolvedBackUrls = back_urls || {
      success: process.env.MERCADOPAGO_SUCCESS_URL ?? `${baseUrl}/payment/success`,
      failure: process.env.MERCADOPAGO_FAILURE_URL ?? `${baseUrl}/payment/failure`,
      pending: process.env.MERCADOPAGO_PENDING_URL ?? `${baseUrl}/payment/pending`,
    };

    // Validar URLs en producción - Mercado Pago requiere URLs válidas
    const isProduction = process.env.NODE_ENV === 'production';
    const hasInvalidUrls = Object.values(resolvedBackUrls).some(url =>
      !url || url.includes('localhost') || url.includes('127.0.0.1')
    );

    if (isProduction && hasInvalidUrls) {
      console.warn('Warning: Invalid back_urls detected in production. Mercado Pago may reject the preference.');
      console.warn('Back URLs:', resolvedBackUrls);
    }

    const resolvedNotificationUrl =
      notification_url ?? process.env.MERCADOPAGO_NOTIFICATION_URL ?? `${baseUrl}/api/mercadopago/webhook`;

    const mergedPaymentMethods: PreferenceRequest['payment_methods'] = {
      excluded_payment_methods: payment_methods?.excluded_payment_methods ?? [],
      excluded_payment_types: payment_methods?.excluded_payment_types ?? [],
      installments: payment_methods?.installments ?? 12,
    };

    if (payment_methods?.default_installments != null) {
      mergedPaymentMethods.default_installments = payment_methods.default_installments;
    }

    if (payment_methods?.default_payment_method_id) {
      const isExcluded = (payment_methods.excluded_payment_methods ?? []).some(
        method => method.id === payment_methods.default_payment_method_id
      );

      if (!isExcluded) {
        mergedPaymentMethods.default_payment_method_id = payment_methods.default_payment_method_id;
      }
    }

    // Crear la preferencia de pago con configuración completa
    const defaultCurrencyId = process.env.MERCADOPAGO_CURRENCY_ID ?? 'ARS';

    const preferenceData: PreferenceRequest = {
      items: items.map((item: PreferenceItem) => ({
        id: item.id,
        title: item.title,
        description: item.description || item.title,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        currency_id: item.currency_id || defaultCurrencyId,
        picture_url: item.picture_url,
        category_id: 'services', // Categoría general para servicios/productos
      })),
      back_urls: resolvedBackUrls,
      notification_url: resolvedNotificationUrl,
      metadata: {
        ...metadata,
        integration_type: 'web',
        created_at: new Date().toISOString(),
      },
      statement_descriptor: 'AlgoBonitoSV - Ecommerce',
      external_reference: external_reference ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shipments,
      payment_methods: mergedPaymentMethods,
      expires: false, // La preferencia no expira
      expiration_date_from: undefined,
      expiration_date_to: undefined,
    };

    const shouldEnableAutoReturn = Boolean(
      resolvedBackUrls.success &&
      resolvedBackUrls.success.startsWith('https://') &&
      !resolvedBackUrls.success.includes('localhost') &&
      !resolvedBackUrls.success.includes('127.0.0.1')
    );

    if (shouldEnableAutoReturn) {
      preferenceData.auto_return = 'approved';
    }

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

    console.log('Creating preference with data:', JSON.stringify(preferenceData, null, 2));

    const result = await preferenceClient.create({ body: preferenceData });

    console.log('Preference created successfully:', result.id);

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });

  } catch (error) {
    console.error('Error creating preference:', error);

    let message = error instanceof Error ? error.message : 'Error interno del servidor';
    const extra: Record<string, unknown> = {};

    if (typeof error === 'object' && error !== null) {
      const maybeResponse = (error as { response?: { status?: number; data?: unknown } }).response;
      if (maybeResponse) {
        extra.mercadoPagoStatus = maybeResponse.status;
        extra.mercadoPagoData = maybeResponse.data;
        console.error('Mercado Pago response error:', maybeResponse.status, maybeResponse.data);
      }
    }

    return NextResponse.json({ error: message, ...extra }, { status: 500 });
  }
}