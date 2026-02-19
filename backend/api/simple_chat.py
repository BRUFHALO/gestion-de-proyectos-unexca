from fastapi import APIRouter, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Dict, Optional
from datetime import datetime
from config.database import Database
import uuid
import json
import os
from pathlib import Path

router = APIRouter(prefix="/api/v1/simple-chat", tags=["Simple Chat"])

# Gestor de conexiones WebSocket simplificado
class SimpleChatManager:
    def __init__(self):
        # Diccionario de conexiones activas: {user_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # Diccionario de salas de chat: {room_id: [user_ids]}
        self.chat_rooms: Dict[str, List[str]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ Usuario {user_id} conectado al SimpleChat")
        
        # Notificar a otros usuarios en la misma sala
        await self.broadcast_to_user_rooms(user_id, {
            "type": "user_online",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ Usuario {user_id} desconectado del SimpleChat")
            
            # Notificar a otros usuarios
            self.broadcast_to_user_rooms_sync(user_id, {
                "type": "user_offline",
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            })
    
    async def send_to_user(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
                print(f"✅ Mensaje enviado a {user_id}")
                return True
            except Exception as e:
                print(f"❌ Error enviando mensaje a {user_id}: {e}")
                self.disconnect(user_id)
                return False
        else:
            print(f"⚠️ Usuario {user_id} no está conectado")
            return False
    
    def get_or_create_room(self, user1_id: str, user2_id: str) -> str:
        """Crear o obtener una sala de chat entre dos usuarios"""
        # Siempre usar el mismo orden para el room_id
        participants = sorted([user1_id, user2_id])
        room_id = f"room_{'_'.join(participants)}"
        
        if room_id not in self.chat_rooms:
            self.chat_rooms[room_id] = participants
            
        return room_id
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: Optional[str] = None):
        """Enviar mensaje a todos en la sala excepto al remitente"""
        if room_id in self.chat_rooms:
            for user_id in self.chat_rooms[room_id]:
                if user_id != exclude_user:
                    await self.send_to_user(message, user_id)
    
    async def broadcast_to_user_rooms(self, user_id: str, message: dict):
        """Enviar mensaje a todas las salas donde está el usuario"""
        for room_id, participants in self.chat_rooms.items():
            if user_id in participants:
                await self.broadcast_to_room(room_id, message, exclude_user=user_id)
    
    def broadcast_to_user_rooms_sync(self, user_id: str, message: dict):
        """Versión síncrona para notificaciones de desconexión"""
        for room_id, participants in self.chat_rooms.items():
            if user_id in participants:
                for participant_id in participants:
                    if participant_id != user_id and participant_id in self.active_connections:
                        try:
                            # Esto es síncrono, pero es solo para notificaciones de desconexión
                            import asyncio
                            asyncio.create_task(self.send_to_user(message, participant_id))
                        except:
                            pass

simple_chat_manager = SimpleChatManager()

# Obtener colecciones
def get_simple_chat_collection():
    db = Database.get_database()
    return db["simple_chat_messages"]

@router.post("/send-message")
async def send_simple_message(message_data: dict):
    """Enviar un mensaje simple entre dos usuarios"""
    try:
        print(f"📨 Mensaje recibido: {message_data}")
        
        sender_id = message_data.get("sender_id")
        receiver_id = message_data.get("receiver_id")
        message = message_data.get("message")
        sender_name = message_data.get("sender_name", "Usuario")
        sender_role = message_data.get("sender_role", "unknown")
        file_url = message_data.get("file_url")
        file_name = message_data.get("file_name")
        file_type = message_data.get("file_type")
        file_size = message_data.get("file_size")
        
        print(f"📎 Info de archivo: url={file_url}, name={file_name}, type={file_type}, size={file_size}")
        
        if not all([sender_id, receiver_id, message]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan campos requeridos: sender_id, receiver_id, message"
            )
        
        # Crear room_id
        room_id = simple_chat_manager.get_or_create_room(sender_id, receiver_id)
        
        # Guardar mensaje en la base de datos
        messages_collection = get_simple_chat_collection()
        message_doc = {
            "message_id": str(uuid.uuid4()),
            "room_id": room_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "receiver_id": receiver_id,
            "message": message,
            "timestamp": datetime.now(),
            "read": False
        }
        
        # Agregar información de archivo si existe
        print(f"🔍 Verificando file_url: '{file_url}' (tipo: {type(file_url)})")
        print(f"🔍 file_url truthy: {bool(file_url)}")
        
        if file_url:
            print(f"💾 Agregando información de archivo al mensaje...")
            message_doc.update({
                "file_url": file_url,
                "file_name": file_name,
                "file_type": file_type,
                "file_size": file_size
            })
            print(f"✅ Archivo agregado: {message_doc}")
        else:
            print("⚠️ No hay file_url en el mensaje - archivo no se guardará")
        
        print(f"📄 Documento final antes de guardar: {message_doc}")
        
        await messages_collection.insert_one(message_doc)
        print(f"💾 Mensaje guardado en BD: {message_doc['message_id']}")
        
        # Preparar mensaje para WebSocket
        ws_message_data = {
            "message_id": message_doc["message_id"],
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_role": sender_role,
            "receiver_id": receiver_id,
            "message": message,
            "timestamp": message_doc["timestamp"].isoformat(),
            "read": False
        }
        
        # Agregar información de archivo si existe
        if file_url:
            ws_message_data.update({
                "file_url": file_url,
                "file_name": file_name,
                "file_type": file_type,
                "file_size": file_size
            })
        
        ws_message = {
            "type": "new_message",
            "room_id": room_id,
            "message": ws_message_data
        }
        
        # Enviar mensaje al receptor si está conectado
        await simple_chat_manager.send_to_user(ws_message, receiver_id)
        
        return {
            "success": True,
            "message": "Mensaje enviado exitosamente",
            "room_id": room_id,
            "message_id": message_doc["message_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error enviando mensaje: {str(e)}"
        )

@router.get("/messages/{user1_id}/{user2_id}")
async def get_chat_messages(user1_id: str, user2_id: str):
    """Obtener mensajes entre dos usuarios"""
    try:
        room_id = simple_chat_manager.get_or_create_room(user1_id, user2_id)
        
        messages_collection = get_simple_chat_collection()
        
        # Buscar mensajes en la sala
        cursor = messages_collection.find({"room_id": room_id}).sort("timestamp", 1)
        messages = await cursor.to_list(length=None)
        
        # Convertir ObjectId a string y formatear timestamps
        formatted_messages = []
        for msg in messages:
            message_data = {
                "message_id": msg["message_id"],
                "sender_id": msg["sender_id"],
                "sender_name": msg["sender_name"],
                "sender_role": msg["sender_role"],
                "receiver_id": msg["receiver_id"],
                "message": msg["message"],
                "timestamp": msg["timestamp"].isoformat(),
                "read": msg["read"]
            }
            
            # Agregar información de archivo si existe
            if "file_url" in msg and msg["file_url"]:
                message_data.update({
                    "file_url": msg["file_url"],
                    "file_name": msg.get("file_name"),
                    "file_type": msg.get("file_type"),
                    "file_size": msg.get("file_size")
                })
            
            formatted_messages.append(message_data)
        
        return {
            "success": True,
            "room_id": room_id,
            "messages": formatted_messages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo mensajes: {str(e)}"
        )

@router.put("/mark-read/{room_id}")
async def mark_messages_read(room_id: str, user_id: str):
    """Marcar mensajes como leídos para un usuario"""
    try:
        messages_collection = get_simple_chat_collection()
        
        # Marcar como leídos todos los mensajes en la sala que no son del usuario
        result = await messages_collection.update_many(
            {
                "room_id": room_id,
                "sender_id": {"$ne": user_id},  # Mensajes de otros usuarios
                "read": False
            },
            {"$set": {"read": True}}
        )
        
        return {
            "success": True,
            "message": f"Mensajes marcados como leídos: {result.modified_count}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marcando mensajes como leídos: {str(e)}"
        )

@router.get("/online-users")
async def get_online_users():
    """Obtener lista de usuarios conectados"""
    try:
        return {
            "success": True,
            "online_users": list(simple_chat_manager.active_connections.keys()),
            "total_online": len(simple_chat_manager.active_connections)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo usuarios conectados: {str(e)}"
        )

@router.websocket("/ws/{user_id}")
async def simple_chat_websocket(websocket: WebSocket, user_id: str):
    """WebSocket endpoint para el chat simple"""
    await simple_chat_manager.connect(user_id, websocket)
    
    try:
        while True:
            # Recibir mensajes del cliente
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                try:
                    message_data = json.loads(data)
                    # Procesar otros tipos de mensajes si es necesario
                    print(f"📨 Mensaje recibido de {user_id}: {message_data}")
                except json.JSONDecodeError:
                    pass
                    
    except WebSocketDisconnect:
        simple_chat_manager.disconnect(user_id)
        print(f"🔌 WebSocket desconectado: {user_id}")
    except Exception as e:
        print(f"❌ Error en WebSocket para {user_id}: {e}")
        simple_chat_manager.disconnect(user_id)

# Endpoint para subir archivos
@router.post("/upload")
async def upload_file(file: UploadFile = File(...), chat_room: str = ""):
    """Subir un archivo para el chat"""
    try:
        # Validar tamaño del archivo (máximo 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="El archivo es demasiado grande. Máximo 10MB."
            )
        
        # Validar tipo de archivo
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de archivo no permitido."
            )
        
        # Crear directorio de uploads si no existe
        uploads_dir = Path("uploads/chat")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        # Generar nombre de archivo único
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = uploads_dir / unique_filename
        
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Generar URL pública
        file_url = f"http://localhost:8000/uploads/chat/{unique_filename}"
        
        return {
            "success": True,
            "file_url": file_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "size": len(content),
            "content_type": file.content_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error subiendo archivo: {str(e)}"
        )

@router.get("/coordinator-documents/{coordinator_id}")
async def get_coordinator_documents(coordinator_id: str):
    """Obtener todos los documentos enviados a un coordinador por todos los profesores"""
    try:
        messages_collection = get_simple_chat_collection()
        
        # Buscar todos los mensajes donde el coordinador es el receptor y tiene archivo
        cursor = messages_collection.find({
            "receiver_id": coordinator_id,
            "file_url": {"$exists": True, "$ne": None}
        }).sort("timestamp", -1)
        
        documents = await cursor.to_list(length=None)
        
        # Formatear documentos
        formatted_documents = []
        for doc in documents:
            formatted_documents.append({
                "message_id": doc["message_id"],
                "sender_id": doc["sender_id"],
                "sender_name": doc["sender_name"],
                "sender_role": doc["sender_role"],
                "file_url": doc["file_url"],
                "file_name": doc.get("file_name"),
                "file_type": doc.get("file_type"),
                "file_size": doc.get("file_size"),
                "timestamp": doc["timestamp"].isoformat(),
                "message": doc["message"]
            })
        
        return {
            "success": True,
            "coordinator_id": coordinator_id,
            "documents": formatted_documents,
            "total_documents": len(formatted_documents)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo documentos del coordinador: {str(e)}"
        )

# Endpoint para descargar archivos
@router.get("/download/{filename}")
async def download_file(filename: str):
    """Descargar un archivo del chat"""
    try:
        file_path = Path("uploads/chat") / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo no encontrado"
            )
        
        # Determinar el media type basado en la extensión
        media_type = "application/octet-stream"  # Default
        if filename.lower().endswith('.pdf'):
            media_type = "application/pdf"
        elif filename.lower().endswith(('.jpg', '.jpeg')):
            media_type = "image/jpeg"
        elif filename.lower().endswith('.png'):
            media_type = "image/png"
        elif filename.lower().endswith('.gif'):
            media_type = "image/gif"
        elif filename.lower().endswith(('.doc', '.docx')):
            media_type = "application/msword"
        elif filename.lower().endswith('.txt'):
            media_type = "text/plain"
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error descargando archivo: {str(e)}"
        )
