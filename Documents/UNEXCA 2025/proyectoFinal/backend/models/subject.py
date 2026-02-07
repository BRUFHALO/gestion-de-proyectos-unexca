"""
Modelo de Materia/Asignatura
Representa las materias de proyecto de cada carrera
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


class SubjectRequirements(BaseModel):
    """Requisitos de la materia de proyecto"""
    min_pages: Optional[int] = None
    max_pages: Optional[int] = None
    required_sections: List[str] = []
    methodologies_allowed: List[str] = []
    team_size_min: int = 1
    team_size_max: int = 1
    requires_advisor: bool = False


class Subject(BaseModel):
    """Modelo de Materia/Asignatura"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    code: str = Field(..., description="Código único de la materia")
    name: str = Field(..., description="Nombre de la materia")
    
    career_code: str = Field(..., description="Código de la carrera")
    career_name: str = Field(..., description="Nombre de la carrera")
    
    trayect: int = Field(..., description="Trayecto al que pertenece")
    semester: int = Field(..., description="Semestre dentro del trayecto")
    
    is_project_subject: bool = Field(default=True, description="Si es materia de proyecto")
    project_type: str = Field(..., description="Tipo: integrador, investigación, comunitario, tesis")
    
    credits: int = Field(..., description="Unidades de crédito")
    hours_per_week: int = Field(..., description="Horas semanales")
    
    description: str = Field(..., description="Descripción de la materia")
    objectives: List[str] = []
    requirements: SubjectRequirements = Field(default_factory=SubjectRequirements)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "code": "PI-III",
                "name": "Proyecto Integrador III",
                "career_code": "INF-001",
                "career_name": "Ingeniería en Informática",
                "trayect": 3,
                "semester": 2,
                "is_project_subject": True,
                "project_type": "integrador",
                "credits": 6,
                "hours_per_week": 8,
                "description": "Desarrollo de proyecto integrador aplicando metodologías ágiles",
                "objectives": [
                    "Aplicar metodologías de desarrollo de software",
                    "Integrar conocimientos de trayectos anteriores",
                    "Desarrollar soluciones tecnológicas innovadoras"
                ],
                "requirements": {
                    "min_pages": 30,
                    "max_pages": 80,
                    "required_sections": ["Introducción", "Marco Teórico", "Metodología", "Resultados", "Conclusiones"],
                    "methodologies_allowed": ["Scrum", "Kanban", "XP"],
                    "team_size_min": 1,
                    "team_size_max": 3,
                    "requires_advisor": True
                }
            }
        }
