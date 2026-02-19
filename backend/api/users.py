"""
API Router para Usuarios
Endpoints para gestión de estudiantes, profesores y coordinadores
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId

from config.database import Database, DatabaseConfig
from models.user import User
from utils.security import hash_password

router = APIRouter(prefix="/api/v1/users", tags=["users"])


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


class CreateUserRequest(BaseModel):
    """Modelo para crear usuario"""
    first_name: str
    last_name: str
    username: str
    email: str
    password: str
    role: str
    cedula: str
    university_data: Optional[dict] = None


class UpdateUserRequest(BaseModel):
    """Modelo para actualizar usuario"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    university_data: Optional[dict] = None


class AssignTeacherRequest(BaseModel):
    """Modelo para asignar profesor a estudiante"""
    student_id: str
    teacher_id: str


class UnassignTeacherRequest(BaseModel):
    """Modelo para desasignar profesor de estudiante"""
    student_id: str


@router.get("/students-with-assignments", response_model=List[dict])
async def get_students_with_assignments():
    """Obtener lista de estudiantes con sus asignaciones de profesor"""
    try:
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Obtener todos los estudiantes
        cursor = users_collection.find({"role": "student"})
        students = await cursor.to_list(length=None)
        
        # Convertir y limpiar datos
        result = []
        for student in students:
            student_dict = dict(student)
            student_dict.pop("password", None)
            student_dict = convert_objectids(student_dict)
            result.append(student_dict)
        
        return result
        
    except Exception as e:
        print(f"Error en get_students_with_assignments: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/teachers-available", response_model=List[dict])
async def get_available_teachers():
    """Obtener lista de profesores disponibles para asignación"""
    try:
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Obtener todos los profesores
        cursor = users_collection.find({"role": "teacher"})
        teachers = await cursor.to_list(length=None)
        
        # Convertir y limpiar datos
        result = []
        for teacher in teachers:
            teacher_dict = dict(teacher)
            teacher_dict.pop("password", None)
            teacher_dict = convert_objectids(teacher_dict)
            result.append(teacher_dict)
        
        return result
        
    except Exception as e:
        print(f"Error en get_available_teachers: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/assign-teacher", response_model=dict)
async def assign_teacher_to_student(assignment: AssignTeacherRequest = Body(...)):
    """Asignar un profesor a un estudiante"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        # Verificar que el estudiante existe y es estudiante
        student_obj_id = ObjectId(assignment.student_id)
        student = await users_collection.find_one({"_id": student_obj_id, "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        # Verificar que el profesor existe y es profesor
        teacher_obj_id = ObjectId(assignment.teacher_id)
        teacher = await users_collection.find_one({"_id": teacher_obj_id, "role": "teacher"})
        if not teacher:
            raise HTTPException(status_code=404, detail="Profesor no encontrado")
        
        # Crear asignación
        assignment_data = {
            "teacher_id": str(teacher_obj_id),
            "teacher_name": teacher.get("name", ""),
            "assigned_at": datetime.utcnow(),
            "assigned_by": None  # Podría ser el ID del coordinador que hace la asignación
        }
        
        # Actualizar estudiante con la asignación
        result = await users_collection.update_one(
            {"_id": student_obj_id},
            {"$set": {"assigned_teacher": assignment_data, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        return {
            "message": "Profesor asignado exitosamente",
            "student_name": student.get("name", ""),
            "teacher_name": teacher.get("name", ""),
            "assignment": assignment_data
        }
        
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID inválido")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unassign-teacher", response_model=dict)
async def unassign_teacher_from_student(assignment: UnassignTeacherRequest = Body(...)):
    """Desasignar profesor de un estudiante"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        # Verificar que el estudiante existe
        student_obj_id = ObjectId(assignment.student_id)
        student = await users_collection.find_one({"_id": student_obj_id, "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        # Verificar que tiene asignación actual
        if not student.get("assigned_teacher"):
            raise HTTPException(status_code=400, detail="El estudiante no tiene profesor asignado")
        
        # Guardar info del profesor asignado para el mensaje
        teacher_name = student.get("assigned_teacher", {}).get("teacher_name", "")
        
        # Eliminar asignación
        result = await users_collection.update_one(
            {"_id": student_obj_id},
            {"$unset": {"assigned_teacher": ""}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        return {
            "message": "Profesor desasignado exitosamente",
            "student_name": student.get("name", ""),
            "previous_teacher": teacher_name
        }
        
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID inválido")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def get_users(
    role: Optional[str] = Query(None, description="Filtrar por rol: student, teacher, coordinator"),
    career_code: Optional[str] = Query(None, description="Filtrar por código de carrera"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros")
):
    """Obtener lista de usuarios"""
    try:
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
        
        # Convertir ObjectId a string y limpiar datos
        result = []
        for user in users:
            user_dict = dict(user)
            # Remover contraseña por seguridad
            user_dict.pop("password", None)
            # Convertir todos los ObjectIds recursivamente
            user_dict = convert_objectids(user_dict)
            result.append(user_dict)
        
        return result
        
    except Exception as e:
        print(f"Error en get_users: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/teachers-stats", response_model=List[dict])
async def get_teachers_stats():
    """Obtener estadísticas detalladas de profesores"""
    try:
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Obtener todos los profesores activos
        teachers_cursor = users_collection.find({
            "role": "teacher",
            "is_active": True
        })
        teachers = await teachers_cursor.to_list(length=None)
        
        result = []
        
        for teacher in teachers:
            teacher_id = str(teacher["_id"])
            
            # Estadísticas de proyectos
            assigned_projects = await projects_collection.count_documents({
                "evaluation.assigned_to": ObjectId(teacher_id)
            })
            
            pending_evaluations = await projects_collection.count_documents({
                "evaluation.assigned_to": ObjectId(teacher_id),
                "metadata.status": {"$in": ["submitted", "in_review"]}
            })
            
            completed_evaluations = await projects_collection.count_documents({
                "evaluation.assigned_to": ObjectId(teacher_id),
                "metadata.status": {"$in": ["approved", "rejected", "published"]}
            })
            
            # Última actividad (basada en last_login o última evaluación)
            last_login = teacher.get("last_login")
            last_active = "Desconocido"
            
            if last_login:
                try:
                    if isinstance(last_login, str):
                        login_date = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                    else:
                        login_date = last_login
                    
                    days_ago = (datetime.utcnow() - login_date).days
                    if days_ago == 0:
                        last_active = "Hoy"
                    elif days_ago == 1:
                        last_active = "Ayer"
                    elif days_ago <= 7:
                        last_active = f"Hace {days_ago} días"
                    else:
                        last_active = f"Hace {days_ago} días"
                except:
                    last_active = "No disponible"
            
            # Calcular carga de trabajo (porcentaje de capacidad)
            capacity = 20  # Capacidad máxima configurable
            load_percentage = min((assigned_projects / capacity) * 100, 100)
            
            teacher_stats = {
                "id": teacher_id,
                "name": teacher.get("name", "Sin nombre"),
                "email": teacher.get("email", ""),
                "career": teacher.get("university_data", {}).get("career_name", "Sin carrera"),
                "load": assigned_projects,  # Proyectos asignados
                "load_percentage": round(load_percentage, 1),
                "capacity": capacity,
                "pending_evaluations": pending_evaluations,
                "completed_evaluations": completed_evaluations,
                "total_projects": assigned_projects,
                "last_active": last_active,
                "last_login": teacher.get("last_login"),
                "academic_status": teacher.get("university_data", {}).get("academic_status", "active"),
                "department": teacher.get("university_data", {}).get("department", "Sin departamento"),
                "category": teacher.get("university_data", {}).get("category", "Sin categoría")
            }
            
            result.append(teacher_stats)
        
        # Ordenar por carga de trabajo (mayor a menor)
        result.sort(key=lambda x: x["load"], reverse=True)
        
        return result
        
    except Exception as e:
        print(f"Error en get_teachers_stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/students-with-assignments", response_model=List[dict])
async def get_students_with_assignments():
    """Obtener lista de estudiantes con sus asignaciones de profesor"""
    try:
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Obtener todos los estudiantes
        cursor = users_collection.find({"role": "student"})
        students = await cursor.to_list(length=None)
        
        # Convertir y limpiar datos
        result = []
        for student in students:
            student_dict = dict(student)
            student_dict.pop("password", None)
            student_dict = convert_objectids(student_dict)
            result.append(student_dict)
        
        return result
        
    except Exception as e:
        print(f"Error en get_students_with_assignments: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/teachers-available", response_model=List[dict])
async def get_available_teachers():
    """Obtener lista de profesores disponibles para asignación"""
    try:
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Obtener todos los profesores
        cursor = users_collection.find({"role": "teacher"})
        teachers = await cursor.to_list(length=None)
        
        # Convertir y limpiar datos
        result = []
        for teacher in teachers:
            teacher_dict = dict(teacher)
            teacher_dict.pop("password", None)
            teacher_dict = convert_objectids(teacher_dict)
            result.append(teacher_dict)
        
        return result
        
    except Exception as e:
        print(f"Error en get_available_teachers: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: str):
    """Obtener un usuario por ID"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Convertir ObjectId a string
        user["_id"] = str(user["_id"])
        # Remover contraseña por seguridad
        user.pop("password", None)
        
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID inválido: {str(e)}")


@router.get("/email/{email}", response_model=dict)
async def get_user_by_email(email: str):
    """Obtener un usuario por email"""
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Convertir ObjectId a string
    user["_id"] = str(user["_id"])
    # Remover contraseña por seguridad
    user.pop("password", None)
    
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


@router.post("/", response_model=dict)
async def create_user(user_data: CreateUserRequest = Body(...)):
    """Crear un nuevo usuario"""
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    # Verificar si la cédula ya existe
    existing_user = await users_collection.find_one({"cedula": user_data.cedula})
    if existing_user:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con esta cédula")
    
    # Verificar si el email ya existe
    existing_email = await users_collection.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este email")
    
    # Verificar si el username ya existe
    existing_username = await users_collection.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este username")
    
    # Hashear contraseña
    hashed_password = hash_password(user_data.password)
    
    # Crear university_data básico si no se proporciona
    university_data = user_data.university_data or {}
    if "career_name" in university_data:
        university_data["career"] = university_data["career_name"]
    
    # Asegurar campos mínimos para university_data
    if "user_id" not in university_data:
        university_data["user_id"] = f"UNEXCA-{user_data.cedula}"
    if "career" not in university_data:
        university_data["career"] = "Informática"
    if "career_code" not in university_data:
        university_data["career_code"] = "INF-001"
    if "faculty" not in university_data:
        university_data["faculty"] = "Ingeniería"
    if "academic_status" not in university_data:
        university_data["academic_status"] = "active"
    
    # Crear usuario
    new_user = {
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "name": f"{user_data.first_name} {user_data.last_name}",
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "role": user_data.role,
        "cedula": user_data.cedula,
        "university_data": university_data,
        "profile": {
            "avatar_url": None,
            "phone": None,
            "bio": None,
            "preferences": {}
        },
        "stats": {
            "projects_submitted": 0,
            "projects_evaluated": 0,
            "projects_supervised": 0,
            "average_grade": None,
            "last_activity": None
        },
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(new_user)
    
    # Convertir ObjectId a string
    new_user["_id"] = str(result.inserted_id)
    
    # Remover contraseña de la respuesta
    new_user.pop("password", None)
    
    return {
        "message": "Usuario creado exitosamente",
        "user": new_user
    }


@router.put("/{user_id}", response_model=dict)
async def update_user(user_id: str, user_data: UpdateUserRequest = Body(...)):
    """Actualizar un usuario existente"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        # Verificar si el usuario existe
        obj_id = ObjectId(user_id)
        existing_user = await users_collection.find_one({"_id": obj_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Construir datos de actualización
        update_data = {"updated_at": datetime.utcnow()}
        
        if user_data.first_name is not None:
            update_data["first_name"] = user_data.first_name
        if user_data.last_name is not None:
            update_data["last_name"] = user_data.last_name
        if user_data.email is not None:
            # Verificar si el email ya existe en otro usuario
            existing_email = await users_collection.find_one({
                "email": user_data.email,
                "_id": {"$ne": obj_id}
            })
            if existing_email:
                raise HTTPException(status_code=400, detail="Ya existe otro usuario con este email")
            update_data["email"] = user_data.email
        if user_data.role is not None:
            update_data["role"] = user_data.role
        if user_data.university_data is not None:
            update_data["university_data"] = user_data.university_data
        
        # Actualizar nombre completo si se cambió first_name o last_name
        if user_data.first_name is not None or user_data.last_name is not None:
            first_name = user_data.first_name if user_data.first_name is not None else existing_user.get("first_name", "")
            last_name = user_data.last_name if user_data.last_name is not None else existing_user.get("last_name", "")
            update_data["name"] = f"{first_name} {last_name}".strip()
        
        # Ejecutar actualización
        result = await users_collection.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Obtener usuario actualizado
        updated_user = await users_collection.find_one({"_id": obj_id})
        updated_user["_id"] = str(updated_user["_id"])
        
        # Remover contraseña de la respuesta
        updated_user.pop("password", None)
        
        return {
            "message": "Usuario actualizado exitosamente",
            "user": updated_user
        }
        
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID de usuario inválido")
        raise HTTPException(status_code=500, detail=str(e))


class AssignTeacherRequest(BaseModel):
    """Modelo para asignar profesor a estudiante"""
    student_id: str
    teacher_id: str


class UnassignTeacherRequest(BaseModel):
    """Modelo para desasignar profesor de estudiante"""
    student_id: str


@router.post("/assign-teacher", response_model=dict)
async def assign_teacher_to_student(assignment: AssignTeacherRequest = Body(...)):
    """Asignar un profesor a un estudiante"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        # Verificar que el estudiante existe y es estudiante
        student_obj_id = ObjectId(assignment.student_id)
        student = await users_collection.find_one({"_id": student_obj_id, "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        # Verificar que el profesor existe y es profesor
        teacher_obj_id = ObjectId(assignment.teacher_id)
        teacher = await users_collection.find_one({"_id": teacher_obj_id, "role": "teacher"})
        if not teacher:
            raise HTTPException(status_code=404, detail="Profesor no encontrado")
        
        # Crear asignación
        assignment_data = {
            "teacher_id": str(teacher_obj_id),
            "teacher_name": teacher.get("name", ""),
            "assigned_at": datetime.utcnow(),
            "assigned_by": None  # Podría ser el ID del coordinador que hace la asignación
        }
        
        # Actualizar estudiante con la asignación
        result = await users_collection.update_one(
            {"_id": student_obj_id},
            {"$set": {"assigned_teacher": assignment_data, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        return {
            "message": "Profesor asignado exitosamente",
            "student_name": student.get("name", ""),
            "teacher_name": teacher.get("name", ""),
            "assignment": assignment_data
        }
        
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID inválido")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unassign-teacher", response_model=dict)
async def unassign_teacher_from_student(assignment: UnassignTeacherRequest = Body(...)):
    """Desasignar profesor de un estudiante"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        # Verificar que el estudiante existe
        student_obj_id = ObjectId(assignment.student_id)
        student = await users_collection.find_one({"_id": student_obj_id, "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        # Verificar que tiene asignación actual
        if not student.get("assigned_teacher"):
            raise HTTPException(status_code=400, detail="El estudiante no tiene profesor asignado")
        
        # Guardar info del profesor asignado para el mensaje
        teacher_name = student.get("assigned_teacher", {}).get("teacher_name", "")
        
        # Eliminar asignación
        result = await users_collection.update_one(
            {"_id": student_obj_id},
            {"$unset": {"assigned_teacher": ""}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        return {
            "message": "Profesor desasignado exitosamente",
            "student_name": student.get("name", ""),
            "previous_teacher": teacher_name
        }
        
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID inválido")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: str):
    """Eliminar un usuario"""
    from bson import ObjectId
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    try:
        obj_id = ObjectId(user_id)
        
        # Verificar si el usuario existe
        existing_user = await users_collection.find_one({"_id": obj_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Eliminar usuario
        result = await users_collection.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return {
            "message": "Usuario eliminado exitosamente"
        }
        
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID de usuario inválido")
        raise HTTPException(status_code=500, detail=str(e))
