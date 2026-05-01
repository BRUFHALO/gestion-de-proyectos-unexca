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
from utils.security import hash_password


async def seed_careers():
    """Cargar carreras de ejemplo"""
    print("📚 Cargando carreras...")
    
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
    
    print(f"   ✅ {len(careers)} carreras cargadas")


async def seed_subjects():
    """Cargar materias de proyecto de ejemplo"""
    print("📖 Cargando materias de proyecto...")
    
    subjects_collection = Database.get_collection(DatabaseConfig.SUBJECTS_COLLECTION)
    
    subjects = [
        # Materias para Ingeniería Informática
        {
            "code": "PI-I",
            "name": "Proyecto Integrador I",
            "career_code": "INF-001",
            "career_name": "Ingeniería Informática",
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
            "career_name": "Ingeniería Informática",
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
        # Materias para Administración de Empresas
        {
            "code": "PC-I",
            "name": "Proyecto Comunitario I",
            "career_code": "ADM-001",
            "career_name": "Administración de Empresas",
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
        },
        {
            "code": "PE-I",
            "name": "Proyecto Empresarial I",
            "career_code": "ADM-001",
            "career_name": "Administración de Empresas",
            "trayect": 3,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "empresarial",
            "credits": 6,
            "hours_per_week": 8,
            "description": "Desarrollo de plan de negocios para empresas reales",
            "objectives": [
                "Elaborar planes de negocios completos",
                "Análisis de mercado y competencia",
                "Desarrollar modelos financieros"
            ],
            "requirements": {
                "min_pages": 30,
                "max_pages": 60,
                "required_sections": ["Resumen Ejecutivo", "Análisis de Mercado", "Plan Operativo", "Plan Financiero", "Análisis de Riesgos"],
                "methodologies_allowed": ["Lean Startup", "Business Model Canvas"],
                "team_size_min": 2,
                "team_size_max": 4,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        # Materias para Turismo
        {
            "code": "PT-I",
            "name": "Proyecto Turístico I",
            "career_code": "TUR-001",
            "career_name": "Turismo",
            "trayect": 2,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "turistico",
            "credits": 4,
            "hours_per_week": 6,
            "description": "Desarrollo de proyectos de turismo sostenible",
            "objectives": [
                "Diseñar productos turísticos",
                "Análisis de impacto ambiental",
                "Gestión de servicios turísticos"
            ],
            "requirements": {
                "min_pages": 25,
                "max_pages": 45,
                "required_sections": ["Introducción", "Análisis de Mercado", "Diseño del Producto", "Plan de Operaciones", "Sostenibilidad"],
                "methodologies_allowed": ["Investigación de Mercados", "Design Thinking"],
                "team_size_min": 2,
                "team_size_max": 3,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        # Materias para Ingeniería Agroalimentaria
        {
            "code": "PA-I",
            "name": "Proyecto Agroindustrial I",
            "career_code": "AGR-001",
            "career_name": "Ingeniería Agroalimentaria",
            "trayect": 3,
            "semester": 1,
            "is_project_subject": True,
            "project_type": "agroindustrial",
            "credits": 5,
            "hours_per_week": 7,
            "description": "Desarrollo de procesos agroindustriales",
            "objectives": [
                "Diseñar procesos de transformación",
                "Control de calidad alimentaria",
                "Optimización de procesos"
            ],
            "requirements": {
                "min_pages": 30,
                "max_pages": 55,
                "required_sections": ["Introducción", "Revisión Bibliográfica", "Metodología", "Resultados", "Análisis Económico", "Conclusiones"],
                "methodologies_allowed": ["Experimental", "Análisis de Sistemas"],
                "team_size_min": 1,
                "team_size_max": 3,
                "requires_advisor": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        # Materias para Distribución Logística
        {
            "code": "PL-I",
            "name": "Proyecto Logístico I",
            "career_code": "LOG-001",
            "career_name": "Distribución Logística",
            "trayect": 2,
            "semester": 2,
            "is_project_subject": True,
            "project_type": "logistico",
            "credits": 4,
            "hours_per_week": 6,
            "description": "Optimización de cadenas de suministro",
            "objectives": [
                "Diseñar redes de distribución",
                "Optimizar inventarios",
                "Gestión del transporte"
            ],
            "requirements": {
                "min_pages": 25,
                "max_pages": 50,
                "required_sections": ["Introducción", "Análisis del Sistema Actual", "Propuesta de Mejora", "Simulación", "Resultados Esperados"],
                "methodologies_allowed": ["Simulación", "Análisis Cuantitativo"],
                "team_size_min": 2,
                "team_size_max": 3,
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
            "cedula": "27272727",
            "password": "coordinator123",  # Contraseña fuerte para coordinador
            "university_data": {
                "user_id": "UNEXCA-COORD-001",
                "employee_number": "EMP-001",
                "career": "Ingeniería Informática",
                "career_code": "INF-001",
                "faculty": "Ingeniería",
                "department": "Departamento de Computación",
                "category": "Profesor Titular",
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-212-1234567",
                "bio": "Coordinadora del programa de Ingeniería Informática"
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
            "cedula": "12345678",
            "password": "profesor123",  # Contraseña para profesor
            "university_data": {
                "user_id": "UNEXCA-PROF-001",
                "employee_number": "EMP-002",
                "career": "Ingeniería Informática",
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
            "email": "sandra@unexca.edu.ve",
            "name": "Prof. Sandra Marcano",
            "role": "teacher",
            "cedula": "12345679",
            "password": "profesor123",  # Contraseña para profesora
            "university_data": {
                "user_id": "UNEXCA-PROF-002",
                "employee_number": "EMP-003",
                "career": "Administración de Empresas",
                "career_code": "ADM-001",
                "faculty": "Ciencias Económicas y Sociales",
                "department": "Departamento de Administración",
                "category": "Profesor Asistente",
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-212-3456789",
                "bio": "Especialista en Gestión Empresarial y Proyectos"
            },
            "stats": {
                "projects_evaluated": 18,
                "average_grade": 88.2,
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
            "cedula": "87654321",
            "password": "87654321",  # Para estudiantes, contraseña = cédula
            "university_data": {
                "user_id": "UNEXCA-EST-001",
                "enrollment_number": "2021-12345",
                "career": "Ingeniería Informática",
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
                "bio": "Estudiante de Ingeniería Informática, apasionada por la IA"
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
            "cedula": "87654322",
            "password": "87654322",  # Para estudiantes, contraseña = cédula
            "university_data": {
                "user_id": "UNEXCA-EST-002",
                "enrollment_number": "2021-12346",
                "career": "Ingeniería Informática",
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
        },
        {
            "email": "ana.torres@unexca.edu.ve",
            "name": "Ana Torres",
            "role": "student",
            "cedula": "87654323",
            "password": "87654323",  # Para estudiantes, contraseña = cédula
            "university_data": {
                "user_id": "UNEXCA-EST-003",
                "enrollment_number": "2021-12347",
                "career": "Turismo",
                "career_code": "TUR-001",
                "faculty": "Ciencias Económicas y Sociales",
                "current_trayect": 2,
                "current_semester": 2,
                "gpa": 17.2,
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-416-3456789",
                "bio": "Estudiante de Turismo, interesada en sostenibilidad"
            },
            "stats": {
                "projects_submitted": 1,
                "average_grade": 89.0,
                "last_activity": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow() - timedelta(days=1),
            "is_active": True
        },
        {
            "email": "carlos.gomez@unexca.edu.ve",
            "name": "Carlos Gómez",
            "role": "student",
            "cedula": "87654324",
            "password": "87654324",  # Para estudiantes, contraseña = cédula
            "university_data": {
                "user_id": "UNEXCA-EST-004",
                "enrollment_number": "2021-12348",
                "career": "Administración de Empresas",
                "career_code": "ADM-001",
                "faculty": "Ciencias Económicas y Sociales",
                "current_trayect": 3,
                "current_semester": 1,
                "gpa": 16.8,
                "academic_status": "active",
                "last_sync": datetime.utcnow()
            },
            "profile": {
                "phone": "+58-412-4567890",
                "bio": "Estudiante de Administración, enfocado en emprendimiento"
            },
            "stats": {
                "projects_submitted": 1,
                "average_grade": 85.5,
                "last_activity": datetime.utcnow()
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": datetime.utcnow() - timedelta(days=3),
            "is_active": True
        }
    ]
    
    for user in users:
        # Hashear la contraseña antes de guardar
        if "password" in user:
            user["password"] = hash_password(user["password"])
        
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
        print("   - 5 Carreras")
        print("   - 7 Materias de Proyecto")
        print("   - 6 Usuarios (1 Coordinador, 2 Profesores, 3 Estudiantes)")
        print()
        print("🎓 Carreras disponibles:")
        print("   - Turismo (TUR-001)")
        print("   - Ingeniería Agroalimentaria (AGR-001)")
        print("   - Administración de Empresas (ADM-001)")
        print("   - Ingeniería Informática (INF-001)")
        print("   - Distribución Logística (LOG-001)")
        print()
        print("🔐 Credenciales de prueba:")
        print("   Coordinador: cédula=27272727, contraseña=coordinator123")
        print("   Profesor:    cédula=12345678, contraseña=profesor123")
        print("   Profesora:   cédula=12345679, contraseña=profesor123")
        print("   Estudiante:  cédula=87654321, contraseña=87654321")
        print("   Estudiante:  cédula=87654322, contraseña=87654322")
        print("   Estudiante:  cédula=87654323, contraseña=87654323")
        print("   Estudiante:  cédula=87654324, contraseña=87654324")
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
