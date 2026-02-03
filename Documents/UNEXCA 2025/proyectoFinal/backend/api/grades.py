from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from config.database import Database

router = APIRouter(prefix="/api/v1/projects", tags=["grades"])

class GradeRequest(BaseModel):
    grade: float
    grade_type: str  # 'parcial' o 'definitiva'
    status: str  # 'en_revision', 'aprobado', 'reprobado'
    teacher_id: str

class GradeResponse(BaseModel):
    grade: float
    grade_type: str
    status: str
    graded_at: datetime
    graded_by: str

@router.put("/{project_id}/grade")
async def save_grade_and_status(
    project_id: str,
    request: GradeRequest
):
    """
    Guarda o actualiza la calificación y status de un proyecto
    """
    try:
        db = Database.get_database()
        projects_collection = db.get_collection("projects")
        
        # Verificar que el proyecto existe
        project = await projects_collection.find_one({"project_id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Actualizar el proyecto con la calificación y status
        update_data = {
            "grade": request.grade,
            "grade_type": request.grade_type,
            "status": request.status,
            "graded_at": datetime.now(),
            "graded_by": request.teacher_id,
            "updated_at": datetime.now()
        }
        
        result = await projects_collection.update_one(
            {"project_id": project_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        return {
            "success": True,
            "message": "Calificación y status guardados exitosamente",
            "grade": request.grade,
            "grade_type": request.grade_type,
            "status": request.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar calificación: {str(e)}")

@router.get("/{project_id}/grade")
async def get_grade_and_status(project_id: str):
    """
    Obtiene la calificación y status de un proyecto
    """
    try:
        db = Database.get_database()
        projects_collection = db.get_collection("projects")
        
        project = await projects_collection.find_one(
            {"project_id": project_id},
            {
                "grade": 1,
                "grade_type": 1,
                "status": 1,
                "graded_at": 1,
                "graded_by": 1
            }
        )
        
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Convertir ObjectId a string si existe
        if "_id" in project:
            project["_id"] = str(project["_id"])
        
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener calificación: {str(e)}")
