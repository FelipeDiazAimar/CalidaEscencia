import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    return NextResponse.json({
      accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'NOT SET',
      publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'NOT SET',
      baseUrl,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check env vars' }, { status: 500 });
  }
}