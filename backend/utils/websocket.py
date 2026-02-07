"""
Utilidades para WebSocket - Chat en tiempo real
"""
from typing import Dict, Set
from fastapi import WebSocket
import json


class ConnectionManager:
    """Gestor de conexiones WebSocket para chat en tiempo real"""
    
    def __init__(self):
        # Diccionario: project_id -> set de WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, project_id: str):
        """Conectar un cliente a un proyecto específico"""
        await websocket.accept()
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        
        self.active_connections[project_id].add(websocket)
        print(f"✅ Cliente conectado al proyecto {project_id}. Total: {len(self.active_connections[project_id])}")
    
    def disconnect(self, websocket: WebSocket, project_id: str):
        """Desconectar un cliente"""
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            
            # Limpiar si no hay más conexiones
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
            
            print(f"❌ Cliente desconectado del proyecto {project_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Enviar mensaje a un cliente específico"""
        await websocket.send_text(message)
    
    async def broadcast_to_project(self, message: dict, project_id: str, exclude: WebSocket = None):
        """
        Enviar mensaje a todos los clientes conectados a un proyecto
        
        Args:
            message: Diccionario con el mensaje a enviar
            project_id: ID del proyecto
            exclude: WebSocket a excluir del broadcast (opcional)
        """
        if project_id not in self.active_connections:
            return
        
        message_json = json.dumps(message)
        
        # Enviar a todos los clientes conectados al proyecto
        disconnected = set()
        for connection in self.active_connections[project_id]:
            if connection != exclude:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    print(f"Error al enviar mensaje: {e}")
                    disconnected.add(connection)
        
        # Limpiar conexiones muertas
        for connection in disconnected:
            self.disconnect(connection, project_id)
    
    def get_active_connections_count(self, project_id: str) -> int:
        """Obtener número de conexiones activas para un proyecto"""
        return len(self.active_connections.get(project_id, set()))


# Instancia global del gestor de conexiones
manager = ConnectionManager()
