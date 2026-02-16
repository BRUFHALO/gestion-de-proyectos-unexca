from fastapi import APIRouter
from config.database import Database, DatabaseConfig
from bson import ObjectId

router = APIRouter(prefix="/api/v1/debug", tags=["debug"])

@router.get("/projects-status")
async def debug_projects_status():
    """Debug endpoint to see all projects with their status"""
    try:
        db = Database.get_database()
        projects_collection = db.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Obtener todos los proyectos
        all_projects = await projects_collection.find({}).to_list(length=50)
        
        result = []
        for project in all_projects:
            project_info = {
                "id": str(project["_id"]),
                "title": project.get("title", "Sin título"),
                "status": project.get("status", "no_status"),
                "metadata_status": project.get("metadata", {}).get("status", "no_metadata_status"),
                "grade": project.get("grade", "no_grade"),
                "graded_by": project.get("graded_by", "no_graded_by")
            }
            result.append(project_info)
        
        return {
            "success": True,
            "projects": result,
            "total": len(result)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
