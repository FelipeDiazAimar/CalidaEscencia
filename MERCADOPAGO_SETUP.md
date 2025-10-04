# Configuración de Mercado Pago - Instrucciones

## ✅ Completado

Hemos preparado todo el sistema para integrar Mercado Pago con tu aplicación:

### 1. Dependencias instaladas
- ✅ `mercadopago` SDK oficial
- ✅ `@types/uuid` para tipado

### 2. Estructura creada
- ✅ API endpoints en `/app/api/mercadopago/`
   - `create-preference/route.ts`
   - `feedback/route.ts`
   - `webhook/route.ts`
- ✅ Botón reutilizable `MercadoPagoCheckoutButton` en `/src/components/payments/mercadopago-checkout-button.tsx`
- ✅ Páginas de resultado de pago en `/app/payment/`
- ✅ Integración con el carrito existente

### 3. Base de datos
- ✅ Script SQL para crear tabla `payments`

## 🔧 Pasos para completar la configuración

### 1. Obtener credenciales de Mercado Pago

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com/developers)
2. Crea una aplicación o usa una existente
3. Obtén tus credenciales:
   - **Access Token** (TEST y PROD)
   - **Public Key** (TEST y PROD)

### 2. Configurar variables de entorno

Edita el archivo `.env.local` y reemplaza los valores de prueba con tus credenciales (puedes usar las sandbox que compartiste):

```bash
# Para desarrollo (sandbox/test)
MERCADOPAGO_ACCESS_TOKEN=TEST-TU_ACCESS_TOKEN_AQUI
MERCADOPAGO_PUBLIC_KEY=TEST-TU_PUBLIC_KEY_AQUI

# Para producción (cuando estés listo)
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-TU_ACCESS_TOKEN_DE_PRODUCCION
# MERCADOPAGO_PUBLIC_KEY=APP_USR-TU_PUBLIC_KEY_DE_PRODUCCION
```

### 3. Crear tabla en la base de datos

Ejecuta el script SQL `create_payments_table.sql` en tu base de datos Supabase:

1. Ve a tu panel de Supabase
2. Abre el "SQL Editor"
3. Pega el contenido del archivo `create_payments_table.sql`
4. Ejecuta el script

### 4. Configurar webhook (Opcional para desarrollo)

Para desarrollo local, puedes usar ngrok:

```bash
# Instalar ngrok si no lo tienes
npm install -g ngrok

# En desarrollo, exponer tu puerto local
ngrok http 9002

# Copiar la URL https que te da ngrok
# Actualizar MERCADOPAGO_NOTIFICATION_URL en .env.local
```

Para producción, usa tu dominio real.

### 5. Probar la integración

1. Inicia tu aplicación: `npm run dev`
2. Agrega productos al carrito u obtén el listado desde el admin
3. Usa el componente `MercadoPagoCheckoutButton` (o un `fetch` manual) para llamar a `/api/mercadopago/create-preference`
4. Serás redirigido al checkout de Mercado Pago (usa tarjetas de prueba)
5. Revisa los resultados:
   - Páginas `/payment/success`, `/payment/failure`, `/payment/pending`
   - Endpoint `/api/mercadopago/feedback` para depurar la respuesta de `back_urls`
   - Webhook `/api/mercadopago/webhook` (utiliza ngrok en local) para confirmar la actualización en Supabase

> 💡 **Importante:** en desarrollo utiliza siempre la URL `sandbox_init_point` que devuelve la API o el botón de pruebas en `/test-mp`. Si abres el `init_point` (checkout productivo) con tarjetas o usuarios de prueba, Mercado Pago mostrará el mensaje _"Una de las partes con la que intentás hacer el pago es de prueba"_. Para evitarlo, usa sandbox o inicia sesión con un comprador real cuando pruebes el flujo productivo.

## 📋 Características implementadas

### Frontend
- ✅ Componente de checkout con UI atractiva
- ✅ Integración con el carrito existente
- ✅ Selección entre Mercado Pago, efectivo y transferencia
- ✅ Páginas de resultado (éxito, fallo, pendiente)

### Backend
- ✅ Endpoint para crear preferencias de pago
- ✅ Webhook para recibir notificaciones
- ✅ Actualización automática del estado de órdenes
- ✅ Logging de pagos en base de datos

### Flujo completo
1. Usuario selecciona productos
2. Elige método de pago (Mercado Pago)
3. Se crea preferencia de pago
4. Usuario es redirigido a Mercado Pago
5. Completa el pago
6. Mercado Pago notifica el estado via webhook
7. Se actualiza la orden en la base de datos
8. Usuario ve resultado del pago

## 🔧 Configuraciones adicionales

### Personalización
- Cambia `currency_id` en el componente si no usas USD
- Modifica las URLs de retorno según tus necesidades
- Personaliza los textos y estilos del checkout

### Seguridad
- Las credenciales están en variables de entorno
- Los webhooks validan la fuente
- Los datos sensibles no se almacenan en frontend

### Monitoreo
- Todos los pagos se registran en la tabla `payments`
- Los logs incluyen datos completos para debugging
- Estados de órdenes se actualizan automáticamente

## 🚀 ¡Listo para usar!

Una vez que configures las credenciales, el sistema estará completamente operativo. Los usuarios podrán:

- Pagar con tarjetas de crédito/débito
- Usar transferencias bancarias
- Pagar en efectivo (puntos de pago)
- Tener compra protegida por Mercado Pago

¡Tu tienda online está lista para recibir pagos seguros! 🎉