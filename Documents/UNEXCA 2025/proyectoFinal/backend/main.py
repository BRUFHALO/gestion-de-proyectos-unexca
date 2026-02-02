"""
Aplicación principal FastAPI
Sistema de Gestión de Proyectos UNEXCA
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from config.database import Database, DatabaseConfig
from api import users, projects, careers, subjects, auth, feedback, docx_processor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    # Startup
    print("🚀 Iniciando aplicación...")
    await Database.connect_db()
    print("✅ Aplicación iniciada correctamente")
    
    yield
    
    # Shutdown
    print("🔌 Cerrando aplicación...")
    await Database.close_db()
    print("✅ Aplicación cerrada correctamente")


# Crear aplicación FastAPI
app = FastAPI(
    title="Sistema de Gestión de Proyectos UNEXCA",
    description="API para la gestión de proyectos académicos con versionamiento y evaluación",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Incluir routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(careers.router)
app.include_router(subjects.router)
app.include_router(feedback.router)
app.include_router(docx_processor.router)


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Sistema de Gestión de Proyectos UNEXCA",
        "version": "1.0.0",
        "status": "running",
        "database": DatabaseConfig.DATABASE_NAME,
        "endpoints": {
            "docs": "/docs",
            "auth": "/api/v1/auth",
            "users": "/api/v1/users",
            "projects": "/api/v1/projects",
            "careers": "/api/v1/careers",
            "subjects": "/api/v1/subjects"
        }
    }


@app.get("/health")
async def health_check():
    """Verificar estado de la aplicación"""
    try:
        # Verificar conexión a la base de datos
        db = Database.get_database()
        await db.command("ping")
        
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Sistema funcionando correctamente"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
