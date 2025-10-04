const { MercadoPagoConfig, Preference } = require('mercadopago');
require('dotenv').config({ path: './.env.local' });

async function testMercadoPago() {
  try {
    console.log('Testing Mercado Pago SDK...');
    console.log('Access Token exists:', !!process.env.MERCADOPAGO_ACCESS_TOKEN);
    console.log('Token starts with:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10));

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    const preference = new Preference(client);
    console.log('Preference client created successfully');

    // Try to create a simple preference
    const result = await preference.create({
      body: {
        items: [{
          id: 'test',
          title: 'Test Product',
          unit_price: 10,
          quantity: 1,
          currency_id: 'USD'
        }],
        payer: {
          name: 'Test User'
        }
      }
    });

    console.log('Preference created successfully:', result.id);
    console.log('Init point:', result.init_point);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMercadoPago();