from fastapi import APIRouter
from config.database import Database, DatabaseConfig
from bson import ObjectId

router = APIRouter(prefix="/api/v1/debug", tags=["debug"])

@router.get("/project/{project_id}")
async def debug_project(project_id: str):
    """Debug endpoint to see project structure"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        
        if project:
            # Convertir ObjectId a string para JSON
            project["_id"] = str(project["_id"])
            
            return {
                "success": True,
                "project": project
            }
        else:
            return {
                "success": False,
                "message": "Proyecto no encontrado"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
