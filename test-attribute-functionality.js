// Script to test attribute stock functionality
const { createClient } = require('@supabase/supabase-js');

async function testAttributeStock() {
  try {
    require('dotenv').config({ path: '.env.local' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check if tables exist by trying to query them
    console.log('🔍 Checking if tables exist...');

    try {
      const { data: combinations, error: combinationsError } = await supabase
        .from('product_attribute_combinations')
        .select('count')
        .limit(1);

      if (combinationsError) {
        console.log('❌ product_attribute_combinations table does not exist:', combinationsError.message);
      } else {
        console.log('✅ product_attribute_combinations table exists');
      }
    } catch (e) {
      console.log('❌ product_attribute_combinations table does not exist');
    }

    try {
      const { data: variants, error: variantsError } = await supabase
        .from('product_variant_inventory')
        .select('count')
        .limit(1);

      if (variantsError) {
        console.log('❌ product_variant_inventory table does not exist:', variantsError.message);
      } else {
        console.log('✅ product_variant_inventory table exists');
      }
    } catch (e) {
      console.log('❌ product_variant_inventory table does not exist');
    }

    // Test 2: Check available attributes
    console.log('\n🔍 Checking available attributes...');

    try {
      const { data: attributes, error: attributesError } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
      } else {
        console.log('🎨 Available attributes:', attributes?.length || 0);
        attributes?.forEach((attr, index) => {
          console.log(`  ${index + 1}. ${attr.name} (${attr.value}) - ${attr.type} [${attr.subcategory_id}]`);
        });
      }
    } catch (e) {
      console.log('❌ Error checking attributes');
    }

    // Test 3: Check products table structure
    console.log('\n🔍 Checking products table structure...');

    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else if (products && products.length > 0) {
        console.log('📋 Product columns:', Object.keys(products[0]));
        console.log('📦 Sample product:', products[0]);
      } else {
        console.log('⚠️ No products found');
      }
    } catch (e) {
      console.log('❌ Error checking products table');
    }

    // Test 4: Find products (without attribute_ids)
    console.log('\n🔍 Finding products...');

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(10);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    console.log('📦 Products found:', products?.length || 0);
    products?.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (${product.id})`);
    });

    if (products && products.length > 0) {
      const testProduct = products[0];
      console.log(`\n🎯 Testing with product: ${testProduct.name} (${testProduct.id})`);

      // Test 3: Check variants for this product
      console.log('\n🔍 Checking variants for this product...');

      const { data: variants, error: variantsError } = await supabase
        .from('product_variant_inventory')
        .select('*')
        .eq('product_id', testProduct.id);

      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        return;
      }

      console.log('📊 Variants found:', variants?.length || 0);
      variants?.forEach((variant, index) => {
        console.log(`  ${index + 1}. ID: ${variant.id}, Quantity: ${variant.quantity}, Data:`, variant.variant_data);
      });

      // Test 4: Check attribute combinations
      console.log('\n🔍 Checking attribute combinations...');

      const { data: combinations, error: combinationsError } = await supabase
        .from('product_attribute_combinations')
        .select('*')
        .eq('product_id', testProduct.id);

      if (combinationsError) {
        console.error('Error fetching combinations:', combinationsError);
        return;
      }

      console.log('🔗 Combinations found:', combinations?.length || 0);
      combinations?.forEach((combo, index) => {
        console.log(`  ${index + 1}. Product: ${combo.product_id}, Attribute: ${combo.attribute_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAttributeStock();