// Test script to verify attribute stock persistence
// This script tests that attribute stocks are properly saved and loaded

import { api } from '../lib/api/products';

async function testAttributeStockPersistence() {
  console.log('🧪 Testing attribute stock persistence...');

  try {
    // Test 1: Create a test product with attributes
    const testProduct = {
      name: 'Test Product with Attributes',
      description: 'Test product for attribute stock functionality',
      category_id: 'test-category-id', // Replace with actual category ID
      subcategory_id: 'test-subcategory-id', // Replace with actual subcategory ID
      attribute_ids: ['test-attribute-1', 'test-attribute-2'], // Replace with actual attribute IDs
      cost: 100,
      price: 200,
      stock: 5, // Total stock
      is_active: true,
      is_featured: false,
      is_new: false
    };

    console.log('📝 Creating test product...');
    const createResult = await api.products.create(testProduct);

    if (!createResult.success) {
      console.error('❌ Failed to create test product:', createResult.error);
      return;
    }

    const productId = createResult.data.id;
    console.log('✅ Test product created:', productId);

    // Test 2: Add attribute stock
    console.log('📦 Adding attribute stock...');
    const attributeStocks = {
      'test-attribute-1': 2,
      'test-attribute-2': 3
    };

    for (const [attributeId, stock] of Object.entries(attributeStocks)) {
      const variantData = {
        attribute_id: attributeId,
        attribute_name: 'Test Attribute',
        attribute_value: `Value ${attributeId.slice(-1)}`,
        attribute_type: 'variant'
      };

      const variantResult = await api.productVariantInventory.create({
        product_id: productId,
        variant_data: variantData,
        quantity: stock,
        reserved_quantity: 0,
        is_active: true
      });

      if (!variantResult.success) {
        console.error(`❌ Failed to create variant for ${attributeId}:`, variantResult.error);
      } else {
        console.log(`✅ Created variant for ${attributeId} with stock ${stock}`);
      }
    }

    // Test 3: Load attribute stocks
    console.log('📖 Loading attribute stocks...');
    const variantsResult = await api.productVariantInventory.getByProduct(productId);

    if (variantsResult.success && variantsResult.data) {
      console.log('✅ Loaded variants:', variantsResult.data.length);
      for (const variant of variantsResult.data) {
        const variantData = variant.variant_data as any;
        console.log(`📊 Variant ${variant.id}: ${variantData?.attribute_id} = ${variant.quantity} units`);
      }
    } else {
      console.error('❌ Failed to load variants:', variantsResult.error);
    }

    // Test 4: Update attribute stock
    console.log('🔄 Updating attribute stock...');
    if (variantsResult.success && variantsResult.data && variantsResult.data.length > 0) {
      const firstVariant = variantsResult.data[0];
      const newStock = firstVariant.quantity + 1;

      const updateResult = await api.productVariantInventory.updateStock(firstVariant.id, newStock);

      if (updateResult.success) {
        console.log(`✅ Updated variant ${firstVariant.id} stock to ${newStock}`);
      } else {
        console.error('❌ Failed to update variant stock:', updateResult.error);
      }
    }

    // Cleanup: Delete test product
    console.log('🧹 Cleaning up test product...');
    // Note: This would require a delete function in the API

    console.log('🎉 Attribute stock persistence test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAttributeStockPersistence();