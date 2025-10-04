# 🚀 Configuración del Sistema Financiero

## ❗ Error: Tablas no encontradas

Si ves errores como:
- `Could not find the table 'public.fixed_costs' in the schema cache`
- `Could not find the table 'public.salary_withdrawals' in the schema cache`

Significa que necesitas ejecutar los scripts SQL para crear las tablas en Supabase.

## 🔧 Solución Rápida

### Paso 1: Acceder a Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el Script de Corrección
1. Abre el archivo `fix_missing_tables.sql` (en la raíz del proyecto)
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** para ejecutar

### Paso 3: Verificar
Después de ejecutar el script, deberías ver:
- ✅ Tablas creadas exitosamente
- ✅ Datos de prueba insertados
- ✅ El dashboard funcionando sin errores

## 📁 Archivos SQL Importantes

| Archivo | Propósito |
|---------|-----------|
| `supabase_tables.sql` | Script principal con todas las tablas |
| `fix_missing_tables.sql` | Script de corrección para tablas faltantes |
| `update_tables_for_finance.sql` | Script con datos de prueba adicionales |

## 🏗️ Tablas que se Crean

### `fixed_costs` - Costos Fijos
- Alquiler, servicios, seguros, etc.
- Permite gestionar gastos recurrentes

### `salary_withdrawals` - Extracciones de Sueldo
- Registro de pagos a empleados
- Historial de extracciones

### `product_views` - Vistas de Productos
- Tracking de popularidad de productos
- Análisis de conversión ventas/vistas

### `product_profitability` (Vista)
- Cálculo automático de rentabilidad
- Métricas de rendimiento por producto

## 🎯 Funcionalidades que se Habilitan

Una vez configurado, tendrás acceso a:

1. **📊 Dashboard Financiero Completo**
   - Métricas de ventas vs gastos
   - Análisis de rentabilidad
   - Gráficos interactivos

2. **💰 Gestión de Costos Fijos**
   - Registro de gastos recurrentes
   - Cálculo de costos operativos

3. **👥 Gestión de Sueldos**
   - Registro de extracciones
   - Historial de pagos

4. **📈 Análisis de Productos**
   - Popularidad por vistas
   - Tasa de conversión
   - Rentabilidad real

## 🔍 Troubleshooting

### Error: "relation does not exist"
- **Solución**: Ejecutar `fix_missing_tables.sql`

### Error: "permission denied"
- **Causa**: Usuario sin permisos de admin
- **Solución**: Verificar RLS policies en Supabase

### Dashboard muestra datos vacíos
- **Causa**: No hay datos de prueba
- **Solución**: Ejecutar `update_tables_for_finance.sql`

## 📞 Soporte

Si persisten los errores después de ejecutar los scripts:

1. Verificar que el script se ejecutó completamente sin errores
2. Revisar la configuración de variables de entorno de Supabase
3. Verificar las políticas RLS (Row Level Security)

¡El sistema estará listo para usar después de estos pasos! 🎉