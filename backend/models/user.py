"""
Modelo de Usuario
Representa estudiantes, profesores y coordinadores
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.no_info_plain_validator_function(cls.validate),
        ])

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class UniversityData(BaseModel):
    """Datos sincronizados desde la API de la universidad"""
    user_id: str = Field(..., description="ID del usuario en el sistema universitario")
    enrollment_number: Optional[str] = Field(None, description="Número de matrícula (estudiantes)")
    employee_number: Optional[str] = Field(None, description="Número de empleado (profesores)")
    career: str = Field(..., description="Nombre de la carrera")
    career_code: str = Field(..., description="Código de la carrera")
    faculty: str = Field(..., description="Facultad")
    department: Optional[str] = Field(None, description="Departamento (profesores)")
    category: Optional[str] = Field(None, description="Categoría del profesor")
    current_trayect: Optional[int] = Field(None, description="Trayecto actual (estudiantes)")
    current_semester: Optional[int] = Field(None, description="Semestre actual (estudiantes)")
    gpa: Optional[float] = Field(None, description="Promedio académico (estudiantes)")
    academic_status: str = Field(..., description="Estado académico: active, inactive, graduated")
    last_sync: datetime = Field(default_factory=datetime.utcnow, description="Última sincronización")


class UserProfile(BaseModel):
    """Perfil del usuario (datos locales)"""
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)


class UserStats(BaseModel):
    """Estadísticas del usuario"""
    projects_submitted: int = 0
    projects_evaluated: int = 0
    projects_supervised: int = 0
    average_grade: Optional[float] = None
    last_activity: Optional[datetime] = None


class StudentAssignment(BaseModel):
    """Asignación de estudiante a profesor"""
    teacher_id: Optional[PyObjectId] = None
    teacher_name: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    assigned_at: Optional[datetime] = None


class User(BaseModel):
    """Modelo principal de Usuario"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    cedula: str = Field(..., description="Cédula de identidad (usuario)")
    password: str = Field(..., description="Contraseña hasheada")
    email: EmailStr = Field(..., description="Email del usuario")
    name: str = Field(..., description="Nombre completo")
    role: str = Field(..., description="Rol: student, teacher, coordinator")
    
    university_data: UniversityData
    profile: UserProfile = Field(default_factory=UserProfile)
    stats: UserStats = Field(default_factory=UserStats)
    
    # Asignaciones (solo para estudiantes)
    assigned_teacher: Optional[StudentAssignment] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "cedula": "27123456",
                "password": "hashed_password_here",
                "email": "maria.rodriguez@unexca.edu.ve",
                "name": "María Rodríguez",
                "role": "student",
                "university_data": {
                    "user_id": "UNEXCA-12345",
                    "enrollment_number": "2021-12345",
                    "career": "Ingeniería en Informática",
                    "career_code": "INF-001",
                    "faculty": "Ingeniería",
                    "current_trayect": 3,
                    "current_semester": 2,
                    "gpa": 16.5,
                    "academic_status": "active"
                },
                "profile": {
                    "phone": "+58-212-1234567",
                    "bio": "Estudiante de Ingeniería en Informática"
                },
                "assigned_teacher": {
                    "teacher_id": "507f1f77bcf86cd799439011",
                    "teacher_name": "Prof. Carlos Martínez",
                    "subject_code": "PI-III",
                    "subject_name": "Proyecto Integrador III"
                },
                "is_active": True
            }
        }
