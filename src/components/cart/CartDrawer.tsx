"use client";

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { X, Plus, Minus } from 'lucide-react';
import MercadoPagoCheckout from '@/components/payment/MercadoPagoCheckout';

interface CheckoutData {
  customer_name: string;
  payment_method: string;
  delivery_method: string;
}

const SHIPPING_OPTIONS: Record<string, { label: string; icon: string; cost: number }> = {
  entrega: { label: 'Entrega a domicilio', icon: '🚚', cost: 0 },
  recoger: { label: 'Recoger en tienda', icon: '🏪', cost: 0 },
  coordinamos: { label: 'Coordinamos', icon: '🤝', cost: 0 },
};

const EMOJI = {
  wave: String.fromCodePoint(0x1F44B),
  person: String.fromCodePoint(0x1F464),
  package: String.fromCodePoint(0x1F4E6),
  moneyBag: String.fromCodePoint(0x1F4B0),
  creditCard: String.fromCodePoint(0x1F4B3),
  deliveryTruck: String.fromCodePoint(0x1F69A),
  bank: String.fromCodePoint(0x1F3E6),
  prayerHands: String.fromCodePoint(0x1F64F),
};

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customer_name: '',
    payment_method: 'mercadopago',
    delivery_method: 'entrega'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartSubtotal = total;
  const selectedShipping = SHIPPING_OPTIONS[checkoutData.delivery_method] ?? SHIPPING_OPTIONS.entrega;
  const shippingCost = selectedShipping.cost;
  const paymentSurcharge = checkoutData.payment_method === 'mercadopago'
    ? (cartSubtotal + shippingCost) * 0.10
    : 0;
  const finalTotal = cartSubtotal + shippingCost + paymentSurcharge;

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'mercadopago':
        return 'Mercado Pago';
      case 'cash':
        return 'Efectivo';
      case 'transfer':
        return 'Transferencia bancaria';
      default:
        return method;
    }
  };

  const handleWhatsAppOrder = async () => {
    setIsSubmitting(true);
    
    try {
      // Primero guardar la orden en la base de datos
      const orderData = {
        customer_name: checkoutData.customer_name,
        customer_phone: '+503 0000-0000', // Placeholder ya que no pedimos teléfono
        customer_email: '', // Opcional
        payment_method: checkoutData.payment_method,
        shipping_method: checkoutData.delivery_method,
        shipping_cost: shippingCost,
        payment_surcharge: paymentSurcharge,
        total_amount: finalTotal,
        notes: `Método de pago: ${getPaymentMethodLabel(checkoutData.payment_method)}. Entrega: ${selectedShipping.label}.`,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      // Guardar orden en la base de datos
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!result.success) {
        alert('Error al crear la orden: ' + result.error);
        return;
      }

      // Si se guardó exitosamente, crear mensaje para WhatsApp
      let message = `¡Hola! ${EMOJI.wave}\n\n`;
      message += "Quiero confirmar mi pedido:\n\n";
      
      // Agregar nombre del cliente
      message += `${EMOJI.person} *Mi nombre:* ${checkoutData.customer_name}\n\n`;
      
      // Agregar productos
      message += `${EMOJI.package} *Productos:*\n`;
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Cantidad: ${item.quantity}\n`;
        message += `   Precio: $${item.price}\n\n`;
      });
      
      // Agregar total
      message += `${EMOJI.moneyBag} *Subtotal: $${cartSubtotal.toFixed(2)}*\n`;
      if (shippingCost > 0) {
        message += `${EMOJI.deliveryTruck} *Envío (${selectedShipping.label}):* $${shippingCost.toFixed(2)}\n`;
      }
      if (paymentSurcharge > 0) {
        message += `${EMOJI.creditCard} *Recargo Mercado Pago (10%):* $${paymentSurcharge.toFixed(2)}\n`;
      }
      message += `\n${EMOJI.moneyBag} *Total: $${finalTotal.toFixed(2)}*\n\n`;
      
      // Agregar método de pago y entrega
      message += `${EMOJI.creditCard} *Método de pago:* ${getPaymentMethodLabel(checkoutData.payment_method)}\n`;
      message += `${EMOJI.deliveryTruck} *Método de entrega:* ${selectedShipping.label}\n\n`;
      
      // Agregar información bancaria si es transferencia
      if (checkoutData.payment_method === 'transfer') {
        message += `${EMOJI.bank} *Alias:* AlgoBonitoSV\n`;
        message += `${EMOJI.creditCard} *CBU:* 0000000000000000000000\n\n`;
      }
      
      message += `¡Espero su confirmación! ${EMOJI.prayerHands}`;
      
  // Abrir WhatsApp
  const whatsappUrl = `https://api.whatsapp.com/send?phone=5493564690844&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Limpiar carrito y cerrar
      clearCart();
      setShowCheckout(false);
      onClose();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error al enviar la orden. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-[10000]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <img 
                src="/bag.png" 
                alt="Carrito" 
                className="h-5 w-5" 
              />
              Carrito ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {showCheckout ? (
              <div className="p-4 space-y-6">
                <h3 className="text-lg font-semibold mb-4">Finalizar Pedido</h3>
                
                {/* Nombre del Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutData.customer_name}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Tu nombre completo"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de Pago *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="mercadopago"
                        checked={checkoutData.payment_method === 'mercadopago'}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="mr-2"
                      />
                      💳 Mercado Pago (Tarjetas, transferencias, efectivo)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cash"
                        checked={checkoutData.payment_method === 'cash'}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="mr-2"
                      />
                      💵 Efectivo (al recibir)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="transfer"
                        checked={checkoutData.payment_method === 'transfer'}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="mr-2"
                      />
                      🏦 Transferencia bancaria
                    </label>
                  </div>
                </div>

                {/* Método de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de Entrega *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="delivery_method"
                        value="entrega"
                        checked={checkoutData.delivery_method === 'entrega'}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, delivery_method: e.target.value }))}
                        className="mr-2"
                      />
                      {SHIPPING_OPTIONS.entrega.icon} {SHIPPING_OPTIONS.entrega.label}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="delivery_method"
                        value="recoger"
                        checked={checkoutData.delivery_method === 'recoger'}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, delivery_method: e.target.value }))}
                        className="mr-2"
                      />
                      {SHIPPING_OPTIONS.recoger.icon} {SHIPPING_OPTIONS.recoger.label}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="delivery_method"
                        value="coordinamos"
                        checked={checkoutData.delivery_method === 'coordinamos'}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, delivery_method: e.target.value }))}
                        className="mr-2"
                      />
                      {SHIPPING_OPTIONS.coordinamos.icon} {SHIPPING_OPTIONS.coordinamos.label}
                    </label>
                  </div>
                </div>

                {/* Resumen del pedido */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Resumen del pedido:</h4>
                  <div className="space-y-1 text-sm">
                    {items.map((item, index) => (
                      <div key={item.product_id} className="flex justify-between">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    {shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Envío ({selectedShipping.label})</span>
                        <span>${shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    {paymentSurcharge > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Recargo Mercado Pago (10%)</span>
                        <span>${paymentSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones */}
                <div className="space-y-4 pt-4">
                  {checkoutData.payment_method === 'mercadopago' ? (
                    <MercadoPagoCheckout
                      items={items}
                      subtotal={cartSubtotal}
                      shippingCost={shippingCost}
                      shippingLabel={selectedShipping.label}
                      paymentSurcharge={paymentSurcharge}
                      total={finalTotal}
                      customerName={checkoutData.customer_name}
                      paymentMethod={checkoutData.payment_method}
                      deliveryMethod={checkoutData.delivery_method}
                      onSuccess={() => {
                        clearCart();
                        setShowCheckout(false);
                        onClose();
                      }}
                      onError={(error) => {
                        alert('Error: ' + error);
                      }}
                    />
                  ) : (
                    <button
                      onClick={handleWhatsAppOrder}
                      disabled={!checkoutData.customer_name.trim() || isSubmitting}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Guardando orden...
                        </>
                      ) : (
                        <>
                          <svg 
                            viewBox="0 0 24 24" 
                            width="20" 
                            height="20" 
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.108"/>
                          </svg>
                          Confirmar Pedido por WhatsApp
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                  >
                    Volver al Carrito
                  </button>
                </div>
              </div>
            ) : (
              <>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <img 
                      src="/bag.png" 
                      alt="Carrito vacío" 
                      className="h-16 w-16 opacity-30 mb-4" 
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tu carrito está vacío</h3>
                    <p className="text-gray-500 text-center">
                      Agrega algunos productos para comenzar tu pedido.
                    </p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="space-y-4">
                      {items.map((item) => {
                        // Debug: Log cart item data
                        console.log('Cart item:', item);
                        console.log('Item category:', item.category);
                        console.log('Item subcategory:', item.subcategory);
                        
                        return (
                          <div key={item.product_id} className="flex items-center space-x-4 py-4 border-b">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-16 w-16 object-cover rounded-full"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </h4>
                              { (item.category || item.subcategory) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {item.category && <span className="mr-1">{item.category}</span>}
                                  {item.subcategory && <span className="text-gray-400">/ {item.subcategory}</span>}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">${item.price}</p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="p-1 rounded-md hover:bg-gray-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <span className="w-8 text-center text-sm">{item.quantity}</span>

                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                className="p-1 rounded-md hover:bg-gray-100"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.product_id)}
                              className="p-1 rounded-md hover:bg-gray-100 text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!showCheckout && items.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex justify-between text-lg font-semibold mb-4">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
                >
                  Continuar con el Pedido
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Vaciar Carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}