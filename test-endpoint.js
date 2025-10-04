async function testEndpoint() {
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
          unit_price: 10.50,
          quantity: 1,
          currency_id: 'USD'
        }],
        payer: {
          name: 'Usuario de Prueba'
        },
        metadata: {
          test: true
        }
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Response body:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Parsed response:', data);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();