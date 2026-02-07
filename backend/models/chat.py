from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ChatMessage(BaseModel):
    """Modelo para un mensaje de chat"""
    message_id: Optional[str] = None
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_role: str  # 'student' o 'teacher'
    receiver_id: str
    receiver_name: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
    read: bool = False
    
class Conversation(BaseModel):
    """Modelo para una conversación entre profesor y estudiante"""
    conversation_id: Optional[str] = None
    student_id: str
    student_name: str
    teacher_id: str
    teacher_name: str
    project_id: Optional[str] = None
    project_title: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count_student: int = 0
    unread_count_teacher: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class SendMessageRequest(BaseModel):
    """Request para enviar un mensaje"""
    conversation_id: Optional[str] = None
    sender_id: str
    sender_name: str
    sender_role: str
    receiver_id: str
    receiver_name: str
    message: str
    project_id: Optional[str] = None
    project_title: Optional[str] = None
