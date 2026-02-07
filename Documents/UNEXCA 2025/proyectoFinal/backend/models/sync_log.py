"""
Modelo de Log de Sincronización
Registra las sincronizaciones con la API de la universidad
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


class SyncStats(BaseModel):
    """Estadísticas de la sincronización"""
    total_processed: int = 0
    successful: int = 0
    failed: int = 0
    updated: int = 0
    created: int = 0


class SyncError(BaseModel):
    """Error durante la sincronización"""
    user_id: Optional[str] = None
    error: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SyncLog(BaseModel):
    """Modelo de Log de Sincronización"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    sync_type: str = Field(..., description="users, careers, subjects")
    status: str = Field(..., description="success, failed, partial, running")
    
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    stats: SyncStats = Field(default_factory=SyncStats)
    errors: List[SyncError] = []
    
    next_sync: Optional[datetime] = None
    global_error: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "sync_type": "users",
                "status": "success",
                "started_at": "2025-01-28T02:00:00Z",
                "completed_at": "2025-01-28T02:05:00Z",
                "stats": {
                    "total_processed": 150,
                    "successful": 148,
                    "failed": 2,
                    "updated": 12,
                    "created": 5
                },
                "errors": [
                    {
                        "user_id": "UNEXCA-999",
                        "error": "Email duplicado en sistema local",
                        "timestamp": "2025-01-28T02:03:00Z"
                    }
                ],
                "next_sync": "2025-01-29T02:00:00Z"
            }
        }
