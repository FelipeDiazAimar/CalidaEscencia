import Link from 'next/link';
import { Clock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClearCartOnMount from '@/components/ClearCartOnMount';

export default function PaymentPendingPage({ searchParams }: any) {
  // Extraer todos los parámetros que Mercado Pago puede enviar
  const paymentId = searchParams?.payment_id || searchParams?.collection_id;
  const status = searchParams?.status || searchParams?.collection_status;
  const externalReference = searchParams?.external_reference;
  const merchantOrderId = searchParams?.merchant_order_id;
  const preferenceId = searchParams?.preference_id;
  const paymentType = searchParams?.payment_type;

  // Determinar si es un pago offline (que requiere acción del usuario)
  const isOfflinePayment = paymentType === 'ticket' || paymentType === 'atm' || paymentType === 'bank_transfer';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago Pendiente</h1>
          <p className="text-gray-600">Tu pago está siendo procesado.</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">¿Qué significa esto?</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                {isOfflinePayment ? (
                  <>
                    <p>Has elegido un método de pago offline. Para completar tu compra:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Imprime o guarda el comprobante de pago</li>
                      <li>Dirígete a un punto de pago autorizado</li>
                      <li>Realiza el pago antes de la fecha de vencimiento</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p>Tu pago está siendo verificado por el banco o entidad financiera.</p>
                    <p>Este proceso puede tomar desde unos minutos hasta 2 días hábiles.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <Button asChild className="w-full">
            <Link href="/checkout">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Checkout
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <RefreshCw className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Link>
          </Button>
        </div>

        {/* Información de depuración para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-gray-800 mb-2">Parámetros de Mercado Pago:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Payment ID:</strong> {paymentId || 'No disponible'}</p>
              <p><strong>Status:</strong> {status || 'No disponible'}</p>
              <p><strong>External Reference:</strong> {externalReference || 'No disponible'}</p>
              <p><strong>Merchant Order ID:</strong> {merchantOrderId || 'No disponible'}</p>
              <p><strong>Preference ID:</strong> {preferenceId || 'No disponible'}</p>
              <p><strong>Payment Type:</strong> {paymentType || 'No disponible'}</p>
            </div>
          </div>
        )}

        <ClearCartOnMount />
      </div>
    </div>
  );
}