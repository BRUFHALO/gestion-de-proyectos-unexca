"""
Configuración de conexión a MongoDB Atlas
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

class DatabaseConfig:
    """Configuración de la base de datos MongoDB"""
    
    # Conexión a MongoDB Atlas
    MONGODB_URL = "mongodb+srv://ronaldo:1234@cluster0.sohux1b.mongodb.net/unexca_projects?appName=Cluster0"
    DATABASE_NAME = "unexca_projects"
    
    # Nombres de colecciones
    USERS_COLLECTION = "users"
    PROJECTS_COLLECTION = "projects"
    EVALUATIONS_COLLECTION = "evaluations"
    CAREERS_COLLECTION = "careers"
    SUBJECTS_COLLECTION = "subjects"
    REPORTS_COLLECTION = "reports"
    SYNC_LOGS_COLLECTION = "sync_logs"
    NOTIFICATIONS_COLLECTION = "notifications"
    ARCHIVED_FILES_COLLECTION = "archived_files"
    
    # Configuración de storage
    MAX_FILE_SIZE_MB = 10
    ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx']
    MAX_VERSIONS_PER_PROJECT = 5
    
    # Políticas de limpieza
    CLEANUP_POLICY = "moderate"
    ARCHIVE_RETENTION_DAYS = 365
    
    # Configuración de sincronización
    SYNC_INTERVAL_HOURS = 24
    UNIVERSITY_API_URL = "https://api.unexca.edu.ve"
    UNIVERSITY_API_KEY = os.getenv("UNIVERSITY_API_KEY", "")


class Database:
    """Clase para manejar la conexión a MongoDB"""
    
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        """Conectar a MongoDB Atlas"""
        try:
            cls.client = AsyncIOMotorClient(DatabaseConfig.MONGODB_URL)
            await cls.client.admin.command('ping')
            print(f"✅ Conectado exitosamente a MongoDB Atlas")
            print(f"📊 Base de datos: {DatabaseConfig.DATABASE_NAME}")
        except Exception as e:
            print(f"❌ Error al conectar a MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Cerrar conexión a MongoDB"""
        if cls.client:
            cls.client.close()
            print("🔌 Conexión a MongoDB cerrada")
    
    @classmethod
    def get_database(cls):
        """Obtener instancia de la base de datos"""
        if not cls.client:
            raise Exception("Base de datos no conectada. Llama a connect_db() primero.")
        return cls.client[DatabaseConfig.DATABASE_NAME]
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Obtener una colección específica"""
        db = cls.get_database()
        return db[collection_name]


async def init_database():
    """Inicializar la base de datos y crear índices"""
    await Database.connect_db()
    db = Database.get_database()
    
    print("🔧 Creando índices...")
    
    # Índices para users
    await db[DatabaseConfig.USERS_COLLECTION].create_index("email", unique=True)
    await db[DatabaseConfig.USERS_COLLECTION].create_index("university_data.user_id", unique=True, sparse=True)
    await db[DatabaseConfig.USERS_COLLECTION].create_index("role")
    await db[DatabaseConfig.USERS_COLLECTION].create_index([("name", "text"), ("email", "text")])
    
    # Índices para projects
    await db[DatabaseConfig.PROJECTS_COLLECTION].create_index("created_by")
    await db[DatabaseConfig.PROJECTS_COLLECTION].create_index("metadata.status")
    await db[DatabaseConfig.PROJECTS_COLLECTION].create_index("academic_info.career_code")
    await db[DatabaseConfig.PROJECTS_COLLECTION].create_index("academic_info.year")
    await db[DatabaseConfig.PROJECTS_COLLECTION].create_index("evaluation.assigned_to")
    await db[DatabaseConfig.PROJECTS_COLLECTION].create_index([("title", "text"), ("description", "text")])
    
    # Índices para evaluations
    await db[DatabaseConfig.EVALUATIONS_COLLECTION].create_index("project_id")
    await db[DatabaseConfig.EVALUATIONS_COLLECTION].create_index("evaluator_id")
    await db[DatabaseConfig.EVALUATIONS_COLLECTION].create_index("status")
    
    # Índices para careers
    await db[DatabaseConfig.CAREERS_COLLECTION].create_index("code", unique=True)
    await db[DatabaseConfig.CAREERS_COLLECTION].create_index("name")
    
    # Índices para subjects
    await db[DatabaseConfig.SUBJECTS_COLLECTION].create_index("code", unique=True)
    await db[DatabaseConfig.SUBJECTS_COLLECTION].create_index("career_code")
    await db[DatabaseConfig.SUBJECTS_COLLECTION].create_index("is_project_subject")
    
    # Índices para reports
    await db[DatabaseConfig.REPORTS_COLLECTION].create_index("generated_by")
    await db[DatabaseConfig.REPORTS_COLLECTION].create_index("type")
    await db[DatabaseConfig.REPORTS_COLLECTION].create_index("created_at")
    
    # Índices para sync_logs
    await db[DatabaseConfig.SYNC_LOGS_COLLECTION].create_index("sync_type")
    await db[DatabaseConfig.SYNC_LOGS_COLLECTION].create_index("started_at")
    
    # Índices para notifications
    await db[DatabaseConfig.NOTIFICATIONS_COLLECTION].create_index("user_id")
    await db[DatabaseConfig.NOTIFICATIONS_COLLECTION].create_index("read")
    await db[DatabaseConfig.NOTIFICATIONS_COLLECTION].create_index("created_at")
    
    print("✅ Índices creados exitosamente")
