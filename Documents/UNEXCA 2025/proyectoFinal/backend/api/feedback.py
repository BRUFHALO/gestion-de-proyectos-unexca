"""
API Router para Feedback y Chat de Proyectos
Endpoints para gestión de retroalimentación y comunicación
"""
from fastapi import APIRouter, HTTPException, Body, WebSocket, WebSocketDisconnect
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
import json

from config.database import Database, DatabaseConfig
from utils.websocket import manager

router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    """Modelo para crear feedback"""
    project_id: str
    version_number: int = 1
    type: str  # 'correction', 'suggestion', 'approval'
    comment: str
    page: Optional[int] = None
    section: Optional[str] = None
    anchor: Optional[str] = None
    created_by: str


class ChatMessageCreate(BaseModel):
    """Modelo para crear mensaje de chat"""
    project_id: str
    message: str
    sender_id: str


@router.post("/add")
async def add_feedback(feedback: FeedbackCreate = Body(...)):
    """
    Agregar retroalimentación a un proyecto
    
    Tipos de feedback:
    - correction: Corrección (rojo)
    - suggestion: Sugerencia (amarillo)
    - approval: Aprobación (verde)
    """
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    # Verificar que el proyecto existe
    try:
        project = await projects_collection.find_one({"_id": ObjectId(feedback.project_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Obtener información del usuario que crea el feedback
    try:
        user = await users_collection.find_one({"_id": ObjectId(feedback.created_by)})
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Crear objeto de feedback
    feedback_obj = {
        "id": str(ObjectId()),
        "type": feedback.type,
        "comment": feedback.comment,
        "page": feedback.page,
        "section": feedback.section,
        "anchor": feedback.anchor,
        "created_by": feedback.created_by,
        "created_by_name": user.get("name"),
        "created_at": datetime.utcnow()
    }
    
    # Agregar feedback a la versión correspondiente
    version_index = feedback.version_number - 1
    
    result = await projects_collection.update_one(
        {"_id": ObjectId(feedback.project_id)},
        {
            "$push": {f"versions.{version_index}.feedback": feedback_obj},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No se pudo agregar el feedback")
    
    return {
        "success": True,
        "message": "Feedback agregado exitosamente",
        "feedback_id": feedback_obj["id"]
    }


@router.get("/project/{project_id}")
async def get_project_feedback(project_id: str, version: Optional[int] = None):
    """Obtener todos los feedbacks de un proyecto"""
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Si no se especifica versión, usar la actual
    if version is None:
        version = project.get("metadata", {}).get("current_version", 1)
    
    version_index = version - 1
    
    if version_index >= len(project.get("versions", [])):
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    
    feedbacks = project["versions"][version_index].get("feedback", [])
    
    return {
        "project_id": str(project["_id"]),
        "version": version,
        "feedbacks": feedbacks
    }


@router.post("/chat/send")
async def send_chat_message(message: ChatMessageCreate = Body(...)):
    """Enviar mensaje de chat relacionado con un proyecto"""
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    # Verificar proyecto
    try:
        project = await projects_collection.find_one({"_id": ObjectId(message.project_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Obtener información del remitente
    try:
        sender = await users_collection.find_one({"_id": ObjectId(message.sender_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    if not sender:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Crear mensaje
    chat_message = {
        "id": str(ObjectId()),
        "sender_id": message.sender_id,
        "sender_name": sender.get("name"),
        "sender_role": sender.get("role"),
        "message": message.message,
        "created_at": datetime.utcnow()
    }
    
    # Agregar mensaje al proyecto
    result = await projects_collection.update_one(
        {"_id": ObjectId(message.project_id)},
        {
            "$push": {"chat_messages": chat_message},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No se pudo enviar el mensaje")
    
    return {
        "success": True,
        "message": "Mensaje enviado",
        "chat_message": chat_message
    }


@router.get("/chat/{project_id}")
async def get_chat_messages(project_id: str):
    """Obtener mensajes de chat de un proyecto"""
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    messages = project.get("chat_messages", [])
    
    return {
        "project_id": str(project["_id"]),
        "messages": messages
    }


@router.get("/stats/{project_id}")
async def get_feedback_stats(project_id: str):
    """Obtener estadísticas de feedback de un proyecto"""
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    
    try:
        project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    current_version = project.get("metadata", {}).get("current_version", 1)
    version_index = current_version - 1
    
    if version_index >= len(project.get("versions", [])):
        return {
            "corrections": 0,
            "suggestions": 0,
            "approvals": 0,
            "total": 0
        }
    
    feedbacks = project["versions"][version_index].get("feedback", [])
    
    corrections = sum(1 for f in feedbacks if f.get("type") == "correction")
    suggestions = sum(1 for f in feedbacks if f.get("type") == "suggestion")
    approvals = sum(1 for f in feedbacks if f.get("type") == "approval")
    
    return {
        "corrections": corrections,
        "suggestions": suggestions,
        "approvals": approvals,
        "total": len(feedbacks)
    }


@router.websocket("/ws/chat/{project_id}")
async def websocket_chat(websocket: WebSocket, project_id: str):
    """
    WebSocket endpoint para chat en tiempo real
    
    Conecta a estudiantes y profesores para comunicación instantánea
    """
    await manager.connect(websocket, project_id)
    
    try:
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Guardar mensaje en la base de datos
            projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
            users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
            
            sender_id = message_data.get("sender_id")
            message_text = message_data.get("message")
            
            if not sender_id or not message_text:
                continue
            
            # Obtener información del remitente
            try:
                sender = await users_collection.find_one({"_id": ObjectId(sender_id)})
            except:
                continue
            
            if not sender:
                continue
            
            # Crear mensaje
            chat_message = {
                "id": str(ObjectId()),
                "sender_id": sender_id,
                "sender_name": sender.get("name"),
                "sender_role": sender.get("role"),
                "message": message_text,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Guardar en base de datos
            await projects_collection.update_one(
                {"_id": ObjectId(project_id)},
                {
                    "$push": {"chat_messages": chat_message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            # Broadcast a todos los clientes conectados al proyecto
            await manager.broadcast_to_project(
                {
                    "type": "chat_message",
                    "data": chat_message
                },
                project_id
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
    except Exception as e:
        print(f"Error en WebSocket: {e}")
        manager.disconnect(websocket, project_id)
