"""
Verificación simple del servidor
"""
import requests

def check_server():
    try:
        response = requests.get('http://localhost:8000/', timeout=5)
        print(f"✅ Servidor activo - Status: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Error conectando al servidor: {e}")
        print("💡 Asegúrate de que el servidor esté iniciado:")
        print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        return False

if __name__ == "__main__":
    check_server()
