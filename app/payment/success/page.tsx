import Link from 'next/link';
import { CheckCircle, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClearCartOnMount from '@/components/ClearCartOnMount';

export default function PaymentSuccessPage({ searchParams }: any) {
  // Extraer todos los parámetros que Mercado Pago puede enviar
  const paymentId = searchParams?.payment_id || searchParams?.collection_id;
  const status = searchParams?.status || searchParams?.collection_status;
  const externalReference = searchParams?.external_reference;
  const merchantOrderId = searchParams?.merchant_order_id;
  const preferenceId = searchParams?.preference_id;
  const paymentType = searchParams?.payment_type;
  const siteId = searchParams?.site_id;
  const processingMode = searchParams?.processing_mode;

  // Determinar si el pago fue realmente exitoso
  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 'in_process';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <ClearCartOnMount />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {isApproved ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h1>
              <p className="text-gray-600">Tu pago ha sido procesado correctamente.</p>
            </>
          ) : isPending ? (
            <>
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago Pendiente</h1>
              <p className="text-gray-600">Tu pago está siendo procesado. Te notificaremos cuando se complete.</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Estado del Pago</h1>
              <p className="text-gray-600">Estado del pago: {status}</p>
            </>
          )}
        </div>

        {/* Mostrar detalles del pago si están disponibles */}
        {(paymentId || status || externalReference || merchantOrderId) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-700 mb-3">Detalles del pago:</h3>
            <div className="space-y-2 text-sm">
              {paymentId && (
                <div>
                  <span className="text-gray-500">ID de pago:</span>
                  <span className="ml-2 font-mono text-gray-800">{paymentId}</span>
                </div>
              )}
              {status && (
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <span className={`ml-2 capitalize ${
                    status === 'approved' ? 'text-green-600' :
                    status === 'pending' || status === 'in_process' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {status}
                  </span>
                </div>
              )}
              {externalReference && (
                <div>
                  <span className="text-gray-500">Referencia:</span>
                  <span className="ml-2 font-mono text-gray-800">{externalReference}</span>
                </div>
              )}
              {merchantOrderId && (
                <div>
                  <span className="text-gray-500">Orden de Mercado Pago:</span>
                  <span className="ml-2 font-mono text-gray-800">{merchantOrderId}</span>
                </div>
              )}
              {paymentType && (
                <div>
                  <span className="text-gray-500">Tipo de pago:</span>
                  <span className="ml-2 capitalize text-gray-800">{paymentType.replace('_', ' ')}</span>
                </div>
              )}
              {preferenceId && (
                <div>
                  <span className="text-gray-500">ID de preferencia:</span>
                  <span className="ml-2 font-mono text-gray-800 text-xs">{preferenceId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensajes específicos según el estado */}
        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>¿Qué sucede ahora?</strong><br />
              Tu pago está siendo procesado. Si elegiste un método de pago offline (como pago en efectivo o transferencia),
              deberás completar el pago en el establecimiento correspondiente.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
            <Package className="h-4 w-4 mr-2" /> Recibirás un email con los detalles de tu pedido
          </div>

          <Link href="/">
            <Button className="w-full" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
            </Button>
          </Link>

          <Link href="/orders" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Ver mis pedidos
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.</p>
      </div>
    </div>
  );
}