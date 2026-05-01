"""
Script para validar que todos los nombres de carreras en la base de datos
cumplan con el estándar definido
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

from config.database import Database, DatabaseConfig

# Nombres estándar permitidos
STANDARD_CAREER_NAMES = {
    "Ingeniería en Informática",
    "Administracion de Empresas", 
    "Turismo",
    "Ingeniería Agroalimentaria",
    "Distribucion y Logistica"
}

async def validate_project_careers():
    """Validar nombres de carreras en proyectos"""
    print("🔍 Validando nombres de carreras en proyectos...")
    
    projects_collection = Database.get_collection(DatabaseConfig.PROJECTS_COLLECTION)
    
    # Obtener todos los proyectos
    projects = await projects_collection.find({}).to_list(length=None)
    
    valid_projects = 0
    invalid_projects = []
    missing_career = []
    
    for project in projects:
        try:
            if 'academic_info' in project and 'career_name' in project['academic_info']:
                career_name = project['academic_info']['career_name']
                
                if career_name in STANDARD_CAREER_NAMES:
                    valid_projects += 1
                else:
                    invalid_projects.append({
                        'title': project.get('title', 'Sin título'),
                        'career_name': career_name,
                        'id': str(project['_id'])
                    })
            else:
                missing_career.append({
                    'title': project.get('title', 'Sin título'),
                    'id': str(project['_id'])
                })
                
        except Exception as e:
            print(f"❌ Error validando proyecto {project.get('_id', 'Unknown')}: {e}")
    
    print(f"\n📊 Resultados de validación de proyectos:")
    print(f"   - Total proyectos: {len(projects)}")
    print(f"   - Proyectos válidos: {valid_projects}")
    print(f"   - Proyectos inválidos: {len(invalid_projects)}")
    print(f"   - Proyectos sin career_name: {len(missing_career)}")
    
    if invalid_projects:
        print(f"\n❌ Proyectos con nombres de carrera inválidos:")
        for proj in invalid_projects[:10]:  # Mostrar solo los primeros 10
            print(f"   - '{proj['career_name']}' en '{proj['title']}' (ID: {proj['id']})")
        if len(invalid_projects) > 10:
            print(f"   - ... y {len(invalid_projects) - 10} proyectos más")
    
    if missing_career:
        print(f"\n⚠️  Proyectos sin career_name:")
        for proj in missing_career[:5]:  # Mostrar solo los primeros 5
            print(f"   - '{proj['title']}' (ID: {proj['id']})")
        if len(missing_career) > 5:
            print(f"   - ... y {len(missing_career) - 5} proyectos más")
    
    return len(invalid_projects) + len(missing_career)

async def validate_careers_collection():
    """Validar nombres de carreras en la colección de carreras"""
    print("\n🎓 Validando colección de carreras...")
    
    careers_collection = Database.get_collection(DatabaseConfig.CAREERS_COLLECTION)
    
    # Obtener todas las carreras
    careers = await careers_collection.find({}).to_list(length=None)
    
    valid_careers = 0
    invalid_careers = []
    
    for career in careers:
        career_name = career.get('name', '')
        
        if career_name in STANDARD_CAREER_NAMES:
            valid_careers += 1
        else:
            invalid_careers.append({
                'name': career_name,
                'code': career.get('code', 'Sin código'),
                'id': str(career['_id'])
            })
    
    print(f"\n📊 Resultados de validación de carreras:")
    print(f"   - Total carreras: {len(careers)}")
    print(f"   - Carreras válidas: {valid_careers}")
    print(f"   - Carreras inválidas: {len(invalid_careers)}")
    
    if invalid_careers:
        print(f"\n❌ Carreras con nombres inválidos:")
        for career in invalid_careers:
            print(f"   - '{career['name']}' (Código: {career['code']}, ID: {career['id']})")
    
    return len(invalid_careers)

async def show_standard_names():
    """Mostrar los nombres estándar permitidos"""
    print("\n📋 Nombres estándar permitidos:")
    for name in sorted(STANDARD_CAREER_NAMES):
        print(f"   ✅ {name}")

async def main():
    """Función principal de validación"""
    print("=" * 80)
    print("🔍 VALIDACIÓN DE NOMBRES DE CARRERAS")
    print("=" * 80)
    
    await show_standard_names()
    
    try:
        await Database.connect_db()
        
        # Validar proyectos
        project_errors = await validate_project_careers()
        
        # Validar colección de carreras
        career_errors = await validate_careers_collection()
        
        total_errors = project_errors + career_errors
        
        print("\n" + "=" * 80)
        if total_errors == 0:
            print("✅ VALIDACIÓN EXITOSA")
            print("=" * 80)
            print("🎉 Todos los nombres de carreras cumplen con el estándar")
        else:
            print("❌ VALIDACIÓN CON ERRORES")
            print("=" * 80)
            print(f"Se encontraron {total_errors} errores")
            print("Ejecuta el script de migración para corregirlos:")
            print("   python backend/scripts/migrate_career_names.py")
            sys.exit(1)
        
    except Exception as e:
        print("\n" + "=" * 80)
        print(f"❌ ERROR EN VALIDACIÓN")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        sys.exit(1)
    
    finally:
        await Database.close_db()

if __name__ == "__main__":
    asyncio.run(main())
