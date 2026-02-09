"""
Servicio de almacenamiento en Cloudinary para PDFs
"""
import os
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError


class CloudinaryStorage:
    """Gestión de almacenamiento en Cloudinary"""
    
    @classmethod
    def initialize(cls):
        """Inicializar configuración de Cloudinary"""
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True
        )
        print("☁️ Cloudinary configurado correctamente")
    
    @classmethod
    def upload_pdf(cls, file_content: bytes, filename: str, student_id: str) -> Dict[str, Any]:
        """
        Subir PDF a Cloudinary
        
        Args:
            file_content: Contenido del PDF en bytes
            filename: Nombre original del archivo
            student_id: ID del estudiante
            
        Returns:
            Dict con información del archivo subido
        """
        try:
            # Generar nombre único
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{student_id}_{uuid.uuid4().hex}{file_extension}"
            
            # Subir a Cloudinary
            upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")
            
            upload_params = {
                "file": file_content,
                "public_id": unique_filename,
                "folder": f"projects/{student_id}",
                "resource_type": "raw",
                "format": "pdf",
                "overwrite": True,
                "invalidate": True,
                "use_filename": True,
                "unique_filename": False
            }
            
            # Agregar upload preset si existe
            if upload_preset:
                upload_params["upload_preset"] = upload_preset
            
            result = cloudinary.uploader.upload(**upload_params)
            
            return {
                "success": True,
                "filename": filename,
                "stored_filename": unique_filename,
                "file_path": f"projects/{student_id}/{unique_filename}",
                "file_url": result["secure_url"],
                "file_size": len(file_content),
                "public_id": result["public_id"],
                "uploaded_at": datetime.utcnow(),
                "cloudinary": True
            }
            
        except CloudinaryError as e:
            print(f"❌ Error subiendo a Cloudinary: {e}")
            return {
                "success": False,
                "error": str(e),
                "cloudinary": False
            }
        except Exception as e:
            print(f"❌ Error general: {e}")
            return {
                "success": False,
                "error": str(e),
                "cloudinary": False
            }
    
    @classmethod
    def delete_file(cls, public_id: str) -> bool:
        """
        Eliminar archivo de Cloudinary
        
        Args:
            public_id: ID público del archivo en Cloudinary
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type="raw",
                invalidate=True
            )
            return result.get("result") == "ok"
        except CloudinaryError as e:
            print(f"❌ Error eliminando de Cloudinary: {e}")
            return False
        except Exception as e:
            print(f"❌ Error general eliminando: {e}")
            return False
    
    @classmethod
    def get_file_info(cls, public_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener información de un archivo en Cloudinary
        
        Args:
            public_id: ID público del archivo
            
        Returns:
            Dict con información del archivo o None
        """
        try:
            result = cloudinary.api.resource(
                public_id,
                resource_type="raw"
            )
            return {
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "format": result["format"],
                "bytes": result["bytes"],
                "created_at": result["created_at"]
            }
        except CloudinaryError:
            return None
        except Exception:
            return None
