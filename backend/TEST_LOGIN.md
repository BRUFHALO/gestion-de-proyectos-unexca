# Pruebas de Login con Base de Datos

## 🔐 Sistema de Autenticación Implementado

El sistema de login ahora valida usuarios contra la base de datos MongoDB.

## 📋 Endpoints de Autenticación

### 1. POST `/api/v1/auth/login`
Validar credenciales de usuario

**Request:**
```json
{
  "email": "maria.rodriguez@unexca.edu.ve",
  "role": "student"
}
```

**Response (Éxito):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "_id": "...",
    "email": "maria.rodriguez@unexca.edu.ve",
    "name": "María Rodríguez",
    "role": "student",
    "university_data": { ... },
    "profile": { ... }
  }
}
```

**Response (Error):**
```json
{
  "detail": "Usuario no encontrado. Verifica tu email."
}
```

### 2. POST `/api/v1/auth/validate-email`
Verificar si un email existe

**Request:**
```json
{
  "email": "martinez@unexca.edu.ve"
}
```

**Response:**
```json
{
  "exists": true,
  "email": "martinez@unexca.edu.ve",
  "role": "teacher"
}
```

### 3. GET `/api/v1/auth/check-session/{user_id}`
Verificar sesión activa

**Response:**
```json
{
  "valid": true,
  "user": { ... }
}
```

## 🧪 Pruebas con cURL

### Login como Estudiante
```bash
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.rodriguez@unexca.edu.ve",
    "role": "student"
  }'
```

### Login como Profesor
```bash
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "martinez@unexca.edu.ve",
    "role": "teacher"
  }'
```

### Login como Coordinador
```bash
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coordinador@unexca.edu.ve",
    "role": "coordinator"
  }'
```

### Validar Email
```bash
curl -X POST "http://localhost:8005/api/v1/auth/validate-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.rodriguez@unexca.edu.ve"}'
```

## 🧪 Pruebas con Python

```python
import httpx
import asyncio

async def test_login():
    async with httpx.AsyncClient() as client:
        # Test 1: Login exitoso
        response = await client.post(
            "http://localhost:8005/api/v1/auth/login",
            json={
                "email": "maria.rodriguez@unexca.edu.ve",
                "role": "student"
            }
        )
        print("Login exitoso:", response.json())
        
        # Test 2: Email no existe
        try:
            response = await client.post(
                "http://localhost:8005/api/v1/auth/login",
                json={
                    "email": "noexiste@unexca.edu.ve",
                    "role": "student"
                }
            )
        except Exception as e:
            print("Error esperado:", e)
        
        # Test 3: Rol incorrecto
        try:
            response = await client.post(
                "http://localhost:8005/api/v1/auth/login",
                json={
                    "email": "maria.rodriguez@unexca.edu.ve",
                    "role": "teacher"  # María es estudiante, no profesora
                }
            )
        except Exception as e:
            print("Error esperado:", e)

asyncio.run(test_login())
```

## 👥 Usuarios de Prueba Disponibles

| Rol | Email | Nombre |
|-----|-------|--------|
| Coordinador | coordinador@unexca.edu.ve | Dra. Carmen López |
| Profesor | martinez@unexca.edu.ve | Prof. Carlos Martínez |
| Estudiante | maria.rodriguez@unexca.edu.ve | María Rodríguez |
| Estudiante | juan.perez@unexca.edu.ve | Juan Pérez |

## 🔄 Flujo de Login en el Frontend

1. Usuario selecciona su rol
2. Ingresa su email institucional
3. Frontend llama a `authAPI.login(email, role)`
4. Backend valida contra MongoDB:
   - ✅ Email existe
   - ✅ Usuario está activo
   - ✅ Rol coincide
5. Backend actualiza `last_login`
6. Frontend recibe datos del usuario
7. Frontend guarda en localStorage
8. Frontend redirige al dashboard correspondiente

## 🔐 Validaciones Implementadas

- ✅ Email debe existir en la base de datos
- ✅ Usuario debe estar activo (`is_active: true`)
- ✅ Rol debe coincidir con el seleccionado
- ✅ Se actualiza fecha de último login
- ✅ Mensajes de error descriptivos

## 📱 Uso en el Frontend

```typescript
import { authAPI } from '../services/api';

// Login
try {
  const response = await authAPI.login(email, role);
  if (response.success) {
    // Guardar usuario
    localStorage.setItem('user', JSON.stringify(response.user));
    // Redirigir
    navigate(`/${response.user.role}-dashboard`);
  }
} catch (error) {
  console.error('Error en login:', error);
  setError('Credenciales inválidas');
}
```

## 🚀 Próximos Pasos

1. ✅ Validación básica con email
2. ⏳ Agregar contraseñas (hash con bcrypt)
3. ⏳ Implementar JWT tokens
4. ⏳ Refresh tokens
5. ⏳ Logout y limpieza de sesión
6. ⏳ Recuperación de contraseña

## 📝 Notas Importantes

- Por ahora NO se validan contraseñas (solo email)
- El sistema verifica que el email exista en la BD
- Se actualiza automáticamente el `last_login`
- Los datos del usuario se devuelven completos
- El frontend debe guardar el usuario en localStorage o estado global
