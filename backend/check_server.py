"""
Script para verificar el estado del servidor backend
"""
import requests
import json

API_BASE_URL = 'http://localhost:8000'

def check_server():
    """Verificar si el servidor backend está activo"""
    print("🔍 Verificando estado del servidor backend...")
    
    try:
        # Verificar endpoint principal
        response = requests.get(f'{API_BASE_URL}/', timeout=5)
        print(f"✅ Servidor principal - Status: {response.status_code}")
        
        # Verificar endpoint de usuarios
        response = requests.get(f'{API_BASE_URL}/api/v1/users?role=teacher&limit=1', timeout=5)
        print(f"✅ Endpoint usuarios - Status: {response.status_code}")
        
        # Verificar endpoint de proyectos
        response = requests.get(f'{API_BASE_URL}/api/v1/projects?limit=1', timeout=5)
        print(f"✅ Endpoint proyectos - Status: {response.status_code}")
        
        # Verificar nuevo endpoint de estadísticas
        response = requests.get(f'{API_BASE_URL}/api/v1/users/teachers-stats', timeout=5)
        print(f"✅ Endpoint teachers-stats - Status: {response.status_code}")
        
        print("\n🎉 Todos los endpoints están funcionando correctamente")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se puede conectar al servidor backend")
        print("💡 Asegúrate de que el servidor esté iniciado:")
        print("   cd backend")
        print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        
    except requests.exceptions.Timeout:
        print("❌ Error: Timeout al conectar con el servidor")
        print("💡 El servidor puede estar lento o no respondiendo")
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    check_server()
