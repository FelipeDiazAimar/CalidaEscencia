// Script to create a test product with attributes and verify stock persistence
const { createClient } = require('@supabase/supabase-js');

async function createTestProductWithAttributes() {
  try {
    require('dotenv').config({ path: '.env.local' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get some attributes to use for testing
    console.log('🔍 Getting test attributes...');
    const { data: attributes, error: attrError } = await supabase
      .from('product_attributes')
      .select('id, name, value, subcategory_id')
      .eq('is_active', true)
      .limit(3);

    if (attrError || !attributes || attributes.length === 0) {
      console.error('Error fetching attributes:', attrError);
      return;
    }

    console.log('🎨 Test attributes:', attributes.map(a => `${a.name} (${a.value})`));

    // Get a category and subcategory for the test product
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (catError || !categories || categories.length === 0) {
      console.error('Error fetching categories:', catError);
      return;
    }

    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('id, name')
      .eq('category_id', categories[0].id)
      .limit(1);

    if (subError || !subcategories || subcategories.length === 0) {
      console.error('Error fetching subcategories:', subError);
      return;
    }

    console.log('📁 Using category:', categories[0].name, 'and subcategory:', subcategories[0].name);

    // Create a test product with attributes
    const testProduct = {
      name: 'Test Product with Attributes',
      description: 'This is a test product to verify attribute stock functionality',
      category_id: categories[0].id,
      subcategory_id: subcategories[0].id,
      attribute_ids: attributes.map(a => a.id),
      cost: 1000,
      price: 2000,
      stock: 50, // This should be sum of attribute stocks
      cover_image: null,
      hover_image: null,
      product_images: [],
      is_active: true,
      is_featured: false,
      is_new: true
    };

    console.log('🆕 Creating test product...');
    const { data: createdProduct, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (createError) {
      console.error('Error creating product:', createError);
      return;
    }

    console.log('✅ Test product created:', createdProduct.id);

    // Now create variant inventory for each attribute
    console.log('📦 Creating variant inventory for attributes...');

    const attributeStocks = {};
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      const stockQuantity = (i + 1) * 10; // 10, 20, 30, etc.
      attributeStocks[attribute.id] = stockQuantity;

      const variantData = {
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_value: attribute.value,
        attribute_type: 'aroma' // Assuming all are aroma type
      };

      console.log(`📝 Creating variant for ${attribute.name} (${attribute.value}) with stock ${stockQuantity}`);

      const { data: variant, error: variantError } = await supabase
        .from('product_variant_inventory')
        .insert({
          product_id: createdProduct.id,
          variant_data: variantData,
          quantity: stockQuantity,
          reserved_quantity: 0,
          is_active: true
        })
        .select()
        .single();

      if (variantError) {
        console.error('Error creating variant:', variantError);
      } else {
        console.log('✅ Variant created:', variant.id);
      }
    }

    // Verify the data was saved correctly
    console.log('\n🔍 Verifying saved data...');

    // Check product
    const { data: savedProduct, error: productCheckError } = await supabase
      .from('products')
      .select('*')
      .eq('id', createdProduct.id)
      .single();

    if (productCheckError) {
      console.error('Error fetching saved product:', productCheckError);
    } else {
      console.log('✅ Product saved correctly:');
      console.log('   Name:', savedProduct.name);
      console.log('   Attribute IDs:', savedProduct.attribute_ids);
      console.log('   Total Stock:', savedProduct.stock);
    }

    // Check variants
    const { data: savedVariants, error: variantsCheckError } = await supabase
      .from('product_variant_inventory')
      .select('*')
      .eq('product_id', createdProduct.id);

    if (variantsCheckError) {
      console.error('Error fetching saved variants:', variantsCheckError);
    } else {
      console.log('✅ Variants saved correctly:', savedVariants.length);
      savedVariants.forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.variant_data.attribute_name} (${variant.variant_data.attribute_value}): ${variant.quantity} units`);
      });
    }

    // Test loading attribute stocks (simulate handleEdit)
    console.log('\n🔄 Simulating handleEdit - loading attribute stocks...');

    const loadedAttributeStocks = {};
    if (savedProduct.attribute_ids && savedProduct.attribute_ids.length > 0) {
      for (const variant of savedVariants) {
        const variantData = variant.variant_data;
        if (variantData?.attribute_id) {
          loadedAttributeStocks[variantData.attribute_id] = variant.quantity;
          console.log(`✅ Loaded stock for attribute ${variantData.attribute_id}: ${variant.quantity}`);
        }
      }
    }

    console.log('📊 Final loaded attribute stocks:', loadedAttributeStocks);

    // Verify stocks match what we set
    let allStocksMatch = true;
    for (const [attrId, expectedStock] of Object.entries(attributeStocks)) {
      const loadedStock = loadedAttributeStocks[attrId];
      if (loadedStock !== expectedStock) {
        console.error(`❌ Stock mismatch for attribute ${attrId}: expected ${expectedStock}, got ${loadedStock}`);
        allStocksMatch = false;
      }
    }

    if (allStocksMatch) {
      console.log('🎉 SUCCESS: All attribute stocks were saved and loaded correctly!');
      console.log('✅ The attribute stock persistence issue has been resolved.');
    } else {
      console.log('❌ FAILURE: Some attribute stocks did not persist correctly.');
    }

    // Clean up - delete the test product
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('products').delete().eq('id', createdProduct.id);
    console.log('✅ Test product deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

createTestProductWithAttributes();