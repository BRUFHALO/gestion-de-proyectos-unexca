# Prueba de Lógica de Calificación

## 🎯 Objetivo
Verificar que el popup de calificación funciona correctamente según las reglas:

### 📝 Calificación Parcial
- ✅ Solo muestra status "En Revisión"
- ✅ El select está deshabilitado (no se puede cambiar)
- ✅ Muestra mensaje explicativo

### 🏆 Calificación Definitiva  
- ✅ Solo muestra status "Aprobado" y "Reprobado"
- ✅ El select está habilitado
- ✅ Muestra mensaje explicativo

## 🧪 Pasos para Probar

1. **Iniciar sesión como profesor**
   ```bash
   Cédula: 12345678
   Contraseña: profesor123
   ```

2. **Navegar al dashboard del profesor**

3. **Seleccionar un proyecto para evaluar**
   - Hacer clic en cualquier proyecto asignado
   - Se abrirá el visor PDF

4. **Abrir popup de calificación**
   - Hacer clic en el botón "📊 Calificar Proyecto"

5. **Probar Calificación Parcial**
   - Seleccionar "📝 Parcial (1-20)"
   - ✅ Verificar que el status muestre solo "🔄 En Revisión"
   - ✅ Verificar que el select esté deshabilitado
   - ✅ Verificar mensaje: "Las calificaciones parciales solo pueden tener status 'En Revisión'"

6. **Probar Calificación Definitiva**
   - Seleccionar "🏆 Definitiva (1-20)"
   - ✅ Verificar que el status muestre "✅ Aprobado" (por defecto)
   - ✅ Verificar que se pueda cambiar a "❌ Reprobado"
   - ✅ Verificar mensaje: "Las calificaciones definitivas deben ser 'Aprobado' o 'Reprobado'"

## 🔄 Comportamiento Esperado

### Cambiando de Parcial a Definitiva:
- Status cambia automáticamente de "En Revisión" a "Aprobado"
- Select se habilita
- Mensaje explicativo se actualiza

### Cambiando de Definitiva a Parcial:
- Status cambia automáticamente a "En Revisión"
- Select se deshabilita
- Mensaje explicativo se actualiza

## ✅ Criterios de Aceptación

- [ ] Calificación parcial solo permite "En Revisión"
- [ ] Calificación definitiva solo permite "Aprobado" o "Reprobado"
- [ ] El status cambia automáticamente al cambiar tipo de calificación
- [ ] Los mensajes explicativos son claros y útiles
- [ ] La interfaz es intuitiva y no permite errores

## 🐛 Posibles Problemas

Si algo no funciona:
1. Verificar que el componente `PDFEvaluationViewer.tsx` tenga los cambios
2. Revisar la consola del navegador por errores de JavaScript
3. Verificar que el backend acepte los status correctos
