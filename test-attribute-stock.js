// Test script to verify attribute-specific stock deduction in sales
// This script tests the ProductSalesModal functionality

import { productApi } from '../lib/api';

async function testAttributeStockDeduction() {
  console.log('🧪 Testing attribute-specific stock deduction...');

  try {
    // Test 1: Get a product with variants
    const productId = 'test-product-id'; // Replace with actual product ID
    const variants = await productApi.productVariantInventory.getByProduct(productId);

    if (variants.success && variants.data && variants.data.length > 0) {
      console.log('✅ Found variants for product:', variants.data.length);

      // Test 2: Simulate stock update
      const testVariant = variants.data[0];
      const originalStock = testVariant.quantity;
      const saleQuantity = 2;

      console.log(`📦 Original stock: ${originalStock}`);
      console.log(`🛒 Sale quantity: ${saleQuantity}`);

      // Update stock
      const updateResult = await productApi.productVariantInventory.updateStock(
        testVariant.id,
        Math.max(0, originalStock - saleQuantity)
      );

      if (updateResult.success) {
        console.log('✅ Stock updated successfully');
        console.log(`📦 New stock: ${Math.max(0, originalStock - saleQuantity)}`);
      } else {
        console.log('❌ Failed to update stock:', updateResult.error);
      }
    } else {
      console.log('⚠️ No variants found for test product');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAttributeStockDeduction();