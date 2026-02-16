"""
API Router para verificar configuración de Cloudinary
"""
from fastapi import APIRouter, HTTPException
from utils.cloudinary_storage import CloudinaryStorage
import os
from datetime import datetime

router = APIRouter(prefix="/api/v1/storage", tags=["storage"])

@router.get("/status")
async def get_storage_status():
    """
    Verificar el estado del almacenamiento configurado
    """
    try:
        storage_type = os.getenv("STORAGE_TYPE", "local")
        
        status = {
            "storage_type": storage_type,
            "cloudinary_configured": False,
            "cloudinary_details": {}
        }
        
        if storage_type == "cloudinary":
            # Verificar variables de entorno de Cloudinary
            cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
            api_key = os.getenv("CLOUDINARY_API_KEY")
            api_secret = os.getenv("CLOUDINARY_API_SECRET")
            upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")
            
            status["cloudinary_configured"] = all([cloud_name, api_key, api_secret])
            status["cloudinary_details"] = {
                "cloud_name": cloud_name[:10] + "..." if cloud_name else None,
                "api_key": api_key[:10] + "..." if api_key else None,
                "api_secret": "***" if api_secret else None,
                "upload_preset": upload_preset
            }
            
            if status["cloudinary_configured"]:
                # Probar conexión a Cloudinary
                try:
                    CloudinaryStorage.initialize()
                    
                    # Intentar obtener información del API
                    import cloudinary.api
                    api_result = cloudinary.api.ping()
                    status["cloudinary_details"]["api_status"] = "connected"
                    status["cloudinary_details"]["api_response"] = api_result
                    
                except Exception as e:
                    status["cloudinary_details"]["api_status"] = "error"
                    status["cloudinary_details"]["api_error"] = str(e)
        
        return status
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verificando estado del almacenamiento: {str(e)}"
        )

@router.post("/test-upload")
async def test_cloudinary_upload():
    """
    Probar subida de un archivo a Cloudinary
    """
    try:
        # Crear un PDF de prueba
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.drawString(100, 750, "PDF de prueba para Cloudinary")
        p.drawString(100, 730, f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        p.save()
        
        buffer.seek(0)
        pdf_content = buffer.getvalue()
        
        # Subir a Cloudinary
        result = CloudinaryStorage.upload_pdf(
            pdf_content,
            "test_cloudinary.pdf",
            "test_user"
        )
        
        if result["success"]:
            # Eliminar el archivo de prueba
            CloudinaryStorage.delete_file(result["public_id"])
            result["test_cleanup"] = "success"
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en prueba de subida: {str(e)}"
        )
