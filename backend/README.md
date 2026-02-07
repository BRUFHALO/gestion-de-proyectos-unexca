# Backend - Sistema de Gestión de Proyectos UNEXCA

Sistema backend para la gestión de proyectos académicos con versionamiento, evaluación y feedback iterativo.

## 🏗️ Arquitectura

- **Base de datos:** MongoDB Atlas
- **Framework:** FastAPI (Python)
- **ORM:** Motor (async MongoDB driver)
- **Validación:** Pydantic
- **Storage:** Sistema de archivos local / S3

## 📊 Estructura de la Base de Datos

### Colecciones Principales

1. **users** - Estudiantes, profesores y coordinadores
2. **projects** - Proyectos con sistema de versionamiento
3. **evaluations** - Evaluaciones detalladas
4. **careers** - Carreras universitarias (cache)
5. **subjects** - Materias de proyecto
6. **reports** - Reportes generados
7. **sync_logs** - Logs de sincronización
8. **notifications** - Sistema de notificaciones
9. **archived_files** - Archivos archivados

## 🚀 Instalación

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz del backend:

```env
MONGODB_URL=mongodb+srv://ronaldo:1234@cluster0.sohux1b.mongodb.net/unexca_projects?appName=Cluster0
DATABASE_NAME=unexca_projects
UNIVERSITY_API_URL=https://api.unexca.edu.ve
UNIVERSITY_API_KEY=tu_api_key_aqui
```

### 3. Inicializar la base de datos

```bash
python scripts/init_db.py
```

Este script:
- Conecta a MongoDB Atlas
- Crea todas las colecciones necesarias
- Crea índices optimizados para búsquedas

### 4. Cargar datos de prueba

```bash
python scripts/seed_data.py
```

Este script carga:
- 3 Carreras (Informática, Administración, Educación)
- 5 Materias de Proyecto (PI-I, PI-II, PI-III, TG-IV, PC-I)
- 4 Usuarios de prueba (1 coordinador, 1 profesor, 2 estudiantes)

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── database.py          # Configuración de MongoDB
├── models/
│   ├── user.py              # Modelo de Usuario
│   ├── project.py           # Modelo de Proyecto
│   ├── subject.py           # Modelo de Materia
│   ├── career.py            # Modelo de Carrera
│   ├── report.py            # Modelo de Reporte
│   ├── sync_log.py          # Modelo de Log de Sincronización
│   ├── notification.py      # Modelo de Notificación
│   └── __init__.py
├── scripts/
│   ├── init_db.py           # Script de inicialización
│   └── seed_data.py         # Datos de prueba
├── requirements.txt         # Dependencias Python
└── README.md               # Este archivo
```

## 🔑 Credenciales de Prueba

Después de ejecutar `seed_data.py`:

- **Coordinador:** coordinador@unexca.edu.ve
- **Profesor:** martinez@unexca.edu.ve
- **Estudiante 1:** maria.rodriguez@unexca.edu.ve
- **Estudiante 2:** juan.perez@unexca.edu.ve

## 📚 Modelos de Datos

### User (Usuario)
- Datos sincronizados de la universidad
- Perfil local personalizable
- Estadísticas de actividad

### Project (Proyecto)
- Sistema de versionamiento completo
- Múltiples archivos por versión
- Evaluaciones con anotaciones
- Historial de cambios

### Subject (Materia)
- Materias de proyecto por carrera
- Requisitos específicos
- Tipos: integrador, investigación, comunitario, tesis

### Career (Carrera)
- Cache de datos universitarios
- Sincronización automática
- Estadísticas de estudiantes y profesores

## 🔄 Sistema de Versionamiento

Cada proyecto puede tener múltiples versiones:

1. **Estudiante sube v1.0** → Sistema asigna evaluador
2. **Profesor evalúa v1.0** → Añade anotaciones y feedback
3. **Estudiante sube v1.1** → Correcciones basadas en feedback
4. **Proceso iterativo** hasta aprobación
5. **Limpieza automática** después de aprobación

## 🧹 Política de Limpieza

- **Durante el semestre:** Todas las versiones en storage activo
- **Al aprobar proyecto:** Versiones intermedias se archivan
- **Después de 1 año:** Eliminación permanente de archivos archivados
- **Se conserva:** Versión final + historial ligero

## 🔍 Índices Creados

### users
- email (único)
- university_data.user_id (único)
- role
- Búsqueda de texto en name y email

### projects
- created_by
- metadata.status
- academic_info.career_code
- academic_info.year
- evaluation.assigned_to
- Búsqueda de texto en title y description

### subjects
- code (único)
- career_code
- is_project_subject

### careers
- code (único)
- name

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT para autenticación
- Validación de datos con Pydantic
- Separación de datos sensibles

## 📈 Próximos Pasos

1. Implementar API REST con FastAPI
2. Crear servicios de sincronización
3. Implementar sistema de archivos
4. Desarrollar sistema de notificaciones
5. Crear endpoints de evaluación
6. Implementar generación de reportes

## 🛠️ Comandos Útiles

```bash
# Inicializar base de datos
python scripts/init_db.py

# Cargar datos de prueba
python scripts/seed_data.py

# Verificar conexión
python -c "from config.database import Database; import asyncio; asyncio.run(Database.connect_db())"
```

## 📞 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.
