const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking database tables...\n');

  // Check orders table
  try {
    const { data, error } = await supabase.from('orders').select('id').limit(1);
    if (error && error.code === 'PGRST116') {
      console.log('❌ Orders table does not exist');
    } else if (error) {
      console.log('❌ Error checking orders table:', error.message);
    } else {
      console.log('✅ Orders table exists');
    }
  } catch (err) {
    console.log('❌ Orders table check failed:', err.message);
  }

  // Check order_items table
  try {
    const { data, error } = await supabase.from('order_items').select('id').limit(1);
    if (error && error.code === 'PGRST116') {
      console.log('❌ Order_items table does not exist');
    } else if (error) {
      console.log('✅ Order_items table exists');
    }
  } catch (err) {
    console.log('❌ Order_items table check failed:', err.message);
  }

  // Check products table (should exist)
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error && error.code === 'PGRST116') {
      console.log('❌ Products table does not exist');
    } else if (error) {
      console.log('✅ Products table exists');
    }
  } catch (err) {
    console.log('❌ Products table check failed:', err.message);
  }

  console.log('\n🔍 Testing order creation API...');

  // Test the order creation API
  try {
    const testOrder = {
      customer_name: 'Test User',
      customer_phone: '+50371234567',
      customer_email: 'test@example.com',
      items: [
        {
          product_id: 'test-product-id',
          product_name: 'Test Product',
          product_price: 10.00,
          quantity: 1
        }
      ]
    };

    const response = await fetch('http://localhost:9002/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    });

    const responseText = await response.text();
    console.log('API Response Status:', response.status);

    if (response.ok) {
      console.log('✅ Order API is working!');
      console.log('Response:', responseText);
    } else {
      console.log('❌ Order API failed:', responseText);
    }
  } catch (err) {
    console.log('❌ API test failed:', err.message);
  }
}

checkTables();