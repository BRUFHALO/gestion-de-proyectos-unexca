"""
Script para actualizar las carreras en la base de datos
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).parent))

from config.database import Database, DatabaseConfig


async def update_careers():
    """Actualizar carreras con las nuevas definiciones"""
    print("📚 Actualizando carreras...")
    
    careers_collection = Database.get_collection(DatabaseConfig.CAREERS_COLLECTION)
    
    careers = [
        {
            "code": "TUR-001",
            "name": "Turismo",
            "faculty": "Ciencias Económicas y Sociales",
            "faculty_code": "CES-001",
            "description": "Carrera enfocada en gestión turística y hospitalidad",
            "duration_years": 4,
            "total_trayects": 4,
            "active_students": 180,
            "active_teachers": 15,
            "university_sync": {
                "career_id": 201,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "AGR-001",
            "name": "Ingeniería Agroalimentaria",
            "faculty": "Ingeniería",
            "faculty_code": "ING-001",
            "description": "Carrera de ingeniería enfocada en procesamiento de alimentos y agroindustria",
            "duration_years": 5,
            "total_trayects": 5,
            "active_students": 150,
            "active_teachers": 12,
            "university_sync": {
                "career_id": 202,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "ADM-001",
            "name": "Administración de Empresas",
            "faculty": "Ciencias Económicas y Sociales",
            "faculty_code": "CES-001",
            "description": "Carrera enfocada en gestión empresarial y administración",
            "duration_years": 4,
            "total_trayects": 4,
            "active_students": 220,
            "active_teachers": 18,
            "university_sync": {
                "career_id": 203,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "INF-001",
            "name": "Ingeniería Informática",
            "faculty": "Ingeniería",
            "faculty_code": "ING-001",
            "description": "Carrera de 4 años enfocada en desarrollo de software y sistemas",
            "duration_years": 4,
            "total_trayects": 4,
            "active_students": 245,
            "active_teachers": 18,
            "university_sync": {
                "career_id": 204,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "LOG-001",
            "name": "Distribución Logística",
            "faculty": "Ciencias Económicas y Sociales",
            "faculty_code": "CES-001",
            "description": "Carrera especializada en gestión de cadenas de suministro y logística",
            "duration_years": 4,
            "total_trayects": 4,
            "active_students": 130,
            "active_teachers": 10,
            "university_sync": {
                "career_id": 205,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    for career in careers:
        await careers_collection.update_one(
            {"code": career["code"]},
            {"$set": career},
            upsert=True
        )
    
    print(f"   ✅ {len(careers)} carreras actualizadas")


async def main():
    """Actualizar carreras en la base de datos"""
    print("=" * 60)
    print("🎓 ACTUALIZANDO CARRERAS")
    print("=" * 60)
    print()
    
    try:
        await Database.connect_db()
        
        await update_careers()
        
        print()
        print("=" * 60)
        print("✅ CARRERAS ACTUALIZADAS CORRECTAMENTE")
        print("=" * 60)
        print()
        print("🎓 Carreras disponibles:")
        print("   - Turismo (TUR-001)")
        print("   - Ingeniería Agroalimentaria (AGR-001)")
        print("   - Administración de Empresas (ADM-001)")
        print("   - Ingeniería Informática (INF-001)")
        print("   - Distribución Logística (LOG-001)")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR AL ACTUALIZAR CARRERAS")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        sys.exit(1)
    
    finally:
        await Database.close_db()


if __name__ == "__main__":
    asyncio.run(main())
