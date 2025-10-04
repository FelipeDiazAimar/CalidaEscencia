// Test script for Mercado Pago integration
const testPreference = async () => {
  try {
    const response = await fetch('http://localhost:9002/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          id: 'test-product',
          title: 'Producto de Prueba',
          quantity: 1,
          unit_price: 25.00,
          currency_id: 'USD'
        }]
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (data.init_point || data.sandbox_init_point) {
      console.log('✅ Preference created successfully!');
      console.log('Checkout URL:', data.init_point || data.sandbox_init_point);
    } else {
      console.log('❌ Failed to create preference');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testPreference();