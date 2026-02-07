"""
Script de prueba para la API
Prueba los endpoints básicos de la API
"""
import asyncio
import httpx


BASE_URL = "http://localhost:8000"


async def test_api():
    """Probar endpoints de la API"""
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("🧪 PROBANDO API DE UNEXCA")
        print("=" * 60)
        print()
        
        # Test 1: Health check
        print("1️⃣ Probando health check...")
        try:
            response = await client.get(f"{BASE_URL}/health")
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test 2: Root endpoint
        print("2️⃣ Probando endpoint raíz...")
        try:
            response = await client.get(f"{BASE_URL}/")
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test 3: Get users
        print("3️⃣ Probando GET /api/v1/users...")
        try:
            response = await client.get(f"{BASE_URL}/api/v1/users")
            print(f"   ✅ Status: {response.status_code}")
            users = response.json()
            print(f"   📊 Total usuarios: {len(users)}")
            for user in users:
                print(f"      - {user['name']} ({user['role']})")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test 4: Get users stats
        print("4️⃣ Probando GET /api/v1/users/stats/summary...")
        try:
            response = await client.get(f"{BASE_URL}/api/v1/users/stats/summary")
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test 5: Get careers
        print("5️⃣ Probando GET /api/v1/careers...")
        try:
            response = await client.get(f"{BASE_URL}/api/v1/careers")
            print(f"   ✅ Status: {response.status_code}")
            careers = response.json()
            print(f"   📊 Total carreras: {len(careers)}")
            for career in careers:
                print(f"      - {career['name']} ({career['code']})")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test 6: Get subjects
        print("6️⃣ Probando GET /api/v1/subjects...")
        try:
            response = await client.get(f"{BASE_URL}/api/v1/subjects")
            print(f"   ✅ Status: {response.status_code}")
            subjects = response.json()
            print(f"   📊 Total materias de proyecto: {len(subjects)}")
            for subject in subjects:
                print(f"      - {subject['name']} ({subject['code']}) - Trayecto {subject['trayect']}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test 7: Get projects stats
        print("7️⃣ Probando GET /api/v1/projects/stats/summary...")
        try:
            response = await client.get(f"{BASE_URL}/api/v1/projects/stats/summary")
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        print("=" * 60)
        print("✅ PRUEBAS COMPLETADAS")
        print("=" * 60)
        print()
        print("📚 Documentación interactiva disponible en:")
        print(f"   - Swagger UI: {BASE_URL}/docs")
        print(f"   - ReDoc: {BASE_URL}/redoc")
        print()


if __name__ == "__main__":
    print()
    print("⚠️  Asegúrate de que el servidor esté corriendo:")
    print("   python main.py")
    print()
    input("Presiona Enter para continuar con las pruebas...")
    print()
    
    asyncio.run(test_api())
