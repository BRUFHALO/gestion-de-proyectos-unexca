"""
Modelo de Notificación
Sistema de notificaciones para usuarios
"""
from datetime import datetime
from typing import Optional, Dict, Any
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


class Notification(BaseModel):
    """Modelo de Notificación"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId = Field(..., description="Usuario que recibe la notificación")
    
    type: str = Field(..., description="project_evaluated, new_version, project_approved, etc.")
    title: str
    message: str
    
    related_id: Optional[PyObjectId] = None
    related_type: Optional[str] = Field(None, description="project, evaluation, report")
    
    data: Dict[str, Any] = Field(default_factory=dict, description="Datos adicionales")
    
    read: bool = False
    read_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "type": "project_evaluated",
                "title": "Tu proyecto ha sido evaluado",
                "message": "El Prof. Martínez ha evaluado tu proyecto 'IA en Planificación Urbana'",
                "related_id": "507f1f77bcf86cd799439012",
                "related_type": "project",
                "data": {
                    "grade": 87.5,
                    "status": "needs_revision"
                },
                "read": False
            }
        }
