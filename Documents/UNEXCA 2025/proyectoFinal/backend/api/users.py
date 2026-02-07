"""
API Router para Usuarios
Endpoints para gestión de estudiantes, profesores y coordinadores
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from config.database import Database, DatabaseConfig
from models.user import User

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/", response_model=List[User])
async def get_users(
    role: Optional[str] = Query(None, description="Filtrar por rol: student, teacher, coordinator"),
    career_code: Optional[str] = Query(None, description="Filtrar por código de carrera"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=100, description="Número máximo de registros")
):
    """Obtener lista de usuarios"""
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    # Construir filtro
    filter_query = {}
    if role:
        filter_query["role"] = role
    if career_code:
        filter_query["university_data.career_code"] = career_code
    if is_active is not None:
        filter_query["is_active"] = is_active
    
    # Consultar usuarios
    cursor = users_collection.find(filter_query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return users


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Obtener un usuario por ID"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID inválido: {str(e)}")


@router.get("/email/{email}", response_model=User)
async def get_user_by_email(email: str):
    """Obtener un usuario por email"""
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return user


@router.put("/{user_id}/profile")
async def update_user_profile(user_id: str, profile_data: dict):
    """Actualizar perfil de usuario"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "profile": profile_data,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return {"message": "Perfil actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stats/summary")
async def get_users_stats():
    """Obtener estadísticas generales de usuarios"""
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    total_users = await users_collection.count_documents({})
    active_users = await users_collection.count_documents({"is_active": True})
    
    # Contar por rol
    students = await users_collection.count_documents({"role": "student"})
    teachers = await users_collection.count_documents({"role": "teacher"})
    coordinators = await users_collection.count_documents({"role": "coordinator"})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "by_role": {
            "students": students,
            "teachers": teachers,
            "coordinators": coordinators
        }
    }
