"""
API Router para Autenticación
Endpoints para login y validación de usuarios con cédula
"""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from config.database import Database, DatabaseConfig
from models.user import User
from utils.security import verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    """Modelo de petición de login"""
    cedula: str
    password: str


class LoginResponse(BaseModel):
    """Modelo de respuesta de login"""
    success: bool
    message: str
    user: Optional[dict] = None


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest = Body(...)):
    """
    Validar credenciales de usuario usando cédula y contraseña
    
    Lógica por rol:
    - Estudiante: usuario=cédula, contraseña=cédula
    - Docente: usuario=cédula, contraseña fuerte (proporcionada por coordinador)
    - Coordinador: usuario=cédula, contraseña fuerte (mínimo 9 caracteres)
    """
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    # Buscar usuario por cédula
    user = await users_collection.find_one({"cedula": credentials.cedula})
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado. Verifica tu cédula."
        )
    
    # Verificar que el usuario esté activo
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=403,
            detail="Usuario inactivo. Contacta al administrador."
        )
    
    # Verificar contraseña
    if not verify_password(credentials.password, user.get("password")):
        raise HTTPException(
            status_code=401,
            detail="Contraseña incorrecta."
        )
    
    # Actualizar última fecha de login
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Para estudiantes, cargar información del profesor asignado
    if user.get("role") == "student" and user.get("assigned_teacher"):
        teacher_id = user["assigned_teacher"].get("teacher_id")
        if teacher_id:
            teacher = await users_collection.find_one({"_id": teacher_id})
            if teacher:
                user["assigned_teacher"]["teacher_name"] = teacher.get("name")
    
    # Convertir ObjectId a string para serialización
    user["_id"] = str(user["_id"])
    if user.get("assigned_teacher") and user["assigned_teacher"].get("teacher_id"):
        user["assigned_teacher"]["teacher_id"] = str(user["assigned_teacher"]["teacher_id"])
    
    return LoginResponse(
        success=True,
        message="Login exitoso",
        user=user
    )


@router.post("/validate-cedula")
async def validate_cedula(cedula: str = Body(..., embed=True)):
    """
    Validar si una cédula existe en el sistema
    """
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    user = await users_collection.find_one({"cedula": cedula})
    
    return {
        "exists": user is not None,
        "cedula": cedula,
        "role": user.get("role") if user else None,
        "name": user.get("name") if user else None
    }


@router.get("/check-session/{user_id}")
async def check_session(user_id: str):
    """
    Verificar si una sesión de usuario es válida
    """
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="Sesión inválida")
        
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Usuario inactivo")
        
        return {
            "valid": True,
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID inválido: {str(e)}")
