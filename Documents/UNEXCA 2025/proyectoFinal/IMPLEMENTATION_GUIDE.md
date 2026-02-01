# 📚 Guía de Implementación Completa - Sistema de Feedback y Chat

## ✅ Componentes Implementados

### 1. **Visor de PDF con Anotaciones** (`PDFViewer.tsx`)

**Características:**
- ✅ Navegación por páginas (anterior/siguiente/ir a página)
- ✅ Zoom in/out (50% - 300%)
- ✅ Resaltado de páginas con comentarios
- ✅ Overlay de anotaciones con colores por tipo
- ✅ Tooltips con preview de comentarios
- ✅ Botón de descarga integrado

**Tipos de anotaciones:**
- 🔴 Correcciones (rojo)
- 🟡 Sugerencias (amarillo)
- 🟢 Aprobaciones (verde)

### 2. **Panel de Evaluación del Profesor** (`TeacherFeedbackPanel.tsx`)

**Características:**
- ✅ Visor de PDF integrado
- ✅ Formulario para agregar comentarios
- ✅ Selector visual de tipo de comentario
- ✅ Especificación de página y sección
- ✅ Lista de comentarios agregados
- ✅ Estadísticas de feedback
- ✅ Navegación a páginas con comentarios

### 3. **Vista Detallada del Estudiante** (Actualizada)

**Mejoras:**
- ✅ Placeholder para visor de PDF
- ✅ Instrucciones de instalación
- ✅ Integración con sistema de feedback
- ✅ Chat en tiempo real

### 4. **WebSocket para Chat en Tiempo Real** (`websocket.py`)

**Características:**
- ✅ Gestor de conexiones por proyecto
- ✅ Broadcast a todos los participantes
- ✅ Persistencia de mensajes en MongoDB
- ✅ Manejo de desconexiones
- ✅ Información de remitente automática

### 5. **API de Feedback** (Actualizada)

**Nuevos endpoints:**
- ✅ `POST /api/v1/feedback/add` - Agregar feedback
- ✅ `GET /api/v1/feedback/project/{project_id}` - Obtener feedbacks
- ✅ `POST /api/v1/feedback/chat/send` - Enviar mensaje
- ✅ `GET /api/v1/feedback/chat/{project_id}` - Obtener chat
- ✅ `GET /api/v1/feedback/stats/{project_id}` - Estadísticas
- ✅ `WS /api/v1/feedback/ws/chat/{project_id}` - WebSocket chat

## 📦 Instalación de Dependencias

### Frontend

```bash
cd frondend
npm install react-pdf pdfjs-dist
```

### Backend

No se requieren dependencias adicionales. FastAPI ya incluye soporte para WebSockets.

## 🔧 Configuración

### 1. Configurar PDF.js Worker (Frontend)

El componente `PDFViewer.tsx` ya está configurado para usar el CDN de PDF.js:

```typescript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

### 2. Configurar CORS para WebSockets (Backend)

Ya está configurado en `main.py` con:
```python
allow_origins=["*"]
```

## 🚀 Uso del Sistema

### Para Profesores:

1. **Acceder al panel de evaluación:**
   ```typescript
   onNavigate('teacher-feedback', { projectId: 'project_id' })
   ```

2. **Agregar comentario:**
   - Seleccionar tipo (corrección/sugerencia/aprobación)
   - Especificar página y sección
   - Escribir comentario
   - Guardar

3. **Navegar por el PDF:**
   - Usar controles de navegación
   - Zoom in/out
   - Ver páginas resaltadas con comentarios

### Para Estudiantes:

1. **Ver detalles del proyecto:**
   ```typescript
   onNavigate('project-detail', { projectId: 'project_id' })
   ```

2. **Ver feedback del profesor:**
   - Comentarios organizados por tipo y color
   - Click en "Ir a sección" para navegar al PDF
   - Ver estadísticas de feedback

3. **Chat con el profesor:**
   - Escribir mensaje en el panel lateral
   - Enviar con Enter o botón
   - Mensajes en tiempo real vía WebSocket

## 📊 Estructura de Datos

### Feedback
```javascript
{
  id: "unique_id",
  type: "correction" | "suggestion" | "approval",
  comment: "Texto del comentario",
  page: 5,
  section: "Metodología",
  anchor: "page-5-metodologia",
  created_by: "teacher_id",
  created_by_name: "Prof. Martínez",
  created_at: "2025-02-01T..."
}
```

### Chat Message (WebSocket)
```javascript
{
  type: "chat_message",
  data: {
    id: "unique_id",
    sender_id: "user_id",
    sender_name: "María Rodríguez",
    sender_role: "student",
    message: "Texto del mensaje",
    created_at: "2025-02-01T..."
  }
}
```

## 🔗 Integración WebSocket (Frontend)

```typescript
// Conectar al WebSocket
const ws = new WebSocket(`ws://localhost:8005/api/v1/feedback/ws/chat/${projectId}`);

// Recibir mensajes
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chat_message') {
    setChatMessages(prev => [...prev, data.data]);
  }
};

// Enviar mensaje
ws.send(JSON.stringify({
  sender_id: userId,
  message: messageText
}));
```

## 🎨 Colores de Feedback

```css
/* Corrección */
.correction {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgb(239, 68, 68);
}

/* Sugerencia */
.suggestion {
  background: rgba(234, 179, 8, 0.3);
  border-color: rgb(234, 179, 8);
}

/* Aprobación */
.approval {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgb(34, 197, 94);
}
```

## 📝 Endpoints del Backend

### Feedback
- `POST /api/v1/feedback/add` - Agregar comentario
- `GET /api/v1/feedback/project/{id}` - Listar comentarios
- `GET /api/v1/feedback/stats/{id}` - Estadísticas

### Chat
- `POST /api/v1/feedback/chat/send` - Enviar mensaje (HTTP)
- `GET /api/v1/feedback/chat/{id}` - Historial de chat
- `WS /api/v1/feedback/ws/chat/{id}` - Chat en tiempo real

## 🧪 Pruebas

### 1. Probar Visor de PDF
```bash
# Instalar dependencias
npm install react-pdf pdfjs-dist

# Verificar que el PDF se carga correctamente
# Navegar por páginas
# Probar zoom
```

### 2. Probar Feedback
```bash
# Como profesor: agregar comentarios
# Como estudiante: ver comentarios con colores
# Verificar navegación a páginas específicas
```

### 3. Probar WebSocket
```bash
# Abrir dos ventanas (estudiante y profesor)
# Enviar mensajes desde ambas
# Verificar recepción en tiempo real
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'react-pdf'"
```bash
npm install react-pdf pdfjs-dist
```

### PDF no se muestra
- Verificar que el archivo existe en el backend
- Verificar CORS configurado correctamente
- Verificar URL del worker de PDF.js

### WebSocket no conecta
- Verificar que el backend está corriendo
- Verificar URL del WebSocket (ws:// no wss://)
- Verificar CORS permite WebSockets

## 📈 Próximas Mejoras

1. **Anotaciones visuales en el PDF**
   - Dibujar directamente sobre el PDF
   - Resaltar texto específico
   - Agregar formas y flechas

2. **Notificaciones push**
   - Notificar cuando hay nuevo feedback
   - Notificar mensajes de chat nuevos

3. **Historial de versiones**
   - Comparar versiones del proyecto
   - Ver cambios entre versiones

4. **Exportar feedback**
   - Generar PDF con todos los comentarios
   - Exportar a Excel/CSV

## 🎯 Resumen

El sistema completo incluye:
- ✅ Visor de PDF con navegación y zoom
- ✅ Sistema de feedback con 3 tipos de comentarios
- ✅ Colores distintivos (rojo/amarillo/verde)
- ✅ Navegación a secciones específicas del PDF
- ✅ Chat en tiempo real con WebSockets
- ✅ Panel del profesor para evaluar
- ✅ Vista del estudiante para recibir feedback
- ✅ Persistencia en MongoDB
- ✅ API REST completa

¡Todo listo para usar! 🚀
