const fetch = require('node-fetch');

async function testOrderAPI() {
  const testOrder = {
    customer_name: "Test User",
    customer_phone: "+50371234567",
    customer_email: "test@example.com",
    items: [
      {
        product_id: "test-product-1",
        product_name: "Test Product",
        price: 10.00,
        quantity: 2
      }
    ],
    notes: "Test order"
  };

  try {
    console.log('Testing order API...');
    console.log('Payload:', JSON.stringify(testOrder, null, 2));

    const response = await fetch('http://localhost:9002/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Order API working correctly');
    } else {
      console.log('❌ Order API failed');
    }

  } catch (error) {
    console.error('Error testing order API:', error.message);
  }
}

testOrderAPI();