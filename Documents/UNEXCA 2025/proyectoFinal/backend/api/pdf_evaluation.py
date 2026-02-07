"""
API Router para evaluación de proyectos con PDF
Conversión de DOCX a PDF y manejo de anotaciones con coordenadas
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from pathlib import Path
import io

from config.database import Database

router = APIRouter(prefix="/api/v1/pdf-evaluation", tags=["pdf-evaluation"])


class AnnotationRect(BaseModel):
    """Coordenadas del rectángulo de la anotación"""
    x: float
    y: float
    width: float
    height: float


class Annotation(BaseModel):
    """Modelo de anotación sobre el PDF"""
    id: Optional[str] = None
    project_id: Optional[str] = None  # Opcional porque se puede pasar en el request principal
    page: int
    rect: List[float]  # [x0, y0, x1, y1] coordenadas del rectángulo
    color: str = "yellow"  # yellow, red, green, blue
    type: str = "highlight"  # highlight, underline, strikeout, comment
    comment: str
    selected_text: Optional[str] = None
    author_id: str
    author_name: str
    created_at: Optional[str] = None


class SaveAnnotationsRequest(BaseModel):
    """Request para guardar múltiples anotaciones"""
    project_id: str
    annotations: List[Annotation]


class ConvertToPDFRequest(BaseModel):
    """Request para convertir DOCX a PDF"""
    project_id: str
    file_path: str


@router.post("/convert-to-pdf/{project_id}")
async def convert_docx_to_pdf(project_id: str):
    """
    Convierte el archivo DOCX del proyecto a PDF para evaluación
    Usa PyMuPDF (fitz) para la conversión
    """
    try:
        # Importar PyMuPDF
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PyMuPDF no está instalado. Ejecuta: pip install PyMuPDF"
            )
        
        try:
            from docx import Document
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="python-docx no está instalado. Ejecuta: pip install python-docx"
            )
        
        # Obtener el proyecto
        projects_collection = Database.get_collection("projects")
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Obtener el archivo DOCX
        versions = project.get("versions", [])
        if not versions:
            raise HTTPException(status_code=404, detail="El proyecto no tiene versiones")
        
        files = versions[0].get("files", [])
        if not files:
            raise HTTPException(status_code=404, detail="No hay archivos en el proyecto")
        
        file_info = files[0]
        file_path = file_info.get("file_path")
        file_id = file_info.get("file_id")
        
        # Construir ruta al archivo
        base_path = Path(__file__).parent.parent / "uploads"
        
        if file_path:
            full_path = base_path / file_path
        elif file_id:
            full_path = base_path / file_id
        else:
            raise HTTPException(status_code=404, detail="No se encontró la ruta del archivo")
        
        # Buscar el archivo si no existe en la ruta directa
        if not full_path.exists():
            import os
            for root, dirs, files_in_dir in os.walk(base_path):
                for file in files_in_dir:
                    if (file_id and file == file_id) or (file_path and file_path in str(Path(root) / file)):
                        full_path = Path(root) / file
                        break
        
        if not full_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Archivo no encontrado: {full_path}"
            )
        
        # Verificar si ya existe un PDF
        pdf_path = full_path.with_suffix('.pdf')
        
        # Si el archivo ya es PDF, devolverlo
        if full_path.suffix.lower() == '.pdf':
            return {
                "success": True,
                "message": "El archivo ya es PDF",
                "pdf_path": str(pdf_path.relative_to(base_path)),
                "pdf_url": f"/uploads/{pdf_path.relative_to(base_path)}"
            }
        
        # Si ya existe la conversión, devolverla
        if pdf_path.exists():
            return {
                "success": True,
                "message": "PDF ya convertido previamente",
                "pdf_path": str(pdf_path.relative_to(base_path)),
                "pdf_url": f"/uploads/{pdf_path.relative_to(base_path)}"
            }
        
        # Convertir DOCX a PDF usando python-docx + reportlab
        # Nota: Para una conversión más profesional en producción, usar LibreOffice/unoconv
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
        
        # Leer el documento DOCX
        document = Document(str(full_path))
        
        # Crear el PDF
        pdf_doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Estilos
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='Justify',
            parent=styles['Normal'],
            alignment=TA_JUSTIFY,
            fontSize=11,
            leading=14
        ))
        
        # Construir el contenido
        story = []
        
        for para in document.paragraphs:
            if para.text.strip():
                # Detectar si es título
                if para.style.name.startswith('Heading'):
                    style = styles['Heading1'] if '1' in para.style.name else styles['Heading2']
                else:
                    style = styles['Justify']
                
                p = Paragraph(para.text, style)
                story.append(p)
                story.append(Spacer(1, 0.2 * inch))
        
        # Generar el PDF
        pdf_doc.build(story)
        
        # Guardar la ruta del PDF en el proyecto
        await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    f"versions.0.files.0.pdf_path": str(pdf_path.relative_to(base_path)),
                    f"versions.0.files.0.pdf_generated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "success": True,
            "message": "DOCX convertido a PDF exitosamente",
            "pdf_path": str(pdf_path.relative_to(base_path)),
            "pdf_url": f"/uploads/{pdf_path.relative_to(base_path)}"
        }
        
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Librerías no instaladas: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error convirtiendo a PDF: {error_detail}")
        raise HTTPException(
            status_code=500,
            detail=f"Error convirtiendo a PDF: {str(e)}"
        )


@router.post("/annotations/save")
async def save_annotations(request: SaveAnnotationsRequest):
    """
    Guarda las anotaciones del profesor sobre el PDF
    Estructura: { project_id, page, rect: [x0, y0, x1, y1], color, comment, author }
    """
    try:
        print("=" * 60)
        print("GUARDANDO ANOTACIONES PDF:")
        print(f"Project ID: {request.project_id}")
        print(f"Número de anotaciones: {len(request.annotations)}")
        
        annotations_collection = Database.get_collection("pdf_annotations")
        
        # Eliminar anotaciones anteriores del proyecto
        await annotations_collection.delete_many({
            "project_id": ObjectId(request.project_id)
        })
        
        # Guardar nuevas anotaciones
        if request.annotations:
            annotations_data = []
            for idx, annotation in enumerate(request.annotations):
                print(f"\nAnotación {idx + 1}:")
                print(f"  Página: {annotation.page}")
                print(f"  Rect: {annotation.rect}")
                print(f"  Color: {annotation.color}")
                print(f"  Comentario: {annotation.comment[:50]}...")
                print(f"  Autor: {annotation.author_name}")
                
                anno_dict = {
                    "id": annotation.id or f"anno_{datetime.utcnow().timestamp()}_{idx}",
                    "project_id": ObjectId(request.project_id),
                    "page": annotation.page,
                    "rect": annotation.rect,
                    "color": annotation.color,
                    "type": annotation.type,
                    "comment": annotation.comment,
                    "selected_text": annotation.selected_text,
                    "author_id": annotation.author_id,
                    "author_name": annotation.author_name,
                    "created_at": annotation.created_at or datetime.utcnow().isoformat()
                }
                annotations_data.append(anno_dict)
            
            result = await annotations_collection.insert_many(annotations_data)
            print(f"\n✅ Guardadas {len(result.inserted_ids)} anotaciones")
            print("=" * 60)
            
            return {
                "success": True,
                "message": f"Se guardaron {len(request.annotations)} anotaciones",
                "count": len(request.annotations),
                "ids": [str(id) for id in result.inserted_ids]
            }
        
        return {
            "success": True,
            "message": "No hay anotaciones para guardar",
            "count": 0
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error guardando anotaciones: {error_detail}")
        raise HTTPException(
            status_code=500,
            detail=f"Error guardando anotaciones: {str(e)}"
        )


@router.get("/annotations/{project_id}")
async def get_annotations(project_id: str):
    """
    Obtiene todas las anotaciones guardadas de un proyecto
    """
    try:
        annotations_collection = Database.get_collection("pdf_annotations")
        
        annotations = await annotations_collection.find({
            "project_id": ObjectId(project_id)
        }).to_list(length=None)
        
        # Convertir ObjectId a string
        for anno in annotations:
            anno["_id"] = str(anno["_id"])
            anno["project_id"] = str(anno["project_id"])
        
        print(f"📄 Recuperadas {len(annotations)} anotaciones para proyecto {project_id}")
        
        return {
            "success": True,
            "project_id": project_id,
            "annotations": annotations,
            "count": len(annotations)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo anotaciones: {str(e)}"
        )


@router.get("/pdf-info/{project_id}")
async def get_pdf_info(project_id: str):
    """
    Obtiene información del PDF del proyecto (número de páginas, dimensiones, etc.)
    """
    try:
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PyMuPDF no está instalado"
            )
        
        # Obtener el proyecto
        projects_collection = Database.get_collection("projects")
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Obtener ruta del PDF
        versions = project.get("versions", [])
        if not versions:
            raise HTTPException(status_code=404, detail="El proyecto no tiene versiones")
        
        files = versions[0].get("files", [])
        if not files:
            raise HTTPException(status_code=404, detail="No hay archivos en el proyecto")
        
        file_info = files[0]
        pdf_path = file_info.get("pdf_path") or file_info.get("file_path")
        
        if not pdf_path:
            raise HTTPException(status_code=404, detail="No se encontró el PDF")
        
        # Construir ruta completa
        base_path = Path(__file__).parent.parent / "uploads"
        full_path = base_path / pdf_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"PDF no encontrado: {full_path}")
        
        # Abrir el PDF y obtener información
        doc = fitz.open(str(full_path))
        
        pages_info = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            pages_info.append({
                "page": page_num + 1,
                "width": page.rect.width,
                "height": page.rect.height
            })
        
        doc.close()
        
        return {
            "success": True,
            "project_id": project_id,
            "pdf_path": str(pdf_path),
            "total_pages": len(pages_info),
            "pages": pages_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo información del PDF: {str(e)}"
        )


@router.delete("/annotations/{annotation_id}")
async def delete_annotation(annotation_id: str):
    """
    Elimina una anotación específica
    """
    try:
        annotations_collection = Database.get_collection("pdf_annotations")
        
        result = await annotations_collection.delete_one({
            "_id": ObjectId(annotation_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Anotación no encontrada")
        
        return {
            "success": True,
            "message": "Anotación eliminada exitosamente"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error eliminando anotación: {str(e)}"
        )
