"""



API Router para Proyectos



Endpoints para gestión de proyectos académicos



"""



from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form



from fastapi.responses import FileResponse



from typing import List, Optional



from datetime import datetime



from bson import ObjectId



import os



from pydantic import BaseModel







from config.database import Database, DatabaseConfig



from models.project import Project



from utils.file_storage import FileStorage







router = APIRouter(prefix="/api/v1/projects", tags=["projects"])











# Modelos para calificación



class GradeRequest(BaseModel):



    grade: float



    grade_type: str  # 'parcial' o 'definitiva'



    status: str  # 'en_revision', 'aprobado', 'reprobado'



    teacher_id: str











@router.put("/{project_id}/evaluation/grade")



async def save_grade_and_status(



    project_id: str,



    request: GradeRequest



):



    """



    Guarda o actualiza la calificación y status de un proyecto



    """



    try:



        db = Database.get_database()



        projects_collection = db.get_collection("projects")



        



        # Verificar que el proyecto existe (usando _id como ObjectId)



        try:



            project_object_id = ObjectId(project_id)



        except Exception as e:



            raise HTTPException(status_code=400, detail=f"ID de proyecto inválido: {e}")







        project = await projects_collection.find_one({"_id": project_object_id})



        if not project:



            raise HTTPException(status_code=404, detail="Proyecto no encontrado")



        



        # Actualizar el proyecto con la calificación y status



        update_data = {



            "grade": request.grade,



            "grade_type": request.grade_type,



            "graded_at": datetime.now(),



            "graded_by": request.teacher_id,



            "updated_at": datetime.now()



        }

        # Si el proyecto no tiene metadata, crear la estructura
        if "metadata" not in project:
            update_data["metadata"] = {"status": request.status}
        else:
            update_data["metadata.status"] = request.status



        



        result = await projects_collection.update_one(



            {"_id": project_object_id},



            {"$set": update_data}



        )



        



        if result.matched_count == 0:



            raise HTTPException(status_code=404, detail="Proyecto no encontrado")



        



        return {



            "success": True,



            "message": "Calificación y status guardados exitosamente",



            "grade": request.grade,



            "grade_type": request.grade_type,



            "status": request.status



        }



        



    except HTTPException:



        raise



    except Exception as e:



        raise HTTPException(status_code=500, detail=f"Error al guardar calificación: {str(e)}")











@router.get("/{project_id}/evaluation/grade")



async def get_grade_and_status(project_id: str):



    """



    Obtiene la calificación y status de un proyecto



    """



    try:



        db = Database.get_database()



        projects_collection = db.get_collection("projects")







        try:



            project_object_id = ObjectId(project_id)



        except Exception as e:



            raise HTTPException(status_code=400, detail=f"ID de proyecto inválido: {e}")







        project = await projects_collection.find_one(



            {"_id": project_object_id},



            {



                "grade": 1,



                "grade_type": 1,



                "status": 1,



                "graded_at": 1,



                "graded_by": 1



            }



        )



        



        if not project:



            raise HTTPException(status_code=404, detail="Proyecto no encontrado")



        



        # Convertir ObjectId a string si existe



        if "_id" in project:



            project["_id"] = str(project["_id"])



        



        return project



        



    except HTTPException:



        raise



    except Exception as e:



        raise HTTPException(status_code=500, detail=f"Error al obtener calificación: {str(e)}")











@router.get("/test")



async def test_endpoint():



    """Endpoint de prueba para verificar que el backend funciona"""



    return {"message": "Backend is working!", "timestamp": datetime.now()}











@router.get("/")



async def get_projects(



    status: Optional[str] = Query(None, description="Filtrar por estado"),



    career_code: Optional[str] = Query(None, description="Filtrar por carrera"),



    year: Optional[int] = Query(None, description="Filtrar por año"),



    created_by: Optional[str] = Query(None, description="Filtrar por autor"),



    assigned_to: Optional[str] = Query(None, description="Filtrar por profesor asignado"),



    skip: int = Query(0, ge=0),



    limit: int = Query(50, ge=1, le=100)



):



    """Obtener lista de proyectos"""



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    # Construir filtro



    filter_query = {}



    if status:



        filter_query["metadata.status"] = status



    if career_code:



        filter_query["academic_info.career_code"] = career_code



    if year:



        filter_query["academic_info.year"] = year



    if created_by:



        filter_query["created_by"] = ObjectId(created_by)



    if assigned_to:



        filter_query["evaluation.assigned_to"] = ObjectId(assigned_to)



    



    # Consultar proyectos



    cursor = projects_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)



    projects = await cursor.to_list(length=limit)



    



    # Convertir ObjectId a string para serialización



    for project in projects:



        project["_id"] = str(project["_id"])



        if project.get("created_by"):



            project["created_by"] = str(project["created_by"])



        if project.get("evaluation") and project["evaluation"].get("assigned_to"):



            project["evaluation"]["assigned_to"] = str(project["evaluation"]["assigned_to"])



        # Convertir ObjectIds en authors



        if project.get("authors"):



            for author in project["authors"]:



                if author.get("user_id"):



                    author["user_id"] = str(author["user_id"])



    



    return projects











@router.get("/{project_id}")



async def get_project(project_id: str):



    """Obtener un proyecto por ID"""



    



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    try:



        project = await projects_collection.find_one({"_id": ObjectId(project_id)})



        if not project:



            raise HTTPException(status_code=404, detail="Proyecto no encontrado")



        



        # Convertir ObjectId a string



        project["_id"] = str(project["_id"])



        if project.get("created_by"):



            project["created_by"] = str(project["created_by"])



        if project.get("evaluation") and project["evaluation"].get("assigned_to"):



            project["evaluation"]["assigned_to"] = str(project["evaluation"]["assigned_to"])



        if project.get("authors"):



            for author in project["authors"]:



                if author.get("user_id"):



                    author["user_id"] = str(author["user_id"])



        



        return project



    except Exception as e:



        raise HTTPException(status_code=400, detail=f"ID inválido: {str(e)}")











@router.get("/{project_id}/versions")



async def get_project_versions(project_id: str):



    """Obtener historial de versiones de un proyecto"""



    from bson import ObjectId



    



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    try:



        project = await projects_collection.find_one({"_id": ObjectId(project_id)})



        if not project:



            raise HTTPException(status_code=404, detail="Proyecto no encontrado")



        



        # Formatear respuesta con resumen de versiones



        versions_summary = []



        for version in project.get("versions", []):



            versions_summary.append({



                "version_number": version["version_number"],



                "version_name": version["version_name"],



                "status": version["status"],



                "created_at": version["created_at"],



                "grade": version.get("evaluation", {}).get("grade"),



                "feedback_count": len(version.get("evaluation", {}).get("annotations", [])),



                "files_count": len(version.get("files", [])),



                "student_notes": version.get("student_notes")



            })



        



        return {



            "project_id": str(project["_id"]),



            "title": project["title"],



            "current_version": project["metadata"]["current_version"],



            "total_versions": project["metadata"]["total_versions"],



            "versions": versions_summary



        }



    except Exception as e:



        raise HTTPException(status_code=400, detail=str(e))











@router.get("/teacher/{teacher_id}/assigned")



async def get_teacher_assigned_projects(



    teacher_id: str,



    status: Optional[str] = Query(None, description="Filtrar por estado")



):



    """Obtener proyectos asignados a un profesor"""



    from bson import ObjectId



    



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    filter_query = {"versions.evaluation.assigned_to": ObjectId(teacher_id)}



    if status:



        filter_query["metadata.status"] = status



    



    cursor = projects_collection.find(filter_query).sort("created_at", -1)



    projects = await cursor.to_list(length=None)



    



    return projects











@router.get("/stats/summary")



async def get_projects_stats():



    """Obtener estadísticas generales de proyectos"""



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    total_projects = await projects_collection.count_documents({})



    



    # Contar por estado



    submitted = await projects_collection.count_documents({"metadata.status": "submitted"})



    in_review = await projects_collection.count_documents({"metadata.status": "in_review"})



    approved = await projects_collection.count_documents({"metadata.status": "approved"})



    rejected = await projects_collection.count_documents({"metadata.status": "rejected"})



    published = await projects_collection.count_documents({"metadata.status": "published"})



    



    return {



        "total_projects": total_projects,



        "by_status": {



            "submitted": submitted,



            "in_review": in_review,



            "approved": approved,



            "rejected": rejected,



            "published": published



        }



    }











@router.post("/upload")



async def upload_project(



    title: str = Form(...),



    description: str = Form(""),



    methodology: str = Form(""),



    keywords: str = Form(""),



    student_id: str = Form(...),



    file: UploadFile = File(...)



):



    """



    Subir un nuevo proyecto con archivo PDF



    



    Args:



        title: Título del proyecto



        description: Descripción del proyecto



        methodology: Metodología utilizada



        keywords: Palabras clave separadas por comas



        student_id: ID del estudiante que sube el proyecto



        file: Archivo PDF del proyecto



    """



    # Validar que sea un PDF



    if not file.filename.endswith('.pdf'):



        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")



    



    # Validar tamaño (20MB máximo)



    content = await file.read()



    if len(content) > 20 * 1024 * 1024:



        raise HTTPException(status_code=400, detail="El archivo no debe superar 20MB")



    



    # Obtener información del estudiante



    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)



    try:



        student = await users_collection.find_one({"_id": ObjectId(student_id)})



    except:



        raise HTTPException(status_code=400, detail="ID de estudiante inválido")



    



    if not student:



        raise HTTPException(status_code=404, detail="Estudiante no encontrado")



    



    if student.get("role") != "student":



        raise HTTPException(status_code=403, detail="Solo los estudiantes pueden subir proyectos")



    



    # Guardar archivo



    file_info = FileStorage.save_project_file(content, file.filename, student_id)



    



    # Crear documento de proyecto



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    # Procesar keywords



    keywords_list = [k.strip() for k in keywords.split(',') if k.strip()] if keywords else []



    



    project_data = {



        "title": title,



        "description": description,



        "authors": [



            {



                "user_id": student_id,



                "name": student.get("name"),



                "role": "author"



            }



        ],



        "academic_info": {



            "career_code": student.get("university_data", {}).get("career_code", ""),



            "career_name": student.get("university_data", {}).get("career", ""),



            "methodology": methodology,



            "year": datetime.utcnow().year,



            "trayect": student.get("university_data", {}).get("current_trayect", 0),



            "semester": student.get("university_data", {}).get("current_semester", 0),



            "keywords": keywords_list,



            "subject": student.get("assigned_teacher", {}).get("subject_name", ""),



            "subject_code": student.get("assigned_teacher", {}).get("subject_code", "")



        },



        "versions": [



            {



                "version_number": 1,



                "version_name": "Versión Inicial",



                "status": "submitted",



                "created_at": datetime.utcnow(),



                "files": [



                    {



                        "file_id": file_info["stored_filename"],



                        "filename": file_info["filename"],



                        "file_path": file_info["relative_path"],



                        "file_url": file_info.get("file_url", f"/uploads/{file_info['relative_path']}"),



                        "file_size": file_info["file_size"],



                        "file_type": "application/pdf",



                        "uploaded_at": file_info["uploaded_at"],



                        "uploaded_by": student_id,



                        "cloudinary": file_info.get("cloudinary", False)



                    }



                ],



                "evaluations": [],



                "feedback": [],



                "student_notes": description



            }



        ],



        "metadata": {



            "current_version": 1,



            "total_versions": 1,



            "status": "submitted",



            "visibility": "private",



            "download_count": 0,



            "view_count": 0



        },



        "evaluation": {



            "assigned_to": student.get("assigned_teacher", {}).get("teacher_id"),



            "assigned_at": datetime.utcnow(),



            "status": "pending",



            "priority": "normal"



        },



        "created_by": ObjectId(student_id),



        "created_at": datetime.utcnow(),



        "updated_at": datetime.utcnow()



    }



    



    # Insertar proyecto



    result = await projects_collection.insert_one(project_data)



    



    # Actualizar estadísticas del estudiante



    await users_collection.update_one(



        {"_id": ObjectId(student_id)},



        {



            "$inc": {"stats.projects_submitted": 1},



            "$set": {"stats.last_activity": datetime.utcnow()}



        }



    )



    



    return {



        "success": True,



        "message": "Proyecto subido exitosamente",



        "project_id": str(result.inserted_id),



        "file_info": {



            "filename": file_info["filename"],



            "size": file_info["file_size"]



        }



    }











@router.get("/download/{file_id}")



async def download_file(file_id: str):



    """



    Descargar/servir archivo PDF de un proyecto



    



    Args:



        file_id: ID del archivo (nombre del archivo almacenado)



    """



    # Buscar el archivo en la base de datos para obtener la ruta



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    # Buscar proyecto que contenga este archivo



    project = await projects_collection.find_one({



        "versions.files.file_id": file_id



    })



    



    if not project:



        raise HTTPException(status_code=404, detail="Archivo no encontrado")



    



    # Encontrar el archivo específico



    file_info = None



    for version in project.get("versions", []):



        for file in version.get("files", []):



            if file.get("file_id") == file_id:



                file_info = file



                break



        if file_info:



            break



    



    if not file_info:



        raise HTTPException(status_code=404, detail="Información del archivo no encontrada")



    



    # Verificar si el archivo está en Cloudinary



    if file_info.get("cloudinary") or file_info.get("pdf_cloudinary"):



        # Priorizar PDF URL si existe (para archivos convertidos)



        pdf_url = file_info.get("pdf_url") or file_info.get("file_url")



        if pdf_url and pdf_url.startswith("http"):



            # Redirigir a la URL de Cloudinary



            from fastapi.responses import RedirectResponse



            return RedirectResponse(url=pdf_url)



    



    # Si no es de Cloudinary, procesar archivo local



    # Obtener ruta del archivo



    file_path = FileStorage.get_file_path(file_info.get("file_path"))



    



    if not file_path or not os.path.exists(file_path):



        raise HTTPException(status_code=404, detail="Archivo físico no encontrado")



    



    # Servir el archivo inline (para visualización en navegador)



    # Usar filename* para manejar caracteres especiales (RFC 5987)



    from urllib.parse import quote



    filename = file_info.get("filename", "document.pdf")



    encoded_filename = quote(filename.encode('utf-8'))
    
    try:
        return FileResponse(
            path=str(file_path),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


    





