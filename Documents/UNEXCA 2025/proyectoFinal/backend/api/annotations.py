from fastapi import APIRouter, HTTPException, Depends, Depends, Depends, Depends
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId

from config.database import Database, DatabaseConfig
from utils.security import get_current_user
from utils.security import get_current_userfrom utils.security import get_current_user

from utils.security import get_current_user

router = APIRouter(prefix="/api/v1/annotations", tags=["annotations"])

class AnnotationCreate(BaseModel):
    project_id: str
    page: int
    annotation_data: dict
    type: str = "correction"
    comment: Optional[str] = None

class AnnotationResponse(BaseModel):
    _id: str
    project_id: str
    page: int
    annotation_data: dict
    type: str
    comment: Optional[str]
    created_by: str
    created_at: str
otatinCreae],
    urrent_ser)
):

@router.post("/save", respoationCreate],
    nse_model=dict)urrent_ser)
):

async def save_annotations(ationCreate],
    rrent_user)
):

    annotations: List[AnnotationCreate],
    current_user: dict = Depends(get_current_user)
):
    """Guardar múltiples anotaciones para un proyecto"""
    annotations_collection = Database.get_collection("annotations")
    
    saved_annotations = []
    
    for annotation in annotations:
        annotation_doc = {
            "project_id": ObjectId(annotation.project_id),
            "page": annotation.page,
            "annotation_data": annotation.annotation_data,
            "type": annotation.type,
            "comment": annotation.comment,
            "created_by": ObjectId(current_user["_id"]),
            "created_at": Database.get_current_time()
        }
        result = await annotations_collection.insert_one(annotation_doc)
        saved_annotations.append(str(result.inserted_id))
    
    return {
        "success": True,
        "message": "Anotaciones guardadas exitosamente",
        "annotation_ids": saved_annotations
    }

@router.get("/project/{project_id}", response_model=List[AnnotationResponse])
async def get_project_annotations(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener todas las anotaciones de un proyecto"""
    annotations_collection = Database.get_collection("annotations")
    
    annotations = await annotations_collection.find({
        "project_id": ObjectId(project_id)
    }).to_list(length=None)
    
    result = []
    for annotation in annotations:
        annotation["_id"] = str(annotation["_id"])
        annotation["project_id"] = str(annotation["project_id"])
        annotation["created_by"] = str(annotation["created_by"])
        result.append(annotation)
    
    return result

@router.delete("/{annotation_id
async def delete_annotation(annotation_id: str):
    """Eliminar una anotación"""
   a
    # Check if annotation exists and user has permission
    annotation = await annotations_collection.find_one({
        "_id": ObjectId(annotation_id),
        "created_by": ObjectId(current_user["_id"])
    })
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Anotación no encontrada o sin permisos")
    
    await annotations_collection.delete_one({"_id": ObjectId(annotation_id)})
    
    return {"success": True, "message": "Anotación eliminada exitosamente"}
