import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook signature validation function
function validateWebhookSignature(
  signature: string,
  requestId: string,
  dataId: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    // Create the manifest string as per Mercado Pago documentation
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedSignature = hmac.digest('hex');

    // Extract v1 hash from signature header
    const signatureParts = signature.split(',');
    let receivedHash = '';

    for (const part of signatureParts) {
      const [key, value] = part.split('=');
      if (key === 'v1') {
        receivedHash = value;
        break;
      }
    }

    return calculatedSignature === receivedHash;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

// Function to process payment notification
async function processPaymentNotification(paymentId: string) {
  try {
    console.log(`Processing payment notification for ID: ${paymentId}`);

    // Get full payment details from Mercado Pago API
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment: ${response.status} ${response.statusText}`);
    }

    const payment = await response.json();
    console.log('Payment details received:', JSON.stringify(payment, null, 2));

    // Extract relevant information
    const {
      id,
      status,
      status_detail,
      payment_type_id,
      transaction_amount,
      external_reference,
      date_created,
      date_approved,
      description
    } = payment;

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('payments')
      .upsert({
        mercadopago_payment_id: id,
        status,
        status_detail,
        payment_type: payment_type_id,
        amount: transaction_amount,
        external_reference,
        date_created,
        date_approved,
        description,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'mercadopago_payment_id'
      });

    if (updateError) {
      console.error('Error updating payment in database:', updateError);
      throw updateError;
    }

    // If payment is approved, update order status
    if (status === 'approved' && external_reference) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_date: date_approved,
          updated_at: new Date().toISOString()
        })
        .eq('id', external_reference);

      if (orderError) {
        console.error('Error updating order status:', orderError);
      } else {
        console.log(`Order ${external_reference} marked as paid`);
      }
    }

    console.log(`Payment ${paymentId} processed successfully`);
    return true;

  } catch (error) {
    console.error(`Error processing payment ${paymentId}:`, error);
    throw error;
  }
}

// Function to process merchant order notification
async function processMerchantOrderNotification(orderId: string) {
  try {
    console.log(`Processing merchant order notification for ID: ${orderId}`);

    // Get merchant order details from Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch merchant order: ${response.status}`);
    }

    const orderData = await response.json();
    console.log('Merchant order details:', JSON.stringify(orderData, null, 2));

    // Update order information in database if needed
    // This is typically used for additional order tracking

    console.log(`Merchant order ${orderId} processed successfully`);
    return true;

  } catch (error) {
    console.error(`Error processing merchant order ${orderId}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = request.headers;

    console.log('=== MERCADO PAGO WEBHOOK RECEIVED ===');
    console.log('Headers:', Object.fromEntries(headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));

    // Extract webhook data
    const { action, type, data, live_mode, user_id } = body;

    // Optional: Validate webhook signature if secret is configured
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = headers.get('x-signature');
      const requestId = headers.get('x-request-id');
      const dataId = data?.id?.toString();

      if (signature && requestId && dataId) {
        // Extract timestamp from signature
        const signatureParts = signature.split(',');
        let timestamp = '';
        for (const part of signatureParts) {
          const [key, value] = part.split('=');
          if (key === 'ts') {
            timestamp = value;
            break;
          }
        }

        const isValidSignature = validateWebhookSignature(
          signature,
          requestId,
          dataId,
          timestamp,
          webhookSecret
        );

        if (!isValidSignature) {
          console.error('Invalid webhook signature');
          return NextResponse.json(
            { status: 'error', message: 'Invalid signature' },
            { status: 401 }
          );
        }

        console.log('Webhook signature validated successfully');
      }
    }

    // Process different event types
    switch (type) {
      case 'payment':
        if (action === 'payment.created' || action === 'payment.updated') {
          await processPaymentNotification(data.id.toString());
        }
        break;

      case 'merchant_order':
        if (action === 'merchant_order.created' || action === 'merchant_order.updated') {
          await processMerchantOrderNotification(data.id.toString());
        }
        break;

      default:
        console.log(`Unhandled webhook type: ${type}, action: ${action}`);
    }

    // Return success response (HTTP 200 or 201 as per Mercado Pago docs)
    return NextResponse.json(
      { status: 'success', received: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Still return 200 to Mercado Pago to avoid retries for processing errors
    // (they expect 200 for successful receipt, even if processing fails)
    return NextResponse.json(
      { status: 'error', message: 'Processing failed but webhook received' },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'webhook endpoint active',
    timestamp: new Date().toISOString(),
    configured_events: ['payment.created', 'payment.updated', 'merchant_order.created', 'merchant_order.updated'],
    signature_validation: process.env.MERCADOPAGO_WEBHOOK_SECRET ? 'enabled' : 'disabled'
  });
}