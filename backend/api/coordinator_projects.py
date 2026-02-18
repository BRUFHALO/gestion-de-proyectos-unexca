"""

API Router para Proyectos Aprobados del Coordinador


Endpoints para gestión de proyectos aprobados por profesores


"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from config.database import Database, DatabaseConfig

router = APIRouter(prefix="/api/v1/coordinator", tags=["coordinator-projects"])

@router.get("/approved")
async def get_approved_projects():
    """Obtener proyectos aprobados pendientes de revisión del coordinador"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Buscar proyectos con estado "aprobado" que no estén "published"
        approved_projects = await projects_collection.find({
            "metadata.status": "aprobado"
        }).sort("updated_at", -1).to_list(length=100)
        
        # Formatear proyectos para el coordinador
        formatted_projects = []
        for project in approved_projects:
            # Obtener información del estudiante
            student = await db.get_collection(DatabaseConfig.USERS_COLLECTION).find_one({
                "_id": project["created_by"]
            })
            
            # Obtener información de la evaluación (está guardada en el proyecto)
            evaluation_data = {
                "grade": project.get("grade", 0),
                "teacher_id": project.get("graded_by"),
                "annotations": project.get("annotations", [])
            }
            
            # Obtener información del profesor
            teacher = None
            if evaluation_data.get("teacher_id"):
                try:
                    # Intentar convertir a ObjectId si es string
                    teacher_id = evaluation_data["teacher_id"]
                    if isinstance(teacher_id, str):
                        teacher_id = ObjectId(teacher_id)
                    teacher = await db.get_collection(DatabaseConfig.USERS_COLLECTION).find_one({
                        "_id": teacher_id
                    })
                except:
                    # Si falla, buscar por string directamente
                    teacher = await db.get_collection(DatabaseConfig.USERS_COLLECTION).find_one({
                        "_id": evaluation_data["teacher_id"]
                    })
            
            formatted_project = {
                "id": str(project["_id"]),
                "title": project.get("title", "Sin título"),
                "studentName": student.get("name", "Estudiante desconocido") if student else "Estudiante desconocido",
                "teacherName": teacher.get("name", "Profesor desconocido") if teacher else "Profesor desconocido",
                "career": student.get("university_data", {}).get("career", "No especificada") if student else "No especificada",
                "approvedDate": project.get("updated_at", datetime.utcnow()).strftime("%d/%m/%Y"),
                "evaluation": {
                    "grade": evaluation_data.get("grade", 0),
                    "comments": len(evaluation_data.get("annotations", []))
                }
            }
            formatted_projects.append(formatted_project)
        
        return {
            "success": True,
            "projects": formatted_projects,
            "total": len(formatted_projects)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/published")
async def get_published_projects():
    """Obtener proyectos publicados en biblioteca digital"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Buscar proyectos con estado "published"
        published_projects = await projects_collection.find({
            "metadata.status": "published"
        }).sort("published_at", -1).to_list(length=100)
        
        # Formatear proyectos para la biblioteca digital
        formatted_projects = []
        for project in published_projects:
            # Obtener información del estudiante
            student = await db.get_collection(DatabaseConfig.USERS_COLLECTION).find_one({
                "_id": project["created_by"]
            })
            
            # Obtener información de la evaluación (está guardada en el proyecto)
            evaluation_data = {
                "grade": project.get("grade", 0),
                "teacher_id": project.get("graded_by"),
                "annotations": project.get("annotations", [])
            }
            
            # Obtener información del profesor
            teacher = None
            if evaluation_data.get("teacher_id"):
                try:
                    # Intentar convertir a ObjectId si es string
                    teacher_id = evaluation_data["teacher_id"]
                    if isinstance(teacher_id, str):
                        teacher_id = ObjectId(teacher_id)
                    teacher = await db.get_collection(DatabaseConfig.USERS_COLLECTION).find_one({
                        "_id": teacher_id
                    })
                except:
                    # Si falla, buscar por string directamente
                    teacher = await db.get_collection(DatabaseConfig.USERS_COLLECTION).find_one({
                        "_id": evaluation_data["teacher_id"]
                    })
            
            # Obtener el file_id del proyecto (primera versión, primer archivo)
            file_id = None
            if project.get("versions") and len(project["versions"]) > 0:
                first_version = project["versions"][0]
                if first_version.get("files") and len(first_version["files"]) > 0:
                    file_id = first_version["files"][0].get("file_id")
            
            formatted_project = {
                "id": str(project["_id"]),
                "title": project.get("title", "Sin título"),
                "description": project.get("description", "Sin descripción disponible"),
                "methodology": project.get("academic_info", {}).get("methodology", "No especificada"),
                "file_id": file_id,  # Agregar file_id para descarga
                "studentName": student.get("name", "Estudiante desconocido") if student else "Estudiante desconocido",
                "teacherName": teacher.get("name", "Profesor desconocido") if teacher else "Profesor desconocido",
                "career": student.get("university_data", {}).get("career", "No especificada") if student else "No especificada",
                "publishedDate": project.get("published_at", datetime.utcnow()).strftime("%d/%m/%Y"),
                "evaluation": {
                    "grade": evaluation_data.get("grade", 0),
                    "comments": len(evaluation_data.get("annotations", []))
                }
            }
            formatted_projects.append(formatted_project)
        
        return {
            "success": True,
            "projects": formatted_projects,
            "total": len(formatted_projects)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{project_id}/unpublish")
async def unpublish_project(project_id: str):
    """Eliminar un proyecto de la biblioteca pública (cambiar estado de published a aprobado)"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Convertir project_id a ObjectId
        try:
            project_object_id = ObjectId(project_id)
        except:
            raise HTTPException(status_code=400, detail="ID de proyecto inválido")
        
        # Buscar el proyecto
        project = await projects_collection.find_one({"_id": project_object_id})
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Verificar que el proyecto esté publicado
        if project.get("metadata", {}).get("status") != "published":
            raise HTTPException(status_code=400, detail="El proyecto no está publicado")
        
        # Cambiar el estado de "published" a "aprobado"
        result = await projects_collection.update_one(
            {"_id": project_object_id},
            {
                "$set": {
                    "metadata.status": "aprobado",
                    "published_at": None  # Eliminar la fecha de publicación
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        return {
            "success": True,
            "message": "Proyecto eliminado de la biblioteca pública exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{project_id}/reject")
async def reject_project(project_id: str):
    """Rechazar un proyecto aprobado"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Cambiar estado a "reprobado"
        result = await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"metadata.status": "reprobado", "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "Proyecto rechazado exitosamente"
            }
        else:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{project_id}/publish")
async def publish_project(project_id: str):
    """Publicar un proyecto en biblioteca digital"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Cambiar estado a "published"
        result = await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"metadata.status": "published", "published_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "Proyecto publicado en biblioteca digital exitosamente"
            }
        else:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
