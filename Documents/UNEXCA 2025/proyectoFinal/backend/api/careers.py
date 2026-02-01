"""
API Router para Carreras
Endpoints para gestión de carreras universitarias
"""
from fastapi import APIRouter, HTTPException
from typing import List

from config.database import Database, DatabaseConfig
from models.career import Career

router = APIRouter(prefix="/api/v1/careers", tags=["careers"])


@router.get("/", response_model=List[Career])
async def get_careers(is_active: bool = True):
    """Obtener lista de carreras"""
    careers_collection = Database.get_collection(DatabaseConfig.CAREERS_COLLECTION)
    
    cursor = careers_collection.find({"is_active": is_active})
    careers = await cursor.to_list(length=None)
    
    return careers


@router.get("/{career_code}", response_model=Career)
async def get_career(career_code: str):
    """Obtener una carrera por código"""
    careers_collection = Database.get_collection(DatabaseConfig.CAREERS_COLLECTION)
    
    career = await careers_collection.find_one({"code": career_code})
    if not career:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    
    return career


@router.get("/{career_code}/subjects")
async def get_career_subjects(career_code: str, is_project_subject: bool = True):
    """Obtener materias de una carrera"""
    subjects_collection = Database.get_collection(DatabaseConfig.SUBJECTS_COLLECTION)
    
    filter_query = {"career_code": career_code}
    if is_project_subject:
        filter_query["is_project_subject"] = True
    
    cursor = subjects_collection.find(filter_query).sort("trayect", 1)
    subjects = await cursor.to_list(length=None)
    
    return subjects
