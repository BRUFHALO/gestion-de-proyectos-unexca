# Guía de la API - Sistema de Gestión de Proyectos UNEXCA

## 🚀 Iniciar el Servidor

```bash
# Opción 1: Usando Python directamente
python main.py

# Opción 2: Usando Uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: `http://localhost:8000`

## 📚 Documentación Interactiva

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔍 Endpoints Disponibles

### Sistema

#### GET `/`
Información general del sistema
```json
{
  "message": "Sistema de Gestión de Proyectos UNEXCA",
  "version": "1.0.0",
  "status": "running",
  "database": "unexca_projects"
}
```

#### GET `/health`
Verificar estado del sistema
```json
{
  "status": "healthy",
  "database": "connected",
  "message": "Sistema funcionando correctamente"
}
```

---

### Usuarios

#### GET `/api/v1/users`
Obtener lista de usuarios

**Query Parameters:**
- `role` (opcional): student, teacher, coordinator
- `career_code` (opcional): Código de carrera
- `is_active` (opcional): true/false
- `skip` (opcional): Número de registros a saltar (default: 0)
- `limit` (opcional): Máximo de registros (default: 100, max: 100)

**Ejemplo:**
```bash
curl "http://localhost:8000/api/v1/users?role=student&limit=10"
```

#### GET `/api/v1/users/{user_id}`
Obtener un usuario específico por ID

**Ejemplo:**
```bash
curl "http://localhost:8000/api/v1/users/507f1f77bcf86cd799439011"
```

#### GET `/api/v1/users/email/{email}`
Obtener un usuario por email

**Ejemplo:**
```bash
curl "http://localhost:8000/api/v1/users/email/maria.rodriguez@unexca.edu.ve"
```

#### PUT `/api/v1/users/{user_id}/profile`
Actualizar perfil de usuario

**Body:**
```json
{
  "phone": "+58-414-1234567",
  "bio": "Nueva biografía",
  "preferences": {
    "language": "es",
    "notifications": true
  }
}
```

#### GET `/api/v1/users/stats/summary`
Estadísticas generales de usuarios

**Response:**
```json
{
  "total_users": 4,
  "active_users": 4,
  "by_role": {
    "students": 2,
    "teachers": 1,
    "coordinators": 1
  }
}
```

---

### Proyectos

#### GET `/api/v1/projects`
Obtener lista de proyectos

**Query Parameters:**
- `status` (opcional): draft, submitted, in_review, approved, rejected, published
- `career_code` (opcional): Código de carrera
- `year` (opcional): Año del proyecto
- `created_by` (opcional): ID del autor
- `skip` (opcional): Paginación (default: 0)
- `limit` (opcional): Máximo de registros (default: 50, max: 100)

**Ejemplo:**
```bash
curl "http://localhost:8000/api/v1/projects?status=approved&career_code=INF-001"
```

#### GET `/api/v1/projects/{project_id}`
Obtener un proyecto específico

#### GET `/api/v1/projects/{project_id}/versions`
Obtener historial de versiones de un proyecto

**Response:**
```json
{
  "project_id": "...",
  "title": "Implementación de IA en Planificación Urbana",
  "current_version": 3,
  "total_versions": 3,
  "versions": [
    {
      "version_number": 1,
      "version_name": "v1.0 - Entrega Inicial",
      "status": "rejected",
      "created_at": "2024-01-15T10:00:00Z",
      "grade": 78,
      "feedback_count": 5,
      "files_count": 1
    }
  ]
}
```

#### GET `/api/v1/projects/teacher/{teacher_id}/assigned`
Obtener proyectos asignados a un profesor

**Query Parameters:**
- `status` (opcional): Filtrar por estado

#### GET `/api/v1/projects/stats/summary`
Estadísticas generales de proyectos

**Response:**
```json
{
  "total_projects": 0,
  "by_status": {
    "submitted": 0,
    "in_review": 0,
    "approved": 0,
    "rejected": 0,
    "published": 0
  }
}
```

---

### Carreras

#### GET `/api/v1/careers`
Obtener lista de carreras

**Query Parameters:**
- `is_active` (opcional): true/false (default: true)

**Response:**
```json
[
  {
    "code": "INF-001",
    "name": "Ingeniería en Informática",
    "faculty": "Ingeniería",
    "active_students": 245,
    "active_teachers": 18
  }
]
```

#### GET `/api/v1/careers/{career_code}`
Obtener una carrera específica

**Ejemplo:**
```bash
curl "http://localhost:8000/api/v1/careers/INF-001"
```

#### GET `/api/v1/careers/{career_code}/subjects`
Obtener materias de una carrera

**Query Parameters:**
- `is_project_subject` (opcional): true/false (default: true)

---

### Materias

#### GET `/api/v1/subjects`
Obtener lista de materias de proyecto

**Query Parameters:**
- `career_code` (opcional): Filtrar por carrera
- `is_project_subject` (opcional): true/false (default: true)
- `trayect` (opcional): Filtrar por trayecto

**Response:**
```json
[
  {
    "code": "PI-III",
    "name": "Proyecto Integrador III",
    "career_code": "INF-001",
    "trayect": 3,
    "semester": 2,
    "project_type": "integrador",
    "credits": 6
  }
]
```

#### GET `/api/v1/subjects/{subject_code}`
Obtener una materia específica

---

## 🧪 Probar la API

### Usando el script de prueba:
```bash
python test_api.py
```

### Usando curl:
```bash
# Health check
curl http://localhost:8000/health

# Obtener usuarios
curl http://localhost:8000/api/v1/users

# Obtener carreras
curl http://localhost:8000/api/v1/careers

# Obtener materias de Informática
curl "http://localhost:8000/api/v1/subjects?career_code=INF-001"
```

### Usando Python:
```python
import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/api/v1/users")
        print(response.json())

asyncio.run(test())
```

---

## 📊 Datos de Prueba

Después de ejecutar `python scripts/seed_data.py`, tendrás:

### Usuarios:
- **Coordinador:** coordinador@unexca.edu.ve
- **Profesor:** martinez@unexca.edu.ve
- **Estudiante 1:** maria.rodriguez@unexca.edu.ve
- **Estudiante 2:** juan.perez@unexca.edu.ve

### Carreras:
- INF-001: Ingeniería en Informática
- ADM-001: Administración
- EDU-001: Educación Integral

### Materias de Proyecto:
- PI-I: Proyecto Integrador I (Trayecto 1)
- PI-II: Proyecto Integrador II (Trayecto 2)
- PI-III: Proyecto Integrador III (Trayecto 3)
- TG-IV: Trabajo de Grado (Trayecto 4)
- PC-I: Proyecto Comunitario I

---

## 🔐 Próximos Pasos

1. **Autenticación:** Implementar JWT para proteger endpoints
2. **Upload de archivos:** Endpoint para subir PDFs/DOCs
3. **Evaluaciones:** Endpoints para crear y gestionar evaluaciones
4. **Notificaciones:** Sistema de notificaciones en tiempo real
5. **Reportes:** Generación de reportes en PDF/Excel

---

## 📝 Notas

- Todos los endpoints devuelven JSON
- Los errores siguen el formato estándar de FastAPI
- La documentación interactiva se actualiza automáticamente
- CORS está configurado para localhost:5173 y localhost:3000
