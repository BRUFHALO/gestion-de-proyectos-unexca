"""
Modelo de Carrera
Representa las carreras universitarias (cache de la universidad)
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
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


class UniversitySync(BaseModel):
    """Información de sincronización con la universidad"""
    career_id: int = Field(..., description="ID en el sistema universitario")
    last_sync: datetime = Field(default_factory=datetime.utcnow)
    sync_status: str = Field(default="active", description="active, inactive, error")


class Career(BaseModel):
    """Modelo de Carrera"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    code: str = Field(..., description="Código único de la carrera")
    name: str = Field(..., description="Nombre de la carrera")
    
    faculty: str = Field(..., description="Facultad a la que pertenece")
    faculty_code: str = Field(..., description="Código de la facultad")
    
    description: str = Field(..., description="Descripción de la carrera")
    duration_years: int = Field(default=4, description="Duración en años")
    total_trayects: int = Field(default=4, description="Total de trayectos")
    
    active_students: int = Field(default=0, description="Estudiantes activos")
    active_teachers: int = Field(default=0, description="Profesores activos")
    
    university_sync: UniversitySync
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "code": "INF-001",
                "name": "Ingeniería en Informática",
                "faculty": "Ingeniería",
                "faculty_code": "ING-001",
                "description": "Carrera de 4 años enfocada en desarrollo de software y sistemas",
                "duration_years": 4,
                "total_trayects": 4,
                "active_students": 245,
                "active_teachers": 18,
                "university_sync": {
                    "career_id": 123,
                    "sync_status": "active"
                }
            }
        }
