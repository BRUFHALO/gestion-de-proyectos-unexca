"""
Script para crear un estudiante de prueba
"""
import asyncio
from config.database import Database, DatabaseConfig

async def create_test_student():
    """Crear un estudiante de prueba con cédula 31169960"""
    try:
        await Database.connect_db()
        
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Verificar si ya existe
        existing = await users_collection.find_one({"cedula": "31169960"})
        if existing:
            print("✅ Estudiante con cédula 31169960 ya existe")
            return
        
        # Crear estudiante de prueba
        test_student = {
            "first_name": "Juan",
            "last_name": "Pérez",
            "username": "juanperez",
            "email": "juan.perez@unexca.edu",
            "password": "$2b$12$hashedpassword",  # Esto debería ser un hash real
            "role": "student",
            "cedula": "31169960",
            "university_data": {
                "section": "10-A",
                "grade": "10°",
                "career": "Informática"
            },
            "created_at": Database.get_current_datetime()
        }
        
        result = await users_collection.insert_one(test_student)
        print(f"✅ Estudiante de prueba creado con ID: {result.inserted_id}")
        print(f"   Nombre: {test_student['first_name']} {test_student['last_name']}")
        print(f"   Cédula: {test_student['cedula']}")
        print(f"   Email: {test_student['email']}")
        print(f"   Sección: {test_student['university_data']['section']}")
        
    except Exception as e:
        print(f"❌ Error al crear estudiante: {e}")
    finally:
        await Database.close_db()

if __name__ == "__main__":
    asyncio.run(create_test_student())
