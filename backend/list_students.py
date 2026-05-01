"""
Script para listar todos los estudiantes en la base de datos
"""
import asyncio
from config.database import Database, DatabaseConfig

async def list_all_students():
    """Listar todos los estudiantes en la base de datos"""
    try:
        await Database.connect_db()
        
        users_collection = Database.get_collection(DatabaseConfig.USERS_COLLECTION)
        
        print("🔍 Buscando todos los usuarios...")
        
        # Listar todos los usuarios
        all_users = []
        async for user in users_collection.find({}):
            user_data = {
                "_id": str(user["_id"]),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", ""),
                "cedula": user.get("cedula", ""),
                "section": user.get("university_data", {}).get("section", ""),
                "grade": user.get("university_data", {}).get("grade", "")
            }
            all_users.append(user_data)
        
        print(f"📊 Total de usuarios encontrados: {len(all_users)}")
        print("\n" + "="*80)
        
        # Filtrar estudiantes
        students = [u for u in all_users if u["role"] == "student"]
        print(f"👨‍🎓 Total de estudiantes: {len(students)}")
        
        if students:
            print("\n📋 Lista de Estudiantes:")
            print("-" * 80)
            for i, student in enumerate(students, 1):
                print(f"{i:2d}. {student['first_name']} {student['last_name']}")
                print(f"    📧 Email: {student['email']}")
                print(f"    🆔 Cédula: {student['cedula']}")
                print(f"    📚 Sección: {student['section']}")
                print(f"    📈 Grado: {student['grade']}")
                print(f"    🆔 ID: {student['_id']}")
                print("-" * 40)
        else:
            print("❌ No se encontraron estudiantes")
        
        # Buscar específicamente la cédula 31169960
        print(f"\n🔍 Buscando específicamente cédula 31169960...")
        specific_user = await users_collection.find_one({"cedula": "31169960"})
        if specific_user:
            print("✅ Usuario encontrado con cédula 31169960:")
            print(f"   Nombre: {specific_user.get('first_name')} {specific_user.get('last_name')}")
            print(f"   Rol: {specific_user.get('role')}")
            print(f"   Email: {specific_user.get('email')}")
        else:
            print("❌ No se encontró ningún usuario con cédula 31169960")
        
        # Buscar si hay alguna cédula similar
        print(f"\n🔍 Buscando cédulas que contengan '31169960'...")
        similar_users = []
        async for user in users_collection.find({"cedula": {"$regex": "31169960"}}):
            similar_users.append(user)
        
        if similar_users:
            print(f"✅ Se encontraron {len(similar_users)} usuarios con cédulas similares:")
            for user in similar_users:
                print(f"   - {user.get('cedula')} ({user.get('role')})")
        else:
            print("❌ No se encontraron cédulas similares")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await Database.close_db()

if __name__ == "__main__":
    asyncio.run(list_all_students())
