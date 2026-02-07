"""
API Router para Materias
Endpoints para gestión de materias de proyecto
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from config.database import Database, DatabaseConfig
from models.subject import Subject

router = APIRouter(prefix="/api/v1/subjects", tags=["subjects"])


@router.get("/", response_model=List[Subject])
async def get_subjects(
    career_code: Optional[str] = None,
    is_project_subject: bool = True,
    trayect: Optional[int] = None
):
    """Obtener lista de materias"""
    subjects_collection = Database.get_collection(DatabaseConfig.SUBJECTS_COLLECTION)
    
    filter_query = {}
    if career_code:
        filter_query["career_code"] = career_code
    if is_project_subject:
        filter_query["is_project_subject"] = True
    if trayect:
        filter_query["trayect"] = trayect
    
    cursor = subjects_collection.find(filter_query).sort([("trayect", 1), ("semester", 1)])
    subjects = await cursor.to_list(length=None)
    
    return subjects


@router.get("/{subject_code}", response_model=Subject)
async def get_subject(subject_code: str):
    """Obtener una materia por código"""
    subjects_collection = Database.get_collection(DatabaseConfig.SUBJECTS_COLLECTION)
    
    subject = await subjects_collection.find_one({"code": subject_code})
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    return subject
