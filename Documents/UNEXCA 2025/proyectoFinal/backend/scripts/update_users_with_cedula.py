"""
Script para actualizar usuarios existentes con cédula y contraseña
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from config.database import Database, DatabaseConfig
from utils.security import hash_password


async def update_users():
    """Actualizar usuarios con cédula y contraseña"""
    print("=" * 60)
    print("🔄 ACTUALIZANDO USUARIOS CON CÉDULA Y CONTRASEÑA")
    print("=" * 60)
    print()
    
    try:
        await Database.connect_db()
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        # Actualizar Coordinador
        print("📝 Actualizando Coordinador...")
        await users_collection.update_one(
            {"email": "coordinador@unexca.edu.ve"},
            {
                "$set": {
                    "cedula": "12345678",
                    "password": hash_password("Coord2025!"),  # Contraseña fuerte de 10 caracteres
                }
            }
        )
        print("   ✅ Coordinador: cédula=12345678, contraseña=Coord2025!")
        
        # Actualizar Profesor
        print("📝 Actualizando Profesor...")
        await users_collection.update_one(
            {"email": "martinez@unexca.edu.ve"},
            {
                "$set": {
                    "cedula": "15234567",
                    "password": hash_password("Prof2025"),  # Contraseña fuerte de 8 caracteres
                }
            }
        )
        print("   ✅ Profesor: cédula=15234567, contraseña=Prof2025")
        
        # Actualizar Estudiante 1 (María)
        print("📝 Actualizando Estudiante María...")
        maria_cedula = "27123456"
        await users_collection.update_one(
            {"email": "maria.rodriguez@unexca.edu.ve"},
            {
                "$set": {
                    "cedula": maria_cedula,
                    "password": hash_password(maria_cedula),  # Contraseña = cédula
                    "assigned_teacher": {
                        "teacher_id": None,  # Se actualizará después
                        "teacher_name": "Prof. Carlos Martínez",
                        "subject_code": "PI-III",
                        "subject_name": "Proyecto Integrador III",
                        "assigned_at": None
                    }
                }
            }
        )
        print(f"   ✅ Estudiante María: cédula={maria_cedula}, contraseña={maria_cedula}")
        
        # Actualizar Estudiante 2 (Juan)
        print("📝 Actualizando Estudiante Juan...")
        juan_cedula = "26987654"
        await users_collection.update_one(
            {"email": "juan.perez@unexca.edu.ve"},
            {
                "$set": {
                    "cedula": juan_cedula,
                    "password": hash_password(juan_cedula),  # Contraseña = cédula
                    "assigned_teacher": {
                        "teacher_id": None,  # Se actualizará después
                        "teacher_name": "Prof. Carlos Martínez",
                        "subject_code": "PI-III",
                        "subject_name": "Proyecto Integrador III",
                        "assigned_at": None
                    }
                }
            }
        )
        print(f"   ✅ Estudiante Juan: cédula={juan_cedula}, contraseña={juan_cedula}")
        
        # Asignar teacher_id a los estudiantes
        print("\n📝 Asignando profesor a estudiantes...")
        teacher = await users_collection.find_one({"email": "martinez@unexca.edu.ve"})
        if teacher:
            teacher_id = teacher["_id"]
            
            await users_collection.update_many(
                {"role": "student"},
                {
                    "$set": {
                        "assigned_teacher.teacher_id": teacher_id
                    }
                }
            )
            print(f"   ✅ Profesor asignado a todos los estudiantes")
        
        # Crear índice para cédula
        print("\n🔧 Creando índice para cédula...")
        await users_collection.create_index("cedula", unique=True)
        print("   ✅ Índice creado")
        
        print()
        print("=" * 60)
        print("✅ USUARIOS ACTUALIZADOS CORRECTAMENTE")
        print("=" * 60)
        print()
        print("🔐 Credenciales de acceso:")
        print()
        print("   Coordinador:")
        print("   - Cédula: 12345678")
        print("   - Contraseña: Coord2025!")
        print()
        print("   Profesor:")
        print("   - Cédula: 15234567")
        print("   - Contraseña: Prof2025")
        print()
        print("   Estudiante María:")
        print("   - Cédula: 27123456")
        print("   - Contraseña: 27123456")
        print()
        print("   Estudiante Juan:")
        print("   - Cédula: 26987654")
        print("   - Contraseña: 26987654")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR AL ACTUALIZAR USUARIOS")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        sys.exit(1)
    
    finally:
        await Database.close_db()


if __name__ == "__main__":
    asyncio.run(update_users())
