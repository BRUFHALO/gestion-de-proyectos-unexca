# 📄 Guía del Sistema de Evaluación con PDF

## 🎯 Nuevo Sistema Implementado

Hemos rediseñado completamente el sistema de evaluación de proyectos para que los profesores puedan evaluar documentos de manera profesional usando PDFs con anotaciones directas.

---

## 🔄 Flujo de Trabajo

### 1. **Conversión Automática DOCX → PDF**

Cuando un estudiante sube un proyecto en formato `.docx`, el sistema automáticamente:
- Convierte el documento a PDF usando `reportlab` y `python-docx`
- Guarda el PDF en el servidor
- Mantiene el archivo original DOCX intacto

**Endpoint Backend:**
```
POST /api/v1/pdf-evaluation/convert-to-pdf/{project_id}
```

### 2. **Evaluación Visual con Anotaciones**

El profesor puede:
- ✅ Seleccionar texto directamente en el PDF
- ✅ Agregar comentarios sobre el texto seleccionado
- ✅ Elegir colores de resaltado (amarillo, rojo, verde, azul)
- ✅ Ver todas las anotaciones en un panel lateral
- ✅ Navegar por páginas con anotaciones visibles

### 3. **Guardado de Anotaciones con Coordenadas**

Las anotaciones se guardan en MongoDB con la siguiente estructura:

```json
{
  "documento_id": "proyecto_unexca_001",
  "correcciones": [
    {
      "id": "anno_1738532400_0",
      "page": 1,
      "rect": [0.15, 0.25, 0.45, 0.30],
      "color": "yellow",
      "type": "highlight",
      "comment": "El título debe estar en mayúsculas sostenidas.",
      "selected_text": "Implementación de IA en Planificación Urbana",
      "author_id": "507f1f77bcf86cd799439011",
      "author_name": "Prof. Carlos Martínez",
      "created_at": "2025-02-02T19:40:00.000Z"
    }
  ]
}
```

**Coordenadas Normalizadas:**
- `rect: [x0, y0, x1, y1]` - Valores entre 0 y 1
- `x0, y0` - Esquina superior izquierda
- `x1, y1` - Esquina inferior derecha

---

## 🛠️ Tecnologías Utilizadas

### **Backend (Python/FastAPI)**

```python
# Dependencias principales
PyMuPDF>=1.23.0          # Procesamiento avanzado de PDFs
python-docx>=1.1.0       # Lectura de archivos DOCX
reportlab>=4.0.0         # Generación de PDFs
```

**Archivo:** `backend/api/pdf_evaluation.py`

**Endpoints disponibles:**
- `POST /api/v1/pdf-evaluation/convert-to-pdf/{project_id}` - Convertir DOCX a PDF
- `POST /api/v1/pdf-evaluation/annotations/save` - Guardar anotaciones
- `GET /api/v1/pdf-evaluation/annotations/{project_id}` - Obtener anotaciones
- `GET /api/v1/pdf-evaluation/pdf-info/{project_id}` - Info del PDF (páginas, dimensiones)
- `DELETE /api/v1/pdf-evaluation/annotations/{annotation_id}` - Eliminar anotación

### **Frontend (React/TypeScript)**

```json
{
  "react-pdf": "^10.3.0",
  "pdfjs-dist": "^5.4.530"
}
```

**Componente:** `frondend/src/components/PDFEvaluationViewer.tsx`

**Características:**
- Visor de PDF con `react-pdf`
- Selección de texto nativa del navegador
- Caja de comentarios flotante
- Panel lateral con lista de anotaciones
- Navegación por páginas
- Zoom in/out
- Colores de resaltado personalizables

---

## 📋 Cómo Usar el Sistema

### **Para Profesores:**

1. **Acceder al proyecto a evaluar**
   ```typescript
   <PDFEvaluationViewer 
     projectId="507f1f77bcf86cd799439011"
     teacherId="teacher_123"
     teacherName="Prof. Carlos Martínez"
   />
   ```

2. **Seleccionar texto en el PDF**
   - Usa el mouse para seleccionar cualquier texto
   - Al soltar, aparece una caja de comentario

3. **Escribir el comentario**
   - Escribe tu observación en la caja
   - Elige el color de resaltado (amarillo, rojo, verde, azul)
   - Presiona "Guardar" o `Ctrl+Enter`

4. **Ver anotaciones**
   - Panel lateral muestra todos los comentarios de la página actual
   - Cada comentario muestra:
     - Texto seleccionado
     - Comentario del profesor
     - Color de resaltado
     - Fecha y hora

5. **Guardar evaluación**
   - Botón "Guardar" en la barra superior
   - Guarda todas las anotaciones en la base de datos
   - Muestra contador de anotaciones guardadas

6. **Navegar por páginas**
   - Botones "Anterior" / "Siguiente"
   - Indicador de página actual
   - Zoom in/out para mejor visualización

### **Para Estudiantes:**

Los estudiantes verán:
- El PDF con todas las anotaciones del profesor
- Comentarios resaltados en colores
- Panel lateral con lista de observaciones
- Pueden navegar pero **no pueden editar**

---

## 🎨 Colores de Resaltado

| Color | Uso Recomendado | Hex |
|-------|----------------|-----|
| 🟨 Amarillo | Sugerencias generales | #ffff00 |
| 🟥 Rojo | Errores críticos | #ff0000 |
| 🟩 Verde | Aprobaciones / Aciertos | #00ff00 |
| 🟦 Azul | Notas informativas | #0000ff |

---

## 🔧 Instalación

### **Backend:**

```bash
cd backend
pip install -r requirements.txt
```

Asegúrate de que `requirements.txt` incluya:
```
PyMuPDF>=1.23.0
python-docx>=1.1.0
reportlab>=4.0.0
```

### **Frontend:**

Las dependencias ya están instaladas:
```bash
cd frondend
npm install
# react-pdf y pdfjs-dist ya están en package.json
```

---

## 🚀 Iniciar el Sistema

### **Backend:**
```bash
cd backend
python main.py
# O con uvicorn:
uvicorn main:app --reload --host 0.0.0.0 --port 8005
```

### **Frontend:**
```bash
cd frondend
npm run dev
# Disponible en http://localhost:5173
```

---

## 📊 Estructura de Datos en MongoDB

### **Colección: `pdf_annotations`**

```javascript
{
  _id: ObjectId("..."),
  id: "anno_1738532400_0",
  project_id: ObjectId("507f1f77bcf86cd799439011"),
  page: 1,
  rect: [0.15, 0.25, 0.45, 0.30],  // Coordenadas normalizadas
  color: "yellow",
  type: "highlight",
  comment: "El título debe estar en mayúsculas sostenidas.",
  selected_text: "Implementación de IA en Planificación Urbana",
  author_id: "teacher_123",
  author_name: "Prof. Carlos Martínez",
  created_at: "2025-02-02T19:40:00.000Z"
}
```

### **Índices Recomendados:**

```javascript
db.pdf_annotations.createIndex({ project_id: 1 })
db.pdf_annotations.createIndex({ author_id: 1 })
db.pdf_annotations.createIndex({ page: 1 })
```

---

## 🧪 Pruebas

### **1. Probar conversión DOCX → PDF**

```bash
curl -X POST "http://localhost:8005/api/v1/pdf-evaluation/convert-to-pdf/PROJECT_ID"
```

### **2. Probar guardado de anotaciones**

```bash
curl -X POST "http://localhost:8005/api/v1/pdf-evaluation/annotations/save" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "PROJECT_ID",
    "annotations": [
      {
        "page": 1,
        "rect": [0.1, 0.2, 0.5, 0.3],
        "color": "yellow",
        "type": "highlight",
        "comment": "Excelente introducción",
        "selected_text": "Este proyecto explora...",
        "author_id": "teacher_123",
        "author_name": "Prof. Martínez"
      }
    ]
  }'
```

### **3. Obtener anotaciones**

```bash
curl "http://localhost:8005/api/v1/pdf-evaluation/annotations/PROJECT_ID"
```

---

## 🎯 Ventajas del Nuevo Sistema

### **Antes (Sistema Antiguo):**
- ❌ Anotaciones con Fabric.js sobre DOCX convertido a HTML
- ❌ Pérdida de formato original
- ❌ Difícil de mantener consistencia visual
- ❌ No se podía seleccionar texto real

### **Ahora (Sistema Nuevo):**
- ✅ PDF nativo con texto seleccionable
- ✅ Anotaciones con coordenadas precisas
- ✅ Formato original preservado
- ✅ Experiencia profesional de evaluación
- ✅ Compatible con cualquier visor de PDF
- ✅ Guardado estructurado en base de datos

---

## 🔮 Próximas Mejoras

1. **Exportar PDF con anotaciones "quemadas"**
   - Usar PyMuPDF para insertar anotaciones permanentes
   - Generar PDF final con todos los comentarios visibles

2. **Tipos de anotaciones adicionales**
   - Subrayado
   - Tachado
   - Notas adhesivas
   - Flechas y formas

3. **Filtros y búsqueda**
   - Filtrar por color
   - Buscar en comentarios
   - Ordenar por fecha/página

4. **Notificaciones**
   - Notificar al estudiante cuando hay nuevas anotaciones
   - Email con resumen de comentarios

5. **Estadísticas**
   - Número de correcciones por tipo
   - Páginas más comentadas
   - Tiempo de evaluación

---

## 📝 Notas Importantes

- **Coordenadas normalizadas:** Siempre entre 0 y 1 para ser independientes del zoom
- **Selección de texto:** Usa la API nativa del navegador (`window.getSelection()`)
- **Rendimiento:** PDFs grandes (>50 páginas) pueden tardar en cargar
- **Compatibilidad:** Funciona en Chrome, Firefox, Edge, Safari

---

## 🆘 Troubleshooting

### **Error: "PyMuPDF no está instalado"**
```bash
pip install PyMuPDF
```

### **Error: "PDF no se muestra"**
- Verifica que el archivo existe en `backend/uploads/`
- Verifica que CORS está configurado correctamente
- Revisa la consola del navegador para errores

### **Error: "No se pueden guardar anotaciones"**
- Verifica que MongoDB está corriendo
- Verifica que el backend está en puerto 8005
- Revisa logs del backend

### **Anotaciones no aparecen después de guardar**
- Refresca la página
- Verifica que las coordenadas están normalizadas (0-1)
- Revisa que el `project_id` es correcto

---

## ✅ Resumen

El nuevo sistema de evaluación con PDF ofrece:
- 📄 Conversión automática DOCX → PDF
- 🖊️ Anotaciones directas sobre el PDF
- 💾 Guardado estructurado con coordenadas
- 🎨 Colores de resaltado personalizables
- 📱 Interfaz profesional y fácil de usar
- 🔄 Sincronización en tiempo real

¡Todo listo para evaluar proyectos de manera profesional! 🚀
