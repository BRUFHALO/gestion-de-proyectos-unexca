"""
API Router para Responsables de Grupo
Endpoints para gestión de responsables de grupo de estudiantes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId

from config.database import Database, DatabaseConfig

router = APIRouter(prefix="/api/v1/group-responsibles", tags=["group-responsibles"])


def convert_objectids(obj):
    """Convertir recursivamente todos los ObjectIds a strings"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectids(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids(item) for item in obj]
    else:
        return obj


class CreateGroupResponsibleRequest(BaseModel):
    """Modelo para crear responsable de grupo"""
    studentId: str
    teacherId: str
    assignedBy: str


@router.post("/", response_model=dict)
async def create_group_responsible(request: CreateGroupResponsibleRequest):
    """Crear un nuevo responsable de grupo"""
    try:
        # Validar que el studentId sea un ObjectId válido
        if not ObjectId.is_valid(request.studentId):
            raise HTTPException(status_code=400, detail="ID de estudiante inválido")
        
        # Validar que el teacherId sea un ObjectId válido
        if not ObjectId.is_valid(request.teacherId):
            raise HTTPException(status_code=400, detail="ID de profesor inválido")
        
        group_responsibles_collection = Database.get_collection("group_responsibles")
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Verificar que el estudiante existe y es estudiante
        student = await users_collection.find_one({
            "_id": ObjectId(request.studentId),
            "role": "student"
        })
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        # Verificar que el profesor existe y es profesor
        teacher = await users_collection.find_one({
            "_id": ObjectId(request.teacherId),
            "role": "teacher"
        })
        if not teacher:
            raise HTTPException(status_code=404, detail="Profesor no encontrado")
        
        # Verificar que el estudiante no ya sea responsable de este profesor
        existing_responsible = await group_responsibles_collection.find_one({
            "student_id": ObjectId(request.studentId),
            "teacher_id": ObjectId(request.teacherId)
        })
        if existing_responsible:
            raise HTTPException(status_code=400, detail="Este estudiante ya es responsable de grupo de este profesor")
        
        # Crear responsable de grupo
        responsible_data = {
            "student_id": ObjectId(request.studentId),
            "teacher_id": ObjectId(request.teacherId),
            "assigned_at": datetime.utcnow(),
            "assigned_by": request.assignedBy
        }
        
        result = await group_responsibles_collection.insert_one(responsible_data)
        
        # Obtener el responsable creado con datos del estudiante
        created_responsible = await group_responsibles_collection.find_one({"_id": result.inserted_id})
        
        # Preparar respuesta con datos del estudiante
        student_data = convert_objectids(student)
        responsible_data = convert_objectids(created_responsible)
        
        return {
            "_id": responsible_data["_id"],
            "student": {
                "_id": student_data["_id"],
                "name": (
                    f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}".strip() 
                    if student_data.get('first_name') or student_data.get('last_name')
                    else student_data.get('name', 'Sin nombre')
                ),
                "email": student_data.get("email", ""),
                "cedula": student_data.get("cedula", ""),
                "section": student_data.get("university_data", {}).get("section", "")
            },
            "assignedAt": responsible_data["assigned_at"],
            "assignedBy": responsible_data["assigned_by"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/teacher/{teacher_id}", response_model=List[dict])
async def get_teacher_responsibles(teacher_id: str):
    """Obtener todos los responsables de grupo de un profesor"""
    try:
        # Validar que el teacherId sea un ObjectId válido
        if not ObjectId.is_valid(teacher_id):
            raise HTTPException(status_code=400, detail="ID de profesor inválido")
        
        group_responsibles_collection = Database.get_collection("group_responsibles")
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Obtener responsables del profesor
        responsibles_cursor = group_responsibles_collection.find({
            "teacher_id": ObjectId(teacher_id)
        }).sort("assigned_at", -1)
        
        responsibles = []
        async for responsible in responsibles_cursor:
            # Obtener datos del estudiante
            student = await users_collection.find_one({
                "_id": responsible["student_id"]
            })
            
            if student:
                student_data = convert_objectids(student)
                responsible_data = convert_objectids(responsible)
                
                responsibles.append({
                    "_id": responsible_data["_id"],
                    "student": {
                        "_id": student_data["_id"],
                        "name": (
                            f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}".strip() 
                            if student_data.get('first_name') or student_data.get('last_name')
                            else student_data.get('name', 'Sin nombre')
                        ),
                        "email": student_data.get("email", ""),
                        "cedula": student_data.get("cedula", ""),
                        "section": student_data.get("university_data", {}).get("section", "")
                    },
                    "assignedAt": responsible_data["assigned_at"],
                    "assignedBy": responsible_data["assigned_by"]
                })
        
        return responsibles
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{responsible_id}", response_model=dict)
async def delete_group_responsible(responsible_id: str):
    """Eliminar un responsable de grupo"""
    try:
        # Validar que el responsibleId sea un ObjectId válido
        if not ObjectId.is_valid(responsible_id):
            raise HTTPException(status_code=400, detail="ID de responsable inválido")
        
        group_responsibles_collection = Database.get_collection("group_responsibles")
        
        # Verificar que el responsable existe
        existing_responsible = await group_responsibles_collection.find_one({
            "_id": ObjectId(responsible_id)
        })
        if not existing_responsible:
            raise HTTPException(status_code=404, detail="Responsable de grupo no encontrado")
        
        # Eliminar responsable
        result = await group_responsibles_collection.delete_one({
            "_id": ObjectId(responsible_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Responsable de grupo no encontrado")
        
        return {
            "message": "Responsable de grupo eliminado exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}/is-responsible", response_model=dict)
async def check_student_responsible(student_id: str, teacher_id: Optional[str] = None):
    """Verificar si un estudiante es responsable de grupo"""
    try:
        # Validar que el studentId sea un ObjectId válido
        if not ObjectId.is_valid(student_id):
            raise HTTPException(status_code=400, detail="ID de estudiante inválido")
        
        group_responsibles_collection = Database.get_collection("group_responsibles")
        
        # Construir filtro
        filter_query = {"student_id": ObjectId(student_id)}
        if teacher_id:
            if not ObjectId.is_valid(teacher_id):
                raise HTTPException(status_code=400, detail="ID de profesor inválido")
            filter_query["teacher_id"] = ObjectId(teacher_id)
        
        # Buscar responsable
        responsible = await group_responsibles_collection.find_one(filter_query)
        
        return {
            "is_responsible": responsible is not None,
            "teacher_id": str(responsible["teacher_id"]) if responsible else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
