# Guía de Integración Frontend-Backend

## 🔗 Conexión Establecida

El frontend ahora está conectado con el backend de FastAPI.

## 📋 Configuración

### Backend
- **URL:** http://localhost:8005
- **Documentación:** http://localhost:8005/docs

### Frontend
- **Servicio API:** `src/services/api.ts`
- **URL configurada:** http://localhost:8005

## 🚀 Cómo Usar la API en los Componentes

### 1. Importar el servicio

```typescript
import { usersAPI, projectsAPI, careersAPI, subjectsAPI } from '../services/api';
```

### 2. Ejemplos de Uso

#### Obtener Usuarios
```typescript
import { useEffect, useState } from 'react';
import { usersAPI, User } from '../services/api';

function MyComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await usersAPI.getAll({ role: 'student' });
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user._id}>{user.name}</div>
      ))}
    </div>
  );
}
```

#### Obtener Usuario por Email (Login)
```typescript
async function handleLogin(email: string) {
  try {
    const user = await usersAPI.getByEmail(email);
    console.log('Usuario encontrado:', user);
    // Guardar en estado, localStorage, etc.
  } catch (error) {
    console.error('Usuario no encontrado:', error);
  }
}
```

#### Obtener Carreras
```typescript
async function fetchCareers() {
  try {
    const careers = await careersAPI.getAll();
    console.log('Carreras:', careers);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### Obtener Proyectos de un Estudiante
```typescript
async function fetchStudentProjects(studentId: string) {
  try {
    const projects = await projectsAPI.getAll({ created_by: studentId });
    console.log('Proyectos del estudiante:', projects);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### Obtener Proyectos Asignados a un Profesor
```typescript
async function fetchTeacherProjects(teacherId: string) {
  try {
    const projects = await projectsAPI.getTeacherAssigned(teacherId);
    console.log('Proyectos asignados:', projects);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### Obtener Materias de Proyecto
```typescript
async function fetchProjectSubjects() {
  try {
    const subjects = await subjectsAPI.getAll({ 
      career_code: 'INF-001',
      is_project_subject: true 
    });
    console.log('Materias de proyecto:', subjects);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 📊 Actualizar Componentes Existentes

### LoginPage.tsx
Reemplazar el mock de login con:

```typescript
import { usersAPI } from '../services/api';

const handleLogin = async (role: Role) => {
  try {
    // Mapear emails de prueba
    const emails = {
      student: 'maria.rodriguez@unexca.edu.ve',
      teacher: 'martinez@unexca.edu.ve',
      coordinator: 'coordinador@unexca.edu.ve'
    };
    
    const user = await usersAPI.getByEmail(emails[role]);
    onLogin(user.role);
  } catch (error) {
    console.error('Error en login:', error);
  }
};
```

### StudentDashboard.tsx
Cargar proyectos reales:

```typescript
import { projectsAPI } from '../services/api';

useEffect(() => {
  async function loadProjects() {
    try {
      const projects = await projectsAPI.getAll({ 
        created_by: user._id 
      });
      // Actualizar estado con proyectos reales
    } catch (error) {
      console.error('Error:', error);
    }
  }
  loadProjects();
}, [user]);
```

### TeacherDashboard.tsx
Cargar proyectos asignados:

```typescript
import { projectsAPI } from '../services/api';

useEffect(() => {
  async function loadAssignedProjects() {
    try {
      const projects = await projectsAPI.getTeacherAssigned(user._id);
      // Actualizar estado con proyectos reales
    } catch (error) {
      console.error('Error:', error);
    }
  }
  loadAssignedProjects();
}, [user]);
```

### CoordinatorDashboard.tsx
Cargar docentes reales:

```typescript
import { usersAPI } from '../services/api';

useEffect(() => {
  async function loadTeachers() {
    try {
      const teachers = await usersAPI.getAll({ role: 'teacher' });
      // Actualizar estado con docentes reales
    } catch (error) {
      console.error('Error:', error);
    }
  }
  loadTeachers();
}, []);
```

## 🔐 Datos de Prueba Disponibles

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
- PI-I, PI-II, PI-III (Proyectos Integradores)
- TG-IV (Trabajo de Grado)
- PC-I (Proyecto Comunitario)

## ⚠️ Manejo de Errores

Siempre usar try-catch:

```typescript
try {
  const data = await usersAPI.getAll();
  // Usar data
} catch (error) {
  console.error('Error:', error);
  // Mostrar mensaje al usuario
}
```

## 🔄 Próximos Pasos

1. ✅ Servicio API creado
2. ⏳ Actualizar componentes para usar API real
3. ⏳ Implementar autenticación JWT
4. ⏳ Implementar upload de archivos
5. ⏳ Implementar sistema de evaluación

## 📝 Notas

- El backend debe estar corriendo en el puerto 8005
- CORS está configurado para localhost:5173 y localhost:3000
- Todos los endpoints devuelven JSON
- Los IDs de MongoDB son strings en formato ObjectId
