# Guía de Autenticación con Cédula

## 🔐 Sistema de Login Implementado

El sistema ahora usa **cédula** como usuario y contraseñas específicas por rol.

## 👥 Lógica por Rol

### 📚 Estudiante
- **Usuario:** Cédula de identidad
- **Contraseña:** Su propia cédula
- **Funcionalidad automática:**
  - Al hacer login, el sistema detecta automáticamente:
    - Trayecto y semestre actual
    - Profesor asignado para la materia de proyecto
    - Materia de proyecto que está cursando
  - Esto permite conexión directa entre estudiante y su profesor

### 👨‍🏫 Docente
- **Usuario:** Cédula de identidad
- **Contraseña:** Contraseña fuerte (mínimo 8 caracteres)
  - Proporcionada por el coordinador
- **Funcionalidad automática:**
  - Al hacer login, el dashboard muestra:
    - Todos los proyectos de sus estudiantes asignados
    - Proyectos pendientes de evaluación
    - Historial de evaluaciones realizadas

### 👔 Coordinador
- **Usuario:** Cédula de identidad
- **Contraseña:** Contraseña fuerte (mínimo 9 caracteres)
- **Funcionalidad automática:**
  - Al hacer login, el dashboard muestra:
    - Avances de todos los profesores de proyecto
    - Proyectos aprobados listos para publicación
    - Chat con todos los profesores
    - Reportes y estadísticas generales

## 🗄️ Estructura de Datos

### Usuario Estudiante
```json
{
  "cedula": "27123456",
  "password": "hashed_27123456",
  "name": "María Rodríguez",
  "role": "student",
  "university_data": {
    "current_trayect": 3,
    "current_semester": 2,
    "career_code": "INF-001"
  },
  "assigned_teacher": {
    "teacher_id": "ObjectId(...)",
    "teacher_name": "Prof. Carlos Martínez",
    "subject_code": "PI-III",
    "subject_name": "Proyecto Integrador III"
  }
}
```

### Usuario Docente
```json
{
  "cedula": "15234567",
  "password": "hashed_strong_password",
  "name": "Prof. Carlos Martínez",
  "role": "teacher",
  "university_data": {
    "category": "Profesor Asociado",
    "department": "Computación"
  }
}
```

### Usuario Coordinador
```json
{
  "cedula": "12345678",
  "password": "hashed_very_strong_password",
  "name": "Dra. Carmen López",
  "role": "coordinator",
  "university_data": {
    "category": "Profesor Titular",
    "department": "Departamento de Computación"
  }
}
```

## 🔧 Configuración Inicial

### 1. Actualizar usuarios existentes
```bash
cd backend
python scripts/update_users_with_cedula.py
```

Este script:
- Agrega cédula a todos los usuarios
- Hashea las contraseñas
- Asigna profesores a estudiantes
- Crea índice único para cédula

### 2. Credenciales de Prueba

| Rol | Cédula | Contraseña | Nombre |
|-----|--------|------------|--------|
| Coordinador | 12345678 | Coord2025! | Dra. Carmen López |
| Profesor | 15234567 | Prof2025 | Prof. Carlos Martínez |
| Estudiante | 27123456 | 27123456 | María Rodríguez |
| Estudiante | 26987654 | 26987654 | Juan Pérez |

## 🔄 Flujo de Login

### 1. Estudiante hace login
```
1. Ingresa cédula: 27123456
2. Ingresa contraseña: 27123456
3. Sistema valida contra BD
4. Sistema carga:
   - Datos del estudiante
   - Profesor asignado (Prof. Martínez)
   - Materia actual (PI-III)
   - Trayecto y semestre (3, 2)
5. Redirige a StudentDashboard
6. Dashboard muestra:
   - Sus proyectos
   - Feedback del profesor
   - Chat directo con el profesor
```

### 2. Docente hace login
```
1. Ingresa cédula: 15234567
2. Ingresa contraseña: Prof2025
3. Sistema valida contra BD
4. Sistema carga:
   - Datos del profesor
   - Lista de estudiantes asignados
   - Proyectos pendientes de evaluación
5. Redirige a TeacherDashboard
6. Dashboard muestra:
   - Cola de proyectos para evaluar
   - Proyectos de sus estudiantes
   - Herramientas de evaluación
```

### 3. Coordinador hace login
```
1. Ingresa cédula: 12345678
2. Ingresa contraseña: Coord2025!
3. Sistema valida contra BD
4. Sistema carga:
   - Datos del coordinador
   - Todos los profesores
   - Todos los proyectos
   - Estadísticas generales
5. Redirige a CoordinatorDashboard
6. Dashboard muestra:
   - Avances de profesores
   - Proyectos para publicar
   - Chat con profesores
   - Reportes
```

## 🔐 Seguridad

### Hash de Contraseñas
- Se usa SHA-256 para hashear contraseñas
- En producción se recomienda bcrypt o argon2
- Las contraseñas nunca se guardan en texto plano

### Validación de Fortaleza
- **Estudiante:** Sin validación (usa su cédula)
- **Docente:** Mínimo 8 caracteres
- **Coordinador:** Mínimo 9 caracteres

### Índices de Base de Datos
- Cédula tiene índice único
- Email tiene índice único
- Búsquedas optimizadas

## 📡 Endpoints

### POST `/api/v1/auth/login`
Login con cédula y contraseña

**Request:**
```json
{
  "cedula": "27123456",
  "password": "27123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "_id": "...",
    "cedula": "27123456",
    "name": "María Rodríguez",
    "role": "student",
    "assigned_teacher": {
      "teacher_name": "Prof. Carlos Martínez",
      "subject_code": "PI-III"
    }
  }
}
```

### POST `/api/v1/auth/validate-cedula`
Verificar si una cédula existe

**Request:**
```json
{
  "cedula": "27123456"
}
```

**Response:**
```json
{
  "exists": true,
  "cedula": "27123456",
  "role": "student",
  "name": "María Rodríguez"
}
```

## 🧪 Pruebas

### Con cURL
```bash
# Login estudiante
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"cedula": "27123456", "password": "27123456"}'

# Login profesor
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"cedula": "15234567", "password": "Prof2025"}'

# Login coordinador
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"cedula": "12345678", "password": "Coord2025!"}'
```

### Con Frontend
```typescript
import { authAPI } from '../services/api';

const handleLogin = async () => {
  try {
    const response = await authAPI.loginWithCedula(cedula, password);
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate(`/${response.user.role}-dashboard`);
    }
  } catch (error) {
    console.error('Error en login:', error);
  }
};
```

## 📝 Notas Importantes

1. **Estudiantes:** Su contraseña siempre es su cédula
2. **Profesores:** Contraseña asignada por coordinador
3. **Coordinadores:** Contraseña fuerte de mínimo 9 caracteres
4. **Asignación automática:** Los estudiantes se asignan automáticamente a profesores según trayecto/semestre
5. **Detección automática:** El sistema detecta automáticamente la materia de proyecto actual del estudiante

## 🚀 Próximos Pasos

1. ✅ Login con cédula implementado
2. ✅ Validación de contraseñas
3. ✅ Asignación estudiante-profesor
4. ⏳ Detección automática de trayecto/semestre desde API UNEXCA
5. ⏳ Cambio de contraseña para docentes/coordinadores
6. ⏳ Recuperación de contraseña
7. ⏳ Tokens JWT para sesiones
