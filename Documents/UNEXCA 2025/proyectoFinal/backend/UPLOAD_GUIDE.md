# Guía de Subida de Proyectos

## 📤 Sistema de Upload Implementado

El sistema permite a los estudiantes subir proyectos en formato PDF que serán asignados automáticamente a su profesor.

## 🔧 Componentes Implementados

### Backend

1. **`utils/file_storage.py`**
   - Gestión de almacenamiento de archivos
   - Organización por estudiante
   - Nombres únicos con UUID
   - Validación de tamaño y tipo

2. **`api/projects.py`** - Endpoint `/api/v1/projects/upload`
   - Recibe archivo PDF + metadatos
   - Valida tipo y tamaño (máx 10MB)
   - Guarda archivo en disco
   - Crea registro en MongoDB
   - Asigna automáticamente al profesor
   - Actualiza estadísticas del estudiante

### Frontend

1. **`pages/StudentDashboard.tsx`**
   - Modal de subida mejorado
   - Validación de archivos
   - Integración con API
   - Feedback visual

2. **`services/api.ts`**
   - Método `projectsAPI.uploadProject()`
   - Manejo de FormData
   - Gestión de errores

## 📁 Estructura de Almacenamiento

```
backend/
└── uploads/
    └── projects/
        └── {student_id}/
            ├── {uuid1}.pdf
            ├── {uuid2}.pdf
            └── ...
```

## 🔄 Flujo de Subida

1. **Estudiante completa formulario:**
   - Título (obligatorio)
   - Descripción
   - Metodología
   - Palabras clave
   - Archivo PDF (obligatorio)

2. **Validaciones frontend:**
   - Tipo de archivo = PDF
   - Tamaño máximo = 10MB
   - Título no vacío

3. **Envío al backend:**
   - FormData con todos los campos
   - Incluye `student_id` del usuario logueado

4. **Procesamiento backend:**
   - Valida credenciales del estudiante
   - Guarda archivo con nombre único
   - Crea documento de proyecto en MongoDB
   - Asigna automáticamente al profesor
   - Actualiza estadísticas

5. **Respuesta:**
   - ID del proyecto creado
   - Información del archivo guardado

## 📊 Estructura del Proyecto en MongoDB

```json
{
  "_id": "ObjectId(...)",
  "title": "Título del Proyecto",
  "description": "Descripción...",
  "authors": [
    {
      "user_id": "student_id",
      "name": "Nombre del Estudiante",
      "role": "author"
    }
  ],
  "academic_info": {
    "career_code": "INF-001",
    "career_name": "Ingeniería en Informática",
    "methodology": "Scrum",
    "year": 2025,
    "trayect": 3,
    "semester": 2,
    "keywords": ["IA", "Machine Learning"],
    "subject": "Proyecto Integrador III",
    "subject_code": "PI-III"
  },
  "versions": [
    {
      "version_number": 1,
      "version_name": "Versión Inicial",
      "status": "submitted",
      "created_at": "2025-02-01T...",
      "files": [
        {
          "file_id": "uuid...",
          "filename": "proyecto.pdf",
          "file_path": "projects/student_id/uuid.pdf",
          "file_size": 1234567,
          "file_type": "application/pdf",
          "uploaded_at": "2025-02-01T...",
          "uploaded_by": "student_id"
        }
      ],
      "evaluations": [],
      "feedback": []
    }
  ],
  "metadata": {
    "current_version": 1,
    "total_versions": 1,
    "status": "submitted",
    "visibility": "private"
  },
  "evaluation": {
    "assigned_to": "teacher_id",
    "assigned_at": "2025-02-01T...",
    "status": "pending",
    "priority": "normal"
  },
  "created_by": "student_id",
  "created_at": "2025-02-01T...",
  "updated_at": "2025-02-01T..."
}
```

## 🧪 Pruebas

### Con cURL

```bash
curl -X POST "http://localhost:8005/api/v1/projects/upload" \
  -F "title=Mi Proyecto de IA" \
  -F "description=Sistema de recomendación" \
  -F "methodology=Scrum" \
  -F "keywords=IA,Machine Learning,Python" \
  -F "student_id=507f1f77bcf86cd799439011" \
  -F "file=@proyecto.pdf"
```

### Con Frontend

1. Login como estudiante
2. Click en "Nueva Entrega"
3. Completar formulario
4. Seleccionar archivo PDF
5. Click en "Enviar Proyecto"

## ✅ Validaciones

### Frontend
- ✅ Solo archivos PDF
- ✅ Máximo 10MB
- ✅ Título obligatorio
- ✅ Vista previa del archivo seleccionado

### Backend
- ✅ Extensión .pdf
- ✅ Tamaño máximo 10MB
- ✅ Usuario debe ser estudiante
- ✅ Usuario debe existir y estar activo
- ✅ ID de estudiante válido

## 📝 Información Automática

El sistema completa automáticamente:
- ✅ Carrera del estudiante
- ✅ Trayecto y semestre actual
- ✅ Profesor asignado
- ✅ Materia de proyecto
- ✅ Año actual
- ✅ Estado inicial: "submitted"
- ✅ Asignación al profesor

## 🔐 Seguridad

- Archivos guardados con nombres UUID únicos
- Organización por estudiante
- Validación de rol (solo estudiantes)
- Validación de tipo y tamaño
- Rutas relativas en BD (no absolutas)

## 📦 Dependencias Nuevas

Agregar a `requirements.txt`:
```
python-multipart
```

Instalar con:
```bash
pip install python-multipart
```

## 🚀 Próximos Pasos

1. ✅ Upload de proyectos implementado
2. ⏳ Descarga de archivos
3. ⏳ Visualización de PDF en el navegador
4. ⏳ Sistema de evaluación del profesor
5. ⏳ Historial de versiones
6. ⏳ Notificaciones de nuevos proyectos

## 🐛 Troubleshooting

### Error: "python-multipart not installed"
```bash
pip install python-multipart
```

### Error: "Permission denied" al guardar archivos
- Verificar permisos de escritura en carpeta `uploads/`
- Crear carpeta manualmente si no existe

### Error: "File too large"
- Verificar que el archivo sea menor a 10MB
- Ajustar límite en el código si es necesario

### Archivo no se guarda
- Verificar que la carpeta `uploads/projects/` exista
- Verificar logs del backend para más detalles
