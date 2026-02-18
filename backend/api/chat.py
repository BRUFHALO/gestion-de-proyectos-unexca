from fastapi import APIRouter, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Dict
from datetime import datetime
from config.database import Database
from models.chat import ChatMessage, Conversation, SendMessageRequest
import uuid
import json

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

# Gestor de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        # Diccionario de conexiones activas: {user_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ Usuario {user_id} conectado al WebSocket")
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ Usuario {user_id} desconectado del WebSocket")
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Error enviando mensaje a {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict):
        disconnected = []
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error en broadcast a {user_id}: {e}")
                disconnected.append(user_id)
        
        for user_id in disconnected:
            self.disconnect(user_id)

manager = ConnectionManager()

# Obtener colecciones de MongoDB
def get_conversations_collection():
    db = Database.get_database()
    return db["conversations"]

def get_messages_collection():
    db = Database.get_database()
    return db["chat_messages"]

@router.get("/chat-id/{user_id}")
async def get_chat_id(user_id: str):
    """Obtener el chatId de un usuario"""
    try:
        conversations_collection = get_conversations_collection()
        
        # Buscar chatId del usuario (como student o teacher)
        conversation = await conversations_collection.find_one({
            "$or": [
                {"student_id": user_id},
                {"teacher_id": user_id}
            ]
        })
        
        if conversation:
            chat_id = conversation.get("chat_id_student") if conversation.get("student_id") == user_id else conversation.get("chat_id_teacher")
            return {
                "success": True,
                "chat_id": chat_id,
                "conversation_id": conversation.get("conversation_id")
            }
        else:
            # Crear nuevo chatId si no existe
            chat_id = f"chat_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            return {
                "success": True,
                "chat_id": chat_id,
                "conversation_id": None
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo chatId: {str(e)}"
        )

@router.post("/send-by-chat-id", status_code=status.HTTP_201_CREATED)
async def send_message_by_chat_id(request: dict):
    """Enviar mensaje directamente usando chatId del receptor"""
    try:
        target_chat_id = request.get("target_chat_id")
        sender_id = request.get("sender_id")
        sender_name = request.get("sender_name")
        sender_role = request.get("sender_role")
        message = request.get("message")
        
        if not all([target_chat_id, sender_id, sender_name, sender_role, message]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan campos requeridos"
            )
        conversations_collection = get_conversations_collection()
        messages_collection = get_messages_collection()
        
        # Buscar conversación por chatId
        conversation = await conversations_collection.find_one({
            "$or": [
                {"chat_id_student": target_chat_id},
                {"chat_id_teacher": target_chat_id}
            ]
        })
        
        if not conversation:
            # El chat_id fue generado dinámicamente (receptor sin conversación previa).
            # Extraer el user_id del formato: chat_{user_id}_{fecha}
            # Buscar al receptor por su user_id embebido en el chat_id
            parts = target_chat_id.split("_")
            # Formato: chat_{user_id}_{YYYYMMDD_HHMMSS} → parts[1] es el user_id
            if len(parts) >= 2:
                receiver_id = parts[1]
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversación no encontrada y no se pudo determinar el receptor"
                )
            
            # Obtener datos del receptor desde la BD
            from config.database import Database, DatabaseConfig
            from bson import ObjectId
            users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
            try:
                receiver_user = await users_collection.find_one({"_id": ObjectId(receiver_id)})
            except Exception:
                receiver_user = await users_collection.find_one({"_id": receiver_id})
            
            if not receiver_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Receptor no encontrado: {receiver_id}"
                )
            
            receiver_name = receiver_user.get("name") or f"{receiver_user.get('first_name', '')} {receiver_user.get('last_name', '')}".strip()
            
            # Crear nueva conversación
            conversation_id = str(uuid.uuid4())
            chat_id_sender = f"chat_{sender_id}_{datetime.now().strftime('%Y%m%d')}"
            
            # Asignar roles: teacher como teacher_id, coordinador como student_id (convención del sistema)
            if sender_role == "teacher":
                student_id_conv = receiver_id
                student_name_conv = receiver_name
                teacher_id_conv = sender_id
                teacher_name_conv = sender_name
                chat_id_student = target_chat_id  # chat_id del coordinador (receptor)
                chat_id_teacher = chat_id_sender   # chat_id del docente (emisor)
            else:
                student_id_conv = sender_id
                student_name_conv = sender_name
                teacher_id_conv = receiver_id
                teacher_name_conv = receiver_name
                chat_id_student = chat_id_sender
                chat_id_teacher = target_chat_id
            
            conversation_data = {
                "conversation_id": conversation_id,
                "student_id": student_id_conv,
                "student_name": student_name_conv,
                "teacher_id": teacher_id_conv,
                "teacher_name": teacher_name_conv,
                "receiver_id": receiver_id,
                "chat_id_student": chat_id_student,
                "chat_id_teacher": chat_id_teacher,
                "last_message": message,
                "last_message_time": datetime.now(),
                "unread_count_student": 1 if sender_role == "teacher" else 0,
                "unread_count_teacher": 1 if sender_role != "teacher" else 0,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await conversations_collection.insert_one(conversation_data)
            conversation = conversation_data
        else:
            receiver_id = None
            receiver_name = None
            # Determinar quién es el receptor
            if conversation["chat_id_student"] == target_chat_id:
                receiver_id = conversation["student_id"]
                receiver_name = conversation["student_name"]
            else:
                receiver_id = conversation["teacher_id"]
                receiver_name = conversation["teacher_name"]
            
            # Actualizar último mensaje
            await conversations_collection.update_one(
                {"conversation_id": conversation["conversation_id"]},
                {"$set": {
                    "last_message": message,
                    "last_message_time": datetime.now(),
                    "updated_at": datetime.now()
                }}
            )
        
        # Crear mensaje
        message_id = str(uuid.uuid4())
        message_data = {
            "message_id": message_id,
            "conversation_id": conversation["conversation_id"],
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "receiver_id": receiver_id,
            "receiver_name": receiver_name,
            "message": message,
            "timestamp": datetime.now(),
            "read": False,
            "delivered": True
        }
        
        await messages_collection.insert_one(message_data)
        
        # Notificar al receptor via WebSocket
        message_for_ws = {
            "message_id": message_id,
            "conversation_id": conversation["conversation_id"],
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "receiver_id": receiver_id,
            "receiver_name": receiver_name,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "read": False,
            "delivered": True
        }
        
        notification = {
            "type": "new_message",
            "conversation_id": conversation["conversation_id"],
            "message": message_for_ws
        }
        
        await manager.send_personal_message(notification, receiver_id)
        
        return {
            "success": True,
            "message": "Mensaje enviado exitosamente",
            "conversation_id": conversation["conversation_id"],
            "message_id": message_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error enviando mensaje por chatId: {str(e)}"
        )

@router.post("/send-message", status_code=status.HTTP_201_CREATED)
async def send_message(request: SendMessageRequest):
    """Enviar un mensaje en el chat"""
    try:
        # Determinar IDs de estudiante y profesor
        if request.sender_role == "student":
            student_id = request.sender_id
            student_name = request.sender_name
            teacher_id = request.receiver_id
            teacher_name = request.receiver_name
        elif request.sender_role == "coordinator":
            # Para coordinador, tratar como profesor
            student_id = request.receiver_id
            student_name = request.receiver_name
            teacher_id = request.sender_id
            teacher_name = request.sender_name
        else:
            # Para teacher y otros roles
            student_id = request.receiver_id
            student_name = request.receiver_name
            teacher_id = request.sender_id
            teacher_name = request.sender_name
        
        conversations_collection = get_conversations_collection()
        messages_collection = get_messages_collection()
        
        # Buscar o crear conversación
        if request.conversation_id:
            conversation = await conversations_collection.find_one({"conversation_id": request.conversation_id})
        else:
            # Buscar conversación existente entre estos usuarios
            # Usar la misma lógica que ChatPanel: buscar por student_id y teacher_id
            if request.sender_role == "coordinator":
                # Para coordinador, tratar al profesor como student y al coordinador como teacher
                conversation = await conversations_collection.find_one({
                    "student_id": str(request.receiver_id),  # Profesor como student
                    "teacher_id": str(request.sender_id)   # Coordinador como teacher
                })
                print(f"🔍 Coordinador buscando conversación: student_id={request.receiver_id}, teacher_id={request.sender_id}")
                print(f"📝 Conversación encontrada: {conversation}")
            else:
                conversation = await conversations_collection.find_one({
                    "student_id": student_id,
                    "teacher_id": teacher_id
                })
        
        if not conversation:
            # Crear nueva conversación
            conversation_id = str(uuid.uuid4())
            
            # Crear chatId único para cada usuario
            chat_id_student = f"chat_{student_id}_{datetime.now().strftime('%Y%m%d')}"
            chat_id_teacher = f"chat_{teacher_id}_{datetime.now().strftime('%Y%m%d')}"
            
            conversation_data = {
                "conversation_id": conversation_id,
                "student_id": student_id,
                "student_name": student_name,
                "teacher_id": teacher_id,
                "teacher_name": teacher_name,
                "receiver_id": request.receiver_id,  # Añadir receiver_id para coordinador
                "chat_id_student": chat_id_student,
                "chat_id_teacher": chat_id_teacher,
                "project_id": request.project_id,
                "project_title": request.project_title,
                "last_message": request.message,
                "last_message_time": datetime.now(),
                "unread_count_student": 1 if request.sender_role == "teacher" else 0,
                "unread_count_teacher": 1 if request.sender_role == "student" else 0,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await conversations_collection.insert_one(conversation_data)
        else:
            conversation_id = conversation["conversation_id"]
            # Actualizar conversación
            update_data = {
                "last_message": request.message,
                "last_message_time": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Incrementar contador de no leídos
            if request.sender_role == "student":
                update_data["unread_count_teacher"] = conversation.get("unread_count_teacher", 0) + 1
            else:
                update_data["unread_count_student"] = conversation.get("unread_count_student", 0) + 1
            
            await conversations_collection.update_one(
                {"conversation_id": conversation_id},
                {"$set": update_data}
            )
        
        # Crear mensaje
        message_id = str(uuid.uuid4())
        message_data = {
            "message_id": message_id,
            "conversation_id": conversation_id,
            "sender_id": request.sender_id,
            "sender_name": request.sender_name,
            "sender_role": request.sender_role,
            "receiver_id": request.receiver_id,
            "receiver_name": request.receiver_name,
            "message": request.message,
            "timestamp": datetime.now(),
            "read": False,
            "delivered": True  # El mensaje se considera entregado al guardarlo en BD
        }
        
        await messages_collection.insert_one(message_data)
        
        # Notificar al receptor a través de WebSocket
        # Convertir el mensaje a formato serializable
        message_for_ws = {
            "message_id": message_id,
            "conversation_id": conversation_id,
            "sender_id": request.sender_id,
            "sender_name": request.sender_name,
            "sender_role": request.sender_role,
            "receiver_id": request.receiver_id,
            "receiver_name": request.receiver_name,
            "message": request.message,
            "timestamp": datetime.now().isoformat(),
            "read": False,
            "delivered": True
        }
        
        notification = {
            "type": "new_message",
            "conversation_id": conversation_id,
            "message": message_for_ws
        }
        await manager.send_personal_message(notification, request.receiver_id)
        
        return {
            "success": True,
            "message": "Mensaje enviado exitosamente",
            "conversation_id": conversation_id,
            "message_id": message_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar mensaje: {str(e)}"
        )

@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str, role: str):
    """Obtener todas las conversaciones de un usuario"""
    try:
        conversations_collection = get_conversations_collection()
        
        # Buscar conversaciones según el rol
        if role == "student":
            query = {"student_id": user_id}
        elif role == "teacher":
            query = {"teacher_id": user_id}
        elif role == "coordinator":
            # Para coordinador, buscar conversaciones donde sea el receiver
            # Buscar en todos los campos que puedan contener el ID del coordinador
            query = {
                "$or": [
                    {"receiver_id": user_id},
                    {"student_id": user_id},
                    {"teacher_id": user_id}
                ]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido"
            )
        
        cursor = conversations_collection.find(query).sort("updated_at", -1)
        conversations = await cursor.to_list(length=None)
        
        # Convertir ObjectId a string y formatear fechas
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            if "created_at" in conv:
                conv["created_at"] = conv["created_at"].isoformat()
            if "updated_at" in conv:
                conv["updated_at"] = conv["updated_at"].isoformat()
            if "last_message_time" in conv and conv["last_message_time"]:
                conv["last_message_time"] = conv["last_message_time"].isoformat()
        
        return {"conversations": conversations}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener conversaciones: {str(e)}"
        )

@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, limit: int = 100):
    """Obtener mensajes de una conversación"""
    try:
        messages_collection = get_messages_collection()
        
        cursor = messages_collection.find({"conversation_id": conversation_id}).sort("timestamp", 1).limit(limit)
        messages = await cursor.to_list(length=limit)
        
        # Convertir ObjectId a string y formatear fechas
        for msg in messages:
            msg["_id"] = str(msg["_id"])
            if "timestamp" in msg:
                msg["timestamp"] = msg["timestamp"].isoformat()
        
        return {"messages": messages}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener mensajes: {str(e)}"
        )

@router.put("/mark-as-read/{conversation_id}")
async def mark_as_read(conversation_id: str, user_role: str):
    """Marcar mensajes como leídos"""
    try:
        conversations_collection = get_conversations_collection()
        messages_collection = get_messages_collection()
        
        # Actualizar contador de no leídos
        if user_role == "student":
            await conversations_collection.update_one(
                {"conversation_id": conversation_id},
                {"$set": {"unread_count_student": 0}}
            )
        elif user_role == "teacher":
            await conversations_collection.update_one(
                {"conversation_id": conversation_id},
                {"$set": {"unread_count_teacher": 0}}
            )
        
        # Marcar mensajes como leídos
        await messages_collection.update_many(
            {
                "conversation_id": conversation_id,
                "sender_role": "teacher" if user_role == "student" else "student",
                "read": False
            },
            {"$set": {"read": True}}
        )
        
        return {"success": True, "message": "Mensajes marcados como leídos"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al marcar mensajes como leídos: {str(e)}"
        )

@router.get("/unread-count/{user_id}")
async def get_unread_count(user_id: str, role: str):
    """Obtener el total de mensajes no leídos"""
    try:
        conversations_collection = get_conversations_collection()
        
        if role == "student":
            query = {"student_id": user_id}
            field = "unread_count_student"
        elif role == "teacher":
            query = {"teacher_id": user_id}
            field = "unread_count_teacher"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido"
            )
        
        cursor = conversations_collection.find(query)
        conversations = await cursor.to_list(length=None)
        total_unread = sum(conv.get(field, 0) for conv in conversations)
        
        return {"unread_count": total_unread}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener contador de no leídos: {str(e)}"
        )

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Endpoint WebSocket para comunicación en tiempo real"""
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Recibir mensajes del cliente (para mantener la conexión activa)
            data = await websocket.receive_text()
            
            # El cliente puede enviar un ping para mantener la conexión
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                # Procesar otros tipos de mensajes si es necesario
                try:
                    message_data = json.loads(data)
                    # Aquí puedes manejar otros tipos de mensajes si lo necesitas
                    print(f"Mensaje recibido de {user_id}: {message_data}")
                except json.JSONDecodeError:
                    pass
                    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        print(f"WebSocket desconectado: {user_id}")
    except Exception as e:
        print(f"Error en WebSocket para {user_id}: {e}")
        manager.disconnect(user_id)
