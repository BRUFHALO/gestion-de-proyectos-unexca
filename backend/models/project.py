"""
Modelo de Proyecto
Representa los proyectos académicos con sistema de versionamiento
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


class Author(BaseModel):
    """Autor del proyecto"""
    user_id: PyObjectId
    name: str
    role: str = Field(..., description="main_author o collaborator")


class FileMetadata(BaseModel):
    """Metadata del archivo"""
    pages: Optional[int] = None
    word_count: Optional[int] = None
    created_at: Optional[datetime] = None


class ProjectFile(BaseModel):
    """Archivo del proyecto"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    filename: str
    original_name: str
    file_type: str = Field(..., description="pdf, doc, docx")
    file_size: int
    file_url: str
    thumbnail_url: Optional[str] = None
    uploaded_by: PyObjectId
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    version: int
    is_main: bool = True
    metadata: Optional[FileMetadata] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Annotation(BaseModel):
    """Anotación sobre el documento"""
    file_id: PyObjectId
    page: int
    coordinates: Dict[str, float] = Field(..., description="x, y, width, height")
    type: str = Field(..., description="text, highlight, drawing, comment")
    content: Optional[str] = None
    color: Optional[str] = None
    author_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False
    resolved_in_version: Optional[int] = None


class EvaluationFeedback(BaseModel):
    """Feedback de evaluación"""
    overall_comment: str
    strengths: List[str] = []
    improvements: List[str] = []
    final_grade: Optional[float] = None
    graded_at: Optional[datetime] = None
    graded_by: Optional[PyObjectId] = None
    status: str = Field(..., description="approved, rejected, needs_revision")
    approved_for_publication: bool = False


class Evaluation(BaseModel):
    """Evaluación de una versión"""
    assigned_to: Optional[PyObjectId] = None
    assigned_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    grade: Optional[float] = None
    annotations: List[Annotation] = []
    feedback: Optional[EvaluationFeedback] = None


class ProjectVersion(BaseModel):
    """Versión de un proyecto"""
    version_number: int
    version_name: str
    status: str = Field(..., description="submitted, in_review, approved, rejected, needs_revision")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: PyObjectId
    parent_version: Optional[int] = None
    files: List[ProjectFile] = []
    evaluation: Optional[Evaluation] = None
    student_notes: Optional[str] = None


class AcademicInfo(BaseModel):
    """Información académica del proyecto"""
    career_code: str
    career_name: str
    methodology: str = Field(..., description="Scrum, Cascada, Investigación-Acción, etc.")
    year: int
    trayect: int
    semester: int
    keywords: List[str] = []
    subject: Optional[str] = None
    subject_code: Optional[str] = None


class ProjectMetadata(BaseModel):
    """Metadata del proyecto"""
    current_version: int = 1
    total_versions: int = 1
    max_versions_allowed: int = 5
    last_modified: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(..., description="draft, submitted, in_review, approved, rejected, published")
    approved_version: Optional[int] = None
    cleanup_status: Optional[str] = None
    cleanup_date: Optional[datetime] = None


class Publication(BaseModel):
    """Información de publicación"""
    is_public: bool = False
    published_at: Optional[datetime] = None
    published_by: Optional[PyObjectId] = None
    download_count: int = 0
    views: int = 0
    citations: List[str] = []


class ChangeLogEntry(BaseModel):
    """Entrada del historial de cambios"""
    version: int
    timestamp: datetime
    action: str = Field(..., description="created, uploaded, evaluated, approved, rejected")
    user: PyObjectId
    description: str


class VersionHistory(BaseModel):
    """Historial ligero de versiones eliminadas"""
    version_number: int
    created_at: datetime
    status: str
    grade: Optional[float] = None
    notes: str


class Project(BaseModel):
    """Modelo principal de Proyecto"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    description: str
    
    authors: List[Author]
    academic_info: AcademicInfo
    
    versions: List[ProjectVersion] = []
    metadata: ProjectMetadata = Field(default_factory=ProjectMetadata)
    publication: Publication = Field(default_factory=Publication)
    
    change_log: List[ChangeLogEntry] = []
    version_history: List[VersionHistory] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: PyObjectId

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "title": "Implementación de IA en Planificación Urbana",
                "description": "Este proyecto explora la integración de inteligencia artificial...",
                "authors": [
                    {
                        "user_id": "507f1f77bcf86cd799439011",
                        "name": "María Rodríguez",
                        "role": "main_author"
                    }
                ],
                "academic_info": {
                    "career_code": "INF-001",
                    "career_name": "Ingeniería en Informática",
                    "methodology": "Scrum",
                    "year": 2025,
                    "trayect": 3,
                    "semester": 2,
                    "keywords": ["IA", "Planificación Urbana", "Machine Learning"],
                    "subject": "Proyecto Integrador III",
                    "subject_code": "PI-III"
                }
            }
        }
