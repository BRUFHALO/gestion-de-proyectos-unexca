# Migración de Nombres de Carreras

Este conjunto de scripts permite estandarizar los nombres de carreras en la base de datos para que coincidan con el formato utilizado en la biblioteca digital.

## 🎓 Estándar de Nombres

Los nombres de carreras deben seguir exactamente este formato:

- `Ingeniería en Informática`
- `Administracion de Empresas`
- `Turismo`
- `Ingeniería Agroalimentaria`
- `Distribucion y Logistica`

## 📁 Scripts Disponibles

### 1. migrate_career_names.py
**Propósito:** Actualiza todos los nombres de carreras existentes en la base de datos al estándar.

**Uso:**
```bash
cd backend
python scripts/migrate_career_names.py
```

**Funciones:**
- Mapea nombres antiguos a nuevos nombres estándar
- Actualiza todos los proyectos existentes
- Actualiza la colección de carreras con definiciones estándar
- Genera un reporte de cambios realizados

### 2. validate_career_names.py
**Propósito:** Verifica que todos los nombres de carreras cumplan con el estándar.

**Uso:**
```bash
cd backend
python scripts/validate_career_names.py
```

**Funciones:**
- Valida todos los proyectos en la base de datos
- Valida la colección de carreras
- Reporta cualquier inconsistencia
- Retorna código de salida 0 si todo es válido, 1 si hay errores

## 🔄 Flujo de Trabajo Recomendado

### Antes de la migración:
1. **Validar estado actual:**
   ```bash
   python scripts/validate_career_names.py
   ```

2. **Hacer backup de la base de datos** (importante!)

### Durante la migración:
1. **Ejecutar migración:**
   ```bash
   python scripts/migrate_career_names.py
   ```

2. **Revisar el reporte de cambios**

### Después de la migración:
1. **Validar resultado:**
   ```bash
   python scripts/validate_career_names.py
   ```

2. **Probar la aplicación** para asegurar que todo funciona correctamente

## 📊 Mapeo de Nombres

El script de migración maneja las siguientes conversiones:

| Nombre Antiguo | Nombre Estándar |
|---------------|-----------------|
| `Ingeniería Informática` | `Ingeniería en Informática` |
| `Administración de Empresas` | `Administracion de Empresas` |
| `Administracion de Empresa` | `Administracion de Empresas` |
| `Distribución Logística` | `Distribucion y Logistica` |
| `Distribucion Logistica` | `Distribucion y Logistica` |
| `informatica` | `Ingeniería en Informática` |
| `administracion` | `Administracion de Empresas` |
| `distribucion` | `Distribucion y Logistica` |

## 🛠️ Actualizaciones Realizadas

### En los proyectos:
- Actualiza `academic_info.career_name` al nombre estándar
- Actualiza el campo `updated_at` con la fecha de migración

### En la colección de carreras:
- Inserta/actualiza las 5 carreras estándar con información completa
- Mantiene los códigos existentes (INF-001, ADM-001, etc.)

### En el modelo:
- Actualiza el ejemplo en `models/project.py` para reflejar los nombres estándar
- Agrega documentación sobre los nombres permitidos

## ⚠️ Precauciones

1. **Backup siempre:** Haz un backup de la base de datos antes de ejecutar la migración
2. **Prueba en desarrollo:** Ejecuta primero en un entorno de desarrollo
3. **Revisa el reporte:** El script muestra todos los cambios que realizará
4. **Valida después:** Siempre ejecuta el script de validación después de la migración

## 🔍 Solución de Problemas

### Si hay errores después de la migración:
1. Revisa el reporte del script de validación
2. Verifica que los nombres estén escritos exactamente como el estándar
3. Ejecuta nuevamente el script de migración si es necesario

### Si un nombre no está en el mapeo:
1. Agrega el mapeo manualmente en `CAREER_STANDARDIZATION`
2. Vuelve a ejecutar el script de migración

## 📝 Notas

- Los scripts son idempotentes: se pueden ejecutar múltiples veces sin causar problemas
- Solo se actualizan los proyectos que necesitan cambios
- La validación es case-sensitive: los nombres deben coincidir exactamente
