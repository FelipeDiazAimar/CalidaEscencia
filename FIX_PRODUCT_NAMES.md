# Fix: Modal de Ventas - Uso de Nombres de Productos

## 🐛 **Problema Resuelto**

### Error Anterior:
```
Error message: "Could not find the table 'public.names' in the schema cache"
```

### Causa:
El modal estaba tratando de acceder a una tabla `names` separada que no existe en la base de datos.

## 🔧 **Solución Implementada**

### Cambio Principal:
En lugar de buscar nombres en una tabla separada, ahora extrae los nombres directamente de la columna `name` de los productos existentes.

### Cambios Técnicos:

1. **Eliminada dependencia de tabla `names`**:
   ```typescript
   // ❌ Antes
   const [names, setNames] = useState<Name[]>([]);
   api.names.getAll()
   
   // ✅ Ahora
   const [productNames, setProductNames] = useState<string[]>([]);
   // Extrae nombres únicos de products.name
   ```

2. **Nueva lógica de carga**:
   ```typescript
   // Extrae nombres únicos de los productos
   const uniqueNames = Array.from(new Set(products.map(p => p.name))).sort();
   setProductNames(uniqueNames);
   ```

3. **Filtrado actualizado**:
   ```typescript
   // ❌ Antes
   filtered.filter(p => p.name_id === formData.selectedName)
   
   // ✅ Ahora
   filtered.filter(p => p.name === formData.selectedName)
   ```

4. **Dropdown simplificado**:
   ```tsx
   // Muestra nombres directamente
   {productNames.map((name) => (
     <SelectItem key={name} value={name}>
       {name}
     </SelectItem>
   ))}
   ```

## 🎯 **Resultado**

- ✅ **Sin errores de base de datos**: No busca tablas inexistentes
- ✅ **Funcionalidad correcta**: Filtra por nombres reales de productos
- ✅ **Performance mejorada**: Una sola consulta en lugar de múltiples
- ✅ **Datos consistentes**: Usa exactamente los nombres que tienen los productos

## 🚀 **Flujo Final**

1. **Carga inicial**: Obtiene todos los productos activos
2. **Extrae nombres**: Crea lista única de nombres de productos
3. **Filtros**: 
   - Categoría (desde tabla categories)
   - Nombre (desde product.name)
   - Subcategoría (desde tabla subcategories)
4. **Selección**: Lista productos filtrados
5. **Cantidad**: Confirma venta

El modal ahora funciona correctamente usando solo las tablas que existen en la base de datos.