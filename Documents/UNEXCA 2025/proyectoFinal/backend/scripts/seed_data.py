"""
Script para cargar datos de prueba en la base de datos
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.append(str(Path(__file__).parent.parent))

from config.database import Database, DatabaseConfig
from bson import ObjectId


async def seed_careers():
    """Cargar carreras de ejemplo"""
    print("📚 Cargando carreras...")
    
    careers_collection = Database.get_collection(DatabaseConfig.CAREERS_COLLECTION)
    
    careers = [
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
                "career_id": 123,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "ADM-001",
            "name": "Administración",
            "faculty": "Ciencias Económicas y Sociales",
            "faculty_code": "CES-001",
            "description": "Carrera enfocada en gestión empresarial y administración",
            "duration_years": 4,
            "total_trayects": 4,
            "active_students": 180,
            "active_teachers": 15,
            "university_sync": {
                "career_id": 124,
                "last_sync": datetime.utcnow(),
                "sync_status": "active"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "EDU-001",
            "name": "Educación Integral",
            "faculty": "Educación",
            "faculty_code": "EDU-001",
            "description": "Formación de docentes para educación básica",
            "duration_years": 4,
            "total_trayects": 4,
            "active_students": 120,
            "active_teachers": 12,
            "university_sync": {
                "career_id": 125,
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
    
    print(f"   ✅ {len(careers)} carreras cargadas")


async def seed_subjects():
    """Cargar materias de proyecto de ejemplo"""
    print("📖 Cargando materias de proyecto...")
    
    subjects_collection = Database.get_collection(DatabaseConfig.SUBJECTS_COLLECTION)
    
    subjects = [
        {
            "code": "PI-I",
            "name": "Proyecto Integrador I",
            "career_code": "INF-001",
            "career_name": "Ingeniería en Informática",
            "trayect": 1,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "integrador",
            "credits": 4,
            "hours_per_week": 6,
            "description": "Primer proyecto integrador enfocado en fundamentos de programación",
            "objectives": [
                "Aplicar conceptos básicos de programación",
                "Desarrollar pensamiento algorítmico",
                "Trabajar en equipo"
            ],
            "requirements": {
                "min_pages": 15,
                "max_pages": 30,
                "required_sections": ["Introducción", "Desarrollo", "Conclusiones"],
                "methodologies_allowed": ["Cascada"],
                "team_size_min": 1,
                "team_size_max": 2,
                "requires_advisor": False
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "PI-II",
            "name": "Proyecto Integrador II",
            "career_code": "INF-001",
            "career_name": "Ingeniería en Informática",
            "trayect": 2,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "integrador",
            "credits": 5,
            "hours_per_week": 7,
            "description": "Proyecto enfocado en desarrollo de aplicaciones web",
            "objectives": [
                "Desarrollar aplicaciones web completas",
                "Aplicar bases de datos relacionales",
                "Implementar arquitecturas cliente-servidor"
            ],
            "requirements": {
                "min_pages": 25,
                "max_pages": 50,
                "required_sections": ["Introducción", "Marco Teórico", "Metodología", "Desarrollo", "Conclusiones"],
                "methodologies_allowed": ["Cascada", "Iterativo"],
                "team_size_min": 1,
                "team_size_max": 3,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "PI-III",
            "name": "Proyecto Integrador III",
            "career_code": "INF-001",
            "career_name": "Ingeniería en Informática",
            "trayect": 3,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "integrador",
            "credits": 6,
            "hours_per_week": 8,
            "description": "Desarrollo de proyecto integrador aplicando metodologías ágiles",
            "objectives": [
                "Aplicar metodologías ágiles de desarrollo",
                "Integrar conocimientos de trayectos anteriores",
                "Desarrollar soluciones tecnológicas innovadoras"
            ],
            "requirements": {
                "min_pages": 30,
                "max_pages": 80,
                "required_sections": ["Introducción", "Marco Teórico", "Metodología", "Resultados", "Conclusiones"],
                "methodologies_allowed": ["Scrum", "Kanban", "XP"],
                "team_size_min": 1,
                "team_size_max": 3,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "TG-IV",
            "name": "Trabajo de Grado",
            "career_code": "INF-001",
            "career_name": "Ingeniería en Informática",
            "trayect": 4,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "tesis",
            "credits": 8,
            "hours_per_week": 10,
            "description": "Trabajo de grado para optar al título de Ingeniero en Informática",
            "objectives": [
                "Desarrollar investigación aplicada",
                "Demostrar dominio de competencias profesionales",
                "Aportar soluciones innovadoras"
            ],
            "requirements": {
                "min_pages": 60,
                "max_pages": 150,
                "required_sections": [
                    "Introducción",
                    "Marco Teórico",
                    "Marco Metodológico",
                    "Análisis y Diseño",
                    "Implementación",
                    "Resultados",
                    "Conclusiones y Recomendaciones"
                ],
                "methodologies_allowed": ["Scrum", "Kanban", "XP", "Investigación-Acción"],
                "team_size_min": 1,
                "team_size_max": 2,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "PC-I",
            "name": "Proyecto Comunitario I",
            "career_code": "ADM-001",
            "career_name": "Administración",
            "trayect": 2,
            "semester": 1,
            "is_project_subject": True,
            "project_type": "comunitario",
            "credits": 4,
            "hours_per_week": 6,
            "description": "Proyecto de vinculación con la comunidad",
            "objectives": [
                "Aplicar conocimientos en contextos comunitarios",
                "Desarrollar responsabilidad social",
                "Diagnosticar necesidades comunitarias"
            ],
            "requirements": {
                "min_pages": 20,
                "max_pages": 40,
                "required_sections": ["Diagnóstico", "Planificación", "Ejecución", "Evaluación"],
                "methodologies_allowed": ["Investigación-Acción Participativa"],
                "team_size_min": 2,
                "team_size_max": 4,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    for subject in subjects:
        await subjects_collection.update_one(
            {"code": subject["code"]},
            {"$set": subject},
            upsert=True
        )
    
    print(f"   ✅ {len(subjects)} materias de proyecto cargadas")


async def seed_users():
    """Cargar usuarios de ejemplo"""
    print("👥 Cargando usuarios...")
    
    users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
    
    users = [
        {
            "email": "coordinador@unexca.edu.ve",
            "name": "Dra. Carmen López",
            "role": "coordinator",
            "university_data": {
                "user_id": "UNEXCA-COORD-001",
                "employee_number": "EMP-001",
                "career": "Ingeniería en Informática",
                "career_code": "INF-001",
                "faculty": "Ingeniería",
                "department": "Departamento de Computación",
                "category": "Profesor Titular",
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-212-1234567",
                "bio": "Coordinadora del programa de Ingeniería en Informática"
            },
            "stats": {
                "projects_supervised": 45,
                "last_activity": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "is_active": True
        },
        {
            "email": "martinez@unexca.edu.ve",
            "name": "Prof. Carlos Martínez",
            "role": "teacher",
            "university_data": {
                "user_id": "UNEXCA-PROF-001",
                "employee_number": "EMP-002",
                "career": "Ingeniería en Informática",
                "career_code": "INF-001",
                "faculty": "Ingeniería",
                "department": "Departamento de Computación",
                "category": "Profesor Asociado",
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-212-2345678",
                "bio": "Especialista en Inteligencia Artificial y Machine Learning"
            },
            "stats": {
                "projects_evaluated": 23,
                "average_grade": 85.5,
                "last_activity": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "is_active": True
        },
        {
            "email": "maria.rodriguez@unexca.edu.ve",
            "name": "María Rodríguez",
            "role": "student",
            "university_data": {
                "user_id": "UNEXCA-EST-001",
                "enrollment_number": "2021-12345",
                "career": "Ingeniería en Informática",
                "career_code": "INF-001",
                "faculty": "Ingeniería",
                "current_trayect": 3,
                "current_semester": 2,
                "gpa": 16.5,
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-414-1234567",
                "bio": "Estudiante de Ingeniería en Informática, apasionada por la IA"
            },
            "stats": {
                "projects_submitted": 2,
                "average_grade": 87.5,
                "last_activity": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "is_active": True
        },
        {
            "email": "juan.perez@unexca.edu.ve",
            "name": "Juan Pérez",
            "role": "student",
            "university_data": {
                "user_id": "UNEXCA-EST-002",
                "enrollment_number": "2021-12346",
                "career": "Ingeniería en Informática",
                "career_code": "INF-001",
                "faculty": "Ingeniería",
                "current_trayect": 3,
                "current_semester": 2,
                "gpa": 15.8,
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-424-2345678",
                "bio": "Desarrollador web en formación"
            },
            "stats": {
                "projects_submitted": 2,
                "average_grade": 82.0,
                "last_activity": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow() - timedelta(days=2),
            "is_active": True
        }
    ]
    
    for user in users:
        await users_collection.update_one(
            {"email": user["email"]},
            {"$set": user},
            upsert=True
        )
    
    print(f"   ✅ {len(users)} usuarios cargados")


async def main():
    """Cargar todos los datos de prueba"""
    print("=" * 60)
    print("🌱 CARGANDO DATOS DE PRUEBA")
    print("=" * 60)
    print()
    
    try:
        await Database.connect_db()
        
        await seed_careers()
        await seed_subjects()
        await seed_users()
        
        print()
        print("=" * 60)
        print("✅ DATOS DE PRUEBA CARGADOS CORRECTAMENTE")
        print("=" * 60)
        print()
        print("📊 Resumen:")
        print("   - 3 Carreras")
        print("   - 5 Materias de Proyecto")
        print("   - 4 Usuarios (1 Coordinador, 1 Profesor, 2 Estudiantes)")
        print()
        print("🔐 Credenciales de prueba:")
        print("   Coordinador: coordinador@unexca.edu.ve")
        print("   Profesor:    martinez@unexca.edu.ve")
        print("   Estudiante:  maria.rodriguez@unexca.edu.ve")
        print("   Estudiante:  juan.perez@unexca.edu.ve")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR AL CARGAR DATOS DE PRUEBA")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        sys.exit(1)
    
    finally:
        await Database.close_db()


if __name__ == "__main__":
    asyncio.run(main())
