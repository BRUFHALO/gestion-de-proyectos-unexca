"""
Script para migrar los nombres de carreras en proyectos existentes
al estándar definido para la biblioteca digital
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

from config.database import Database, DatabaseConfig

# Estándar de nombres de carreras
CAREER_STANDARDIZATION = {
    # Mapeo de nombres antiguos a nuevos nombres estándar
    "Ingeniería en Informática": "Ingeniería en Informática",
    "Ingeniería Informática": "Ingeniería en Informática", 
    "Administración de Empresas": "Administracion de Empresas",
    "Administracion de Empresa": "Administracion de Empresas",
    "Administracion de Empresas": "Administracion de Empresas",
    "Turismo": "Turismo",
    "Ingeniería Agroalimentaria": "Ingeniería Agroalimentaria",
    "Ingeniería Agroalimentaria": "Ingeniería Agroalimentaria",
    "Distribución Logística": "Distribucion y Logistica",
    "Distribucion Logistica": "Distribucion y Logistica",
    "Distribucion y Logistica": "Distribucion y Logistica",
    # Posibles variaciones que puedan existir
    "informatica": "Ingeniería en Informática",
    "administracion": "Administracion de Empresas",
    "administración": "Administracion de Empresas",
    "turismo": "Turismo",
    "agroalimentaria": "Ingeniería Agroalimentaria",
    "distribucion": "Distribucion y Logistica",
    "logistica": "Distribucion y Logistica"
}

async def migrate_project_careers():
    """Migrar los nombres de carreras en todos los proyectos"""
    print("🔄 Migrando nombres de carreras en proyectos...")
    
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    
    # Obtener todos los proyectos
    projects = await projects_collection.find({}).to_list(length=None)
    
    updated_count = 0
    errors = []
    
    for project in projects:
        try:
            # Obtener el nombre actual de la carrera
            current_career = None
            if 'academic_info' in project and 'career_name' in project['academic_info']:
                current_career = project['academic_info']['career_name']
            
            if current_career and current_career in CAREER_STANDARDIZATION:
                new_career_name = CAREER_STANDARDIZATION[current_career]
                
                # Actualizar solo si el nombre es diferente
                if current_career != new_career_name:
                    await projects_collection.update_one(
                        {"_id": project["_id"]},
                        {
                            "$set": {
                                "academic_info.career_name": new_career_name,
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    
                    print(f"   ✅ Actualizado: '{current_career}' → '{new_career_name}' (Proyecto: {project.get('title', 'Sin título')})")
                    updated_count += 1
                else:
                    print(f"   ⏭️  Sin cambios: '{current_career}' (Proyecto: {project.get('title', 'Sin título')})")
            elif current_career:
                print(f"   ⚠️  Nombre no encontrado en mapeo: '{current_career}' (Proyecto: {project.get('title', 'Sin título')})")
                errors.append(f"Nombre no mapeado: '{current_career}'")
            else:
                print(f"   ❌ Proyecto sin career_name (ID: {project['_id']})")
                
        except Exception as e:
            print(f"   ❌ Error actualizando proyecto {project.get('_id', 'Unknown')}: {e}")
            errors.append(f"Error en proyecto {project.get('_id', 'Unknown')}: {e}")
    
    print(f"\n📊 Resumen de migración:")
    print(f"   - Proyectos procesados: {len(projects)}")
    print(f"   - Proyectos actualizados: {updated_count}")
    print(f"   - Errores: {len(errors)}")
    
    if errors:
        print(f"\n⚠️  Errores encontrados:")
        for error in errors[:10]:  # Mostrar solo los primeros 10 errores
            print(f"   - {error}")
        if len(errors) > 10:
            print(f"   - ... y {len(errors) - 10} errores más")
    
    return updated_count, len(errors)

async def update_careers_collection():
    """Actualizar la colección de carreras con los nombres estándar"""
    print("\n🎓 Actualizando colección de carreras...")
    
    careers_collection = Database.get_collection(DatabaseConfig.CAREERS_COLLECTION)
    
    # Definición estándar de carreras
    standard_careers = [
        {
            "code": "INF-001",
            "name": "Ingeniería en Informática",
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
            "code": "ADM-001",
            "name": "Administracion de Empresas",
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
            "code": "LOG-001",
            "name": "Distribucion y Logistica",
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
    
    for career in standard_careers:
        await careers_collection.update_one(
            {"code": career["code"]},
            {"$set": career},
            upsert=True
        )
    
    print(f"   ✅ {len(standard_careers)} carreras estándar actualizadas")

async def main():
    """Función principal de migración"""
    print("=" * 80)
    print("🎓 MIGRACIÓN DE NOMBRES DE CARRERAS")
    print("=" * 80)
    print()
    
    print("📋 Estándar de nombres de carreras:")
    for key, value in CAREER_STANDARDIZATION.items():
        if key != value:  # Mostrar solo los que cambian
            print(f"   '{key}' → '{value}'")
    print()
    
    try:
        await Database.connect_db()
        
        # Actualizar colección de carreras
        await update_careers_collection()
        
        # Migrar proyectos
        updated_count, error_count = await migrate_project_careers()
        
        print("\n" + "=" * 80)
        print("✅ MIGRACIÓN COMPLETADA")
        print("=" * 80)
        print(f"📊 Resultados:")
        print(f"   - Proyectos actualizados: {updated_count}")
        print(f"   - Errores: {error_count}")
        print()
        print("🎓 Nombres estándar implementados:")
        print("   - Ingeniería en Informática")
        print("   - Administracion de Empresas")
        print("   - Turismo")
        print("   - Ingeniería Agroalimentaria")
        print("   - Distribucion y Logistica")
        print()
        
        if error_count > 0:
            print("⚠️  Se encontraron errores. Revisa el log anterior.")
            sys.exit(1)
        
    except Exception as e:
        print("\n" + "=" * 80)
        print(f"❌ ERROR EN MIGRACIÓN")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        sys.exit(1)
    
    finally:
        await Database.close_db()

if __name__ == "__main__":
    asyncio.run(main())
