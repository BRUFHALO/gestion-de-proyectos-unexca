from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from config.database import Database
from models.notification import Notification

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

class NotificationCreate(BaseModel):
    type: str  # 'comment', 'message', 'grade'
    recipient_id: str
    title: str
    message: str
    project_id: Optional[str] = None
    project_title: Optional[str] = None
    sender_id: str
    sender_name: str

@router.post("/", response_model=dict)
async def create_notification(
    notification: NotificationCreate,
    db=Depends(Database.get_database)
):
    """Crear una nueva notificación"""
    try:
        print(f"📥 Debug: Creating notification: {notification.title}")
        print(f"📥 Debug: Recipient: {notification.recipient_id}")
        print(f"📥 Debug: Type: {notification.type}")
        print(f"📥 Debug: Sender: {notification.sender_name}")
        
        notification_data = {
            "user_id": notification.recipient_id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "related_id": notification.project_id,
            "related_type": "project",
            "data": {
                "project_title": notification.project_title,
                "sender_id": notification.sender_id,
                "sender_name": notification.sender_name
            },
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        print(f"📥 Debug: Notification data prepared: {notification_data}")
        
        # Guardar en la base de datos
        result = db.notifications.insert_one(notification_data)
        print(f"📥 Debug: Insert result: {result.inserted_id}")
        
        if result.inserted_id:
            print(f"✅ Debug: Notification created successfully with ID: {result.inserted_id}")
            return {
                "success": True,
                "notification_id": str(result.inserted_id),
                "message": "Notificación creada exitosamente"
            }
        else:
            print(f"❌ Debug: Failed to insert notification")
            raise HTTPException(status_code=500, detail="Error al crear la notificación")
            
    except Exception as e:
        print(f"❌ Debug: Exception in create_notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{user_id}", response_model=dict)
async def get_user_notifications(
    user_id: str,
    db=Depends(Database.get_database)
):
    """Obtener todas las notificaciones de un usuario"""
    try:
        print(f"🔍 Debug: Getting notifications for user_id: {user_id}")
        
        if not user_id or user_id == "undefined":
            print("❌ Error: user_id is undefined or empty")
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Obtener notificaciones ordenadas por fecha descendente
        notifications_cursor = db.notifications.find(
            {"user_id": user_id}
        ).sort("created_at", -1)
        
        # Convertir cursor a lista
        notifications = await notifications_cursor.to_list(length=100)
        
        print(f"📊 Debug: Found {len(notifications)} notifications")
        
        # Convertir ObjectId a string y formatear
        formatted_notifications = []
        for notif in notifications:
            formatted_notif = {
                "id": str(notif["_id"]),
                "type": notif.get("type", ""),
                "recipient_id": notif.get("user_id", ""),
                "title": notif.get("title", ""),
                "message": notif.get("message", ""),
                "projectId": notif.get("related_id"),
                "projectTitle": notif.get("data", {}).get("project_title"),
                "senderId": notif.get("data", {}).get("sender_id"),
                "senderName": notif.get("data", {}).get("sender_name"),
                "createdAt": notif.get("created_at").isoformat() if isinstance(notif.get("created_at"), datetime) else notif.get("created_at"),
                "read": notif.get("read", False)
            }
            formatted_notifications.append(formatted_notif)
        
        return {
            "success": True,
            "notifications": formatted_notifications,
            "total": len(formatted_notifications)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_user_notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    db=Depends(Database.get_database)
):
    """Marcar una notificación como leída"""
    try:
        from bson import ObjectId
        result = db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "Notificación marcada como leída"
            }
        else:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{user_id}/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    user_id: str,
    db=Depends(Database.get_database)
):
    """Marcar todas las notificaciones de un usuario como leídas"""
    try:
        result = db.notifications.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": f"{result.modified_count} notificaciones marcadas como leídas"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    db=Depends(Database.get_database)
):
    """Eliminar una notificación"""
    try:
        from bson import ObjectId
        result = db.notifications.delete_one({"_id": ObjectId(notification_id)})
        
        if result.deleted_count > 0:
            return {
                "success": True,
                "message": "Notificación eliminada exitosamente"
            }
        else:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{user_id}/unread-count", response_model=dict)
async def get_unread_count(
    user_id: str,
    db=Depends(Database.get_database)
):
    """Obtener el conteo de notificaciones no leídas de un usuario"""
    try:
        unread_count = db.notifications.count_documents({
            "user_id": user_id,
            "read": False
        })
        
        return {
            "success": True,
            "unread_count": unread_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
