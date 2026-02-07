"""
Modelo de Reporte
Representa reportes generados por profesores y coordinadores
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
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


class DateRange(BaseModel):
    """Rango de fechas del reporte"""
    start: datetime
    end: datetime


class GeneratedFor(BaseModel):
    """Para quién se generó el reporte"""
    user_id: Optional[PyObjectId] = None
    career_id: Optional[str] = None
    date_range: DateRange


class ReportFile(BaseModel):
    """Archivo del reporte generado"""
    format: str = Field(..., description="pdf, excel")
    url: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class Report(BaseModel):
    """Modelo de Reporte"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    type: str = Field(..., description="evaluations, approvals, activities, quarterly, annual")
    
    generated_by: PyObjectId
    generated_for: GeneratedFor
    
    data: Dict[str, Any] = Field(..., description="Datos del reporte")
    files: List[ReportFile] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "title": "Reporte de Evaluaciones - Enero 2025",
                "type": "evaluations",
                "generated_by": "507f1f77bcf86cd799439011",
                "generated_for": {
                    "user_id": "507f1f77bcf86cd799439012",
                    "career_id": "INF-001",
                    "date_range": {
                        "start": "2025-01-01T00:00:00Z",
                        "end": "2025-01-31T23:59:59Z"
                    }
                },
                "data": {
                    "total_projects": 12,
                    "evaluated_projects": 10,
                    "average_grade": 87.5,
                    "distribution": {
                        "approved": 8,
                        "rejected": 2,
                        "pending": 2
                    }
                }
            }
        }
