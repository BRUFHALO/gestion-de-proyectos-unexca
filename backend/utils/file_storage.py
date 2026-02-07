"""
Utilidades para almacenamiento de archivos
"""
import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional


class FileStorage:
    """Gestión de almacenamiento de archivos"""
    
    # Directorio base para almacenar archivos
    BASE_DIR = Path(__file__).parent.parent / "uploads"
    PROJECTS_DIR = BASE_DIR / "projects"
    
    @classmethod
    def initialize(cls):
        """Crear directorios necesarios"""
        cls.BASE_DIR.mkdir(exist_ok=True)
        cls.PROJECTS_DIR.mkdir(exist_ok=True)
        print(f"📁 Directorios de almacenamiento creados en: {cls.BASE_DIR}")
    
    @classmethod
    def save_project_file(cls, file_content: bytes, filename: str, student_id: str) -> dict:
        """
        Guardar archivo de proyecto
        
        Args:
            file_content: Contenido del archivo en bytes
            filename: Nombre original del archivo
            student_id: ID del estudiante
            
        Returns:
            dict con información del archivo guardado
        """
        # Crear directorio para el estudiante si no existe
        student_dir = cls.PROJECTS_DIR / student_id
        student_dir.mkdir(exist_ok=True)
        
        # Generar nombre único para el archivo
        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = student_dir / unique_filename
        
        # Guardar archivo
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Calcular tamaño
        file_size = len(file_content)
        
        return {
            "filename": filename,
            "stored_filename": unique_filename,
            "file_path": str(file_path),
            "relative_path": f"projects/{student_id}/{unique_filename}",
            "file_size": file_size,
            "uploaded_at": datetime.utcnow()
        }
    
    @classmethod
    def get_file_path(cls, relative_path: str) -> Optional[Path]:
        """Obtener ruta completa de un archivo"""
        file_path = cls.BASE_DIR / relative_path
        if file_path.exists():
            return file_path
        return None
    
    @classmethod
    def delete_file(cls, relative_path: str) -> bool:
        """Eliminar un archivo"""
        file_path = cls.BASE_DIR / relative_path
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    
    @classmethod
    def get_student_files(cls, student_id: str) -> list:
        """Obtener lista de archivos de un estudiante"""
        student_dir = cls.PROJECTS_DIR / student_id
        if not student_dir.exists():
            return []
        
        files = []
        for file_path in student_dir.iterdir():
            if file_path.is_file():
                files.append({
                    "filename": file_path.name,
                    "size": file_path.stat().st_size,
                    "modified": datetime.fromtimestamp(file_path.stat().st_mtime)
                })
        return files


# Inicializar al importar
FileStorage.initialize()
