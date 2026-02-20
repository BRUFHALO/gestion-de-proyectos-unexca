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





async def check_student_group_responsible_permission(student_id: str, teacher_id: str = None) -> bool:
    """
    Verificar si un estudiante tiene permisos para crear proyectos.
    Un estudiante puede crear proyectos si:
    1. Es responsable de grupo de algún profesor, o
    2. No hay responsables asignados aún (sistema abierto)
    """
    try:
        group_responsibles_collection = Database.get_collection("group_responsibles")
        
        # Si se proporciona teacher_id, verificar específicamente para ese profesor
        if teacher_id:
            responsible = await group_responsibles_collection.find_one({
                "student_id": ObjectId(student_id),
                "teacher_id": ObjectId(teacher_id)
            })
            return responsible is not None
        
        # Si no se proporciona teacher_id, verificar si es responsable de algún profesor
        responsible = await group_responsibles_collection.find_one({
            "student_id": ObjectId(student_id)
        })
        
        # Si es responsable de algún profesor, tiene permisos
        if responsible:
            return True
        
        # Si no hay responsables en el sistema, permitir temporalmente
        total_responsibles = await group_responsibles_collection.count_documents({})
        if total_responsibles == 0:
            return True
        
        # Si hay responsables pero este estudiante no es uno de ellos, denegar
        return False
        
    except Exception as e:
        print(f"Error verificando permisos de estudiante: {e}")
        # En caso de error, permitir por seguridad (para no bloquear todo el sistema)
        return True



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











@router.get("/evaluation-stats", response_model=dict)
async def get_evaluation_stats():
    """Obtener estadísticas de evaluaciones"""
    try:
        projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
        
        # Contar proyectos por estado
        completed = await projects_collection.count_documents({
            "metadata.status": {"$in": ["approved", "published"]}
        })
        
        in_process = await projects_collection.count_documents({
            "metadata.status": {"$in": ["submitted", "in_review", "en_revision"]}
        })
        
        # Para proyectos atrasados, consideramos aquellos con fecha límite pasada
        # y que aún no estén completados ni en revisión
        current_date = datetime.utcnow()
        overdue = await projects_collection.count_documents({
            "metadata.status": {"$nin": ["approved", "published", "rejected", "en_revision"]},
            "metadata.submission_date": {"$lt": current_date}
        })
        
        # Estadísticas adicionales
        total_projects = await projects_collection.count_documents({})
        rejected = await projects_collection.count_documents({
            "metadata.status": "rejected"
        })
        
        # Calcular promedio de calificaciones
        pipeline = [
            {"$match": {"evaluation.grade": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": None,
                "avg_grade": {"$avg": "$evaluation.grade"},
                "count": {"$sum": 1}
            }}
        ]
        
        grade_result = await projects_collection.aggregate(pipeline).to_list(1)
        avg_grade = grade_result[0]["avg_grade"] if grade_result else 0
        
        # Estadísticas por carrera
        pipeline_careers = [
            {"$match": {"metadata.career": {"$exists": True}}},
            {"$group": {
                "_id": "$metadata.career",
                "count": {"$sum": 1},
                "completed": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$metadata.status", ["approved", "published"]]},
                            1,
                            0
                        ]
                    }
                }
            }},
            {"$sort": {"count": -1}}
        ]
        
        career_stats = await projects_collection.aggregate(pipeline_careers).to_list(10)
        
        stats = {
            "completed": completed,
            "in_process": in_process,
            "overdue": overdue,
            "total_projects": total_projects,
            "rejected": rejected,
            "avg_grade": round(avg_grade, 2),
            "completion_rate": round((completed / total_projects * 100) if total_projects > 0 else 0, 1),
            "career_stats": career_stats,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return stats
        
    except Exception as e:
        print(f"Error en get_evaluation_stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


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
        # Intentar buscar como ObjectId y como string para compatibilidad
        try:
            assigned_to_objectid = ObjectId(assigned_to)
            
            # Aplicar filtros adicionales si existen
            if status or career_code or year or created_by:
                filter_query["evaluation.assigned_to"] = {"$in": [assigned_to_objectid, assigned_to]}
            else:
                # Sin filtros adicionales, buscar ambos tipos y combinar
                cursor_oid = projects_collection.find({"evaluation.assigned_to": assigned_to_objectid})
                projects_oid = await cursor_oid.to_list(length=None)
                
                cursor_str = projects_collection.find({"evaluation.assigned_to": assigned_to})
                projects_str = await cursor_str.to_list(length=None)
                
                # Combinar y ordenar resultados
                all_found = projects_oid + projects_str
                all_found.sort(key=lambda x: x.get("created_at", datetime.utcnow()), reverse=True)
                
                # Aplicar paginación
                projects = all_found[skip:skip+limit] if skip < len(all_found) else []
                
                # Saltar la consulta general ya que tenemos los resultados
                skip = 0  # Para evitar doble paginación
                limit = len(projects)  # Para no truncar más
            
        except:
            # Si falla la conversión a ObjectId, buscar solo como string
            if status or career_code or year or created_by:
                filter_query["evaluation.assigned_to"] = assigned_to
            else:
                cursor = projects_collection.find({"evaluation.assigned_to": assigned_to}).skip(skip).limit(limit).sort("created_at", -1)
                projects = await cursor.to_list(length=limit)
                skip = 0
                limit = len(projects)

    # Consultar proyectos solo si no se hizo una consulta específica de assigned_to
    if not assigned_to or (status or career_code or year or created_by):
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











def convert_objectids(obj):
    """Convertir recursivamente todos los ObjectIds a strings"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectids(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids(item) for item in obj]
    else:
        return obj


@router.get("/teacher/{teacher_id}/assigned")



async def get_teacher_assigned_projects(



    teacher_id: str,



    status: Optional[str] = Query(None, description="Filtrar por estado")



):



    """Obtener proyectos asignados a un profesor"""



    from bson import ObjectId



    



    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)



    



    filter_query = {"evaluation.assigned_to": teacher_id}

    if status:
        filter_query["metadata.status"] = status

    

    cursor = projects_collection.find(filter_query).sort("created_at", -1)

    projects = await cursor.to_list(length=None)

    # Convertir ObjectIds a strings
    converted_projects = [convert_objectids(project) for project in projects]

    return converted_projects








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
    
    # Verificar si el estudiante tiene permisos para crear proyectos (sistema de responsables de grupo)
    has_permission = await check_student_group_responsible_permission(student_id)
    
    if not has_permission:
        # Obtener información del profesor asignado para mostrar mensaje más específico
        assigned_teacher = student.get("assigned_teacher", {})
        teacher_name = assigned_teacher.get("teacher_name", "el profesor")
        
        raise HTTPException(
            status_code=403, 
            detail=f"No tienes permisos para crear proyectos. Solo los estudiantes asignados como responsables de grupo pueden crear proyectos. Contacta a {teacher_name} para ser asignado como responsable."
        )
    
    print(f"✅ Estudiante {student.get('first_name')} {student.get('last_name')} tiene permisos para crear proyecto")



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











@router.get("/student/{student_id}/can-create-project")
async def check_student_can_create_project(student_id: str):
    """
    Verificar si un estudiante tiene permisos para crear proyectos
    """
    try:
        # Validar ID
        ObjectId(student_id)
    except:
        raise HTTPException(status_code=400, detail="ID de estudiante inválido")
    
    # Verificar permisos
    has_permission = await check_student_group_responsible_permission(student_id)
    
    # Obtener información del estudiante para mensaje personalizado
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    student = await users_collection.find_one({"_id": ObjectId(student_id)})
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    if student.get("role") != "student":
        raise HTTPException(status_code=403, detail="El usuario no es un estudiante")
    
    return {
        "can_create_project": has_permission,
        "student_name": student.get("name", ""),
        "message": (
            "Tienes permisos para crear proyectos." if has_permission 
            else "No tienes permisos para crear proyectos. Solo los responsables de grupo pueden crear proyectos."
        )
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


    





