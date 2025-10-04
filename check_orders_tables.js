const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  try {
    console.log('Checking orders table...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError) {
      console.log('❌ Orders table error:', ordersError.message);
      console.log('Code:', ordersError.code);
      console.log('Details:', ordersError.details);
    } else {
      console.log('✅ Orders table OK');
    }

    console.log('Checking order_items table...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    if (itemsError) {
      console.log('❌ Order items table error:', itemsError.message);
      console.log('Code:', itemsError.code);
      console.log('Details:', itemsError.details);
    } else {
      console.log('✅ Order items table OK');
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

checkTables();