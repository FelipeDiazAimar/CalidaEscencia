'use client';

import { useState } from 'react';

const isDevelopment = process.env.NODE_ENV !== 'production';

const resolveCheckoutUrl = (data: any) => {
  if (!data) {
    return null;
  }

  if (isDevelopment) {
    return data?.sandbox_init_point ?? data?.init_point ?? null;
  }

  return data?.init_point ?? data?.sandbox_init_point ?? null;
};

export default function TestMPPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPreference = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: 'test-product',
            title: 'Producto de Prueba - Pago Aprobado',
            quantity: 1,
            unit_price: 25.00,
            currency_id: 'USD'
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      }

      setResult(data);

      // Si hay una URL de checkout, abrirla
      const checkoutUrl = resolveCheckoutUrl(data);

      if (checkoutUrl) {
        console.log('Opening checkout URL:', checkoutUrl);
        // En un entorno real, redirigiríamos automáticamente
        // window.location.href = checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testApprovedPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: 'test-approved',
            title: 'Producto de Prueba - Pago Aprobado',
            quantity: 1,
            unit_price: 25.00,
            currency_id: 'USD'
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      }

      setResult(data);

      const checkoutUrl = resolveCheckoutUrl(data);

      if (checkoutUrl) {
        console.log('Opening checkout URL:', checkoutUrl);
        // Abrir en nueva ventana para testing
        window.open(checkoutUrl, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <h1 className="text-3xl font-bold mb-8">🧪 Prueba de Integración Mercado Pago</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panel de pruebas */}
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Crear Preferencia de Pago</h2>

              <div className="space-y-3">
                <button
                  onClick={testPreference}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creando...' : 'Crear Preferencia Simple'}
                </button>

                <button
                  onClick={testApprovedPayment}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creando...' : 'Crear y Abrir Checkout (Pago Aprobado)'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Tarjetas de Prueba</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Pago Aprobado:</strong><br />
                  Nombre: APRO<br />
                  DNI: 12345678
                </div>
                <div>
                  <strong>Pago Rechazado:</strong><br />
                  Nombre: OTHE<br />
                  DNI: 12345678
                </div>
                <div>
                  <strong>Pago Pendiente:</strong><br />
                  Nombre: CONT<br />
                  DNI: (vacío)
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Resultado</h2>

            {result ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <strong>✅ Preferencia creada exitosamente!</strong>
                </div>

                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {result.id}</div>
                  <div><strong>Estado:</strong> {result.status}</div>

                  {resolveCheckoutUrl(result) && (
                    <div>
                      <strong>URL recomendada:</strong>
                      <a
                        href={resolveCheckoutUrl(result) as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {resolveCheckoutUrl(result)}
                      </a>
                      {isDevelopment ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Usando checkout sandbox porque estamos en entorno de pruebas.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          En producción utilizamos el checkout oficial de Mercado Pago.
                        </p>
                      )}
                    </div>
                  )}

                  {!isDevelopment && result.sandbox_init_point && (
                    <div>
                      <strong>URL Sandbox (solo pruebas manuales):</strong>
                      <a
                        href={result.sandbox_init_point}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {result.sandbox_init_point}
                      </a>
                    </div>
                  )}

                  {result.items && (
                    <div>
                      <strong>Items:</strong>
                      <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(result.items, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Haz clic en un botón para crear una preferencia de pago
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Instrucciones de Prueba</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Crea una preferencia de pago usando uno de los botones</li>
            <li>Si usas "Crear y Abrir Checkout", se abrirá una nueva ventana con Mercado Pago</li>
            <li>En Mercado Pago, selecciona una tarjeta de prueba</li>
            <li>Usa los datos de prueba mostrados arriba según el resultado deseado</li>
            <li>Completa el pago y verifica que regreses a las páginas de resultado</li>
            <li>Revisa la consola del navegador y los logs del servidor para verificar webhooks</li>
          </ol>
          <div className="mt-4 text-sm text-muted-foreground bg-muted/40 border border-muted-foreground/20 rounded p-3">
            <strong>⚠️ Nota:</strong> si ves el mensaje <em>"Una de las partes con la que intentás hacer el pago es de prueba"</em>
            significa que abriste el checkout de producción con credenciales de prueba. Para pruebas usa siempre la URL sandbox que
            aparece arriba o inicia sesión con un usuario comprador real en Mercado Pago.
          </div>
        </div>
      </div>
    </div>
  );
}