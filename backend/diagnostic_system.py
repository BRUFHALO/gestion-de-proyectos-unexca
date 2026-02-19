"""
Script de diagnóstico completo para el sistema
"""
import requests
import json

API_BASE_URL = 'http://localhost:8000'

def test_server_connection():
    """Probar conexión con el servidor"""
    print("🔍 Probando conexión con el servidor...")
    try:
        response = requests.get(f'{API_BASE_URL}/', timeout=5)
        print(f"✅ Servidor activo - Status: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_auth_endpoints():
    """Probar endpoints de autenticación"""
    print("\n🔐 Probando endpoints de autenticación...")
    
    try:
        # Probar endpoint de login
        response = requests.post(f'{API_BASE_URL}/api/v1/auth/login', 
                               json={"cedula": "12345678", "password": "12345678"})
        print(f"📝 Login endpoint - Status: {response.status_code}")
        if response.status_code == 404:
            print("   ℹ️  Usuario no encontrado (normal si no existe)")
        elif response.ok:
            data = response.json()
            print(f"   ✅ Login funciona: {data.get('message', 'OK')}")
        
        # Probar endpoint de validación
        response = requests.post(f'{API_BASE_URL}/api/v1/auth/validate-cedula',
                               json={"cedula": "12345678"})
        print(f"🔍 Validación endpoint - Status: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Error en auth: {e}")

def test_users_endpoints():
    """Probar endpoints de usuarios"""
    print("\n👥 Probando endpoints de usuarios...")
    
    try:
        # Listar usuarios
        response = requests.get(f'{API_BASE_URL}/api/v1/users?limit=5')
        print(f"📋 Listar usuarios - Status: {response.status_code}")
        if response.ok:
            users = response.json()
            print(f"   📊 Total usuarios: {len(users)}")
            
            # Mostrar usuarios de prueba
            for user in users[:3]:
                print(f"   👤 {user.get('name', 'Sin nombre')} ({user.get('role', 'sin rol')})")
                print(f"      📧 {user.get('email', 'sin email')}")
                print(f"      🆔 Cédula: {user.get('cedula', 'no tiene')}")
                print()
        
        # Probar endpoint de estadísticas de profesores
        response = requests.get(f'{API_BASE_URL}/api/v1/users/teachers-stats')
        print(f"📈 Teachers stats - Status: {response.status_code}")
        if response.ok:
            stats = response.json()
            print(f"   👨‍🏫 Profesores con stats: {len(stats)}")
        
    except Exception as e:
        print(f"❌ Error en usuarios: {e}")

def test_projects_endpoints():
    """Probar endpoints de proyectos"""
    print("\n📚 Probando endpoints de proyectos...")
    
    try:
        # Listar proyectos
        response = requests.get(f'{API_BASE_URL}/api/v1/projects?limit=5')
        print(f"📋 Listar proyectos - Status: {response.status_code}")
        if response.ok:
            projects = response.json()
            print(f"   📊 Total proyectos: {len(projects)}")
            
            # Mostrar algunos proyectos
            for project in projects[:3]:
                print(f"   📄 {project.get('title', 'Sin título')}")
                print(f"      👤 Autor: {project.get('authors', ['Sin autor'])[0]}")
                print(f"      📈 Estado: {project.get('metadata', {}).get('status', 'sin estado')}")
                print()
        
    except Exception as e:
        print(f"❌ Error en proyectos: {e}")

def check_test_users():
    """Verificar usuarios de prueba"""
    print("\n🧪 Verificando usuarios de prueba...")
    
    test_users = [
        {"cedula": "12345678", "password": "12345678"},
        {"cedula": "27272727", "password": "coordinator123"},
        {"cedula": "12345679", "password": "12345679"},
    ]
    
    for user_data in test_users:
        try:
            response = requests.post(f'{API_BASE_URL}/api/v1/auth/login',
                                   json=user_data)
            if response.ok:
                data = response.json()
                if data.get('success'):
                    print(f"✅ Usuario {user_data['cedula']}: {data.get('message', 'Login OK')}")
                else:
                    print(f"❌ Usuario {user_data['cedula']}: {data.get('message', 'Error')}")
            else:
                print(f"❌ Usuario {user_data['cedula']}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ Error probando usuario {user_data['cedula']}: {e}")

def main():
    """Diagnóstico completo"""
    print("=" * 60)
    print("🔧 DIAGNÓSTICO COMPLETO DEL SISTEMA")
    print("=" * 60)
    
    # Probar conexión básica
    if not test_server_connection():
        print("\n❌ SOLUCIÓN:")
        print("1. Inicia el servidor backend:")
        print("   cd backend")
        print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        print("2. Espera a que veas 'Application startup complete'")
        print("3. Vuelve a ejecutar este script")
        return
    
    # Si el servidor está activo, probar endpoints
    test_auth_endpoints()
    test_users_endpoints()
    test_projects_endpoints()
    check_test_users()
    
    print("\n" + "=" * 60)
    print("📋 RESUMEN DEL DIAGNÓSTICO")
    print("=" * 60)
    print("Si todo está ✅, el sistema funciona correctamente.")
    print("Si hay ❌, revisa los mensajes de error arriba.")
    print("\n💡 Si los usuarios no tienen cédula:")
    print("   1. Ejecuta: python update_careers.py")
    print("   2. O ejecuta: python scripts/seed_data.py")
    print("   3. Esto creará usuarios con cédulas de prueba")

if __name__ == "__main__":
    main()
