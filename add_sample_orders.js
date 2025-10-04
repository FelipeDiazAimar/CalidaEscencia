// =====================================================
// SCRIPT PARA AGREGAR DATOS DE EJEMPLO DE PEDIDOS
// =====================================================
// Ejecuta este código en la consola del navegador (F12)
// en la página http://localhost:9002/admin/finances
// =====================================================

// Datos de ejemplo para pedidos de stock
const sampleOrders = [
  {
    id: Date.now() + '-1',
    order_date: '2025-09-21',
    items: [
      { product_id: 'sample-1', product_name: 'Airpods Pro 2da Generación', quantity: 5 },
      { product_id: 'sample-2', product_name: 'Case iPhone 15 Pro', quantity: 10 },
      { product_id: 'sample-3', product_name: 'Cargador Lightning', quantity: 8 }
    ],
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: Date.now() + '-2',
    order_date: '2025-09-19',
    items: [
      { product_id: 'sample-4', product_name: 'Cargador USB-C', quantity: 15 },
      { product_id: 'sample-5', product_name: 'Protector de Pantalla iPhone 15', quantity: 20 },
      { product_id: 'sample-6', product_name: 'Auriculares Bluetooth', quantity: 6 }
    ],
    status: 'received',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: Date.now() + '-3',
    order_date: '2025-09-18',
    items: [
      { product_id: 'sample-7', product_name: 'Power Bank 10000mAh', quantity: 4 },
      { product_id: 'sample-8', product_name: 'Cable USB-C a Lightning', quantity: 12 },
      { product_id: 'sample-9', product_name: 'Soporte para Celular', quantity: 8 }
    ],
    status: 'pending',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: Date.now() + '-4',
    order_date: '2025-09-15',
    items: [
      { product_id: 'sample-10', product_name: 'Funda iPhone 14', quantity: 25 },
      { product_id: 'sample-11', product_name: 'Vidrio Templado Samsung', quantity: 30 }
    ],
    status: 'pending',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Agregar los pedidos a localStorage
localStorage.setItem('stockOrders', JSON.stringify(sampleOrders));

// Confirmación
console.log('✅ Datos de ejemplo agregados exitosamente!');
console.log('📦 Total de pedidos creados:', sampleOrders.length);
console.log('📋 Estado de los pedidos:');
sampleOrders.forEach((order, index) => {
  console.log(`   ${index + 1}. Pedido #${order.id.slice(-6)} - ${order.status} - ${order.items.length} productos`);
});

console.log('\n🔄 Recarga la página para ver los pedidos en la sección de Finanzas > Pedidos');
console.log('💡 También puedes crear nuevos pedidos desde Productos > Registrar Pedido');

// Funcionalidades disponibles
console.log('\n🎯 Funcionalidades disponibles:');
console.log('   ✏️  EDITAR: Click en el botón de editar (📝) para pedidos pendientes');
console.log('   ✅ RECIBIR: Click en "Marcar Recibido" para actualizar stock automáticamente');
console.log('   🗑️ ELIMINAR: Click en el botón de eliminar (🗑️) para borrar pedidos');
console.log('   📊 ANÁLISIS: Ve cálculos de costos, ingresos y ganancias potenciales');

// Mostrar instrucciones para recargar
alert('✅ Datos de ejemplo agregados!\n\n🔄 Recarga la página (F5) para ver los pedidos\n📍 Ve a la pestaña "Pedidos" en Finanzas\n\n✨ Nuevas funciones:\n• ✏️ Editar pedidos pendientes\n• 📊 Stock entrante en lugar de actual\n• ✅ Actualización automática de stock');