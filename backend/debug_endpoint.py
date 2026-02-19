"""
Script para depurar el endpoint de estadísticas
"""
import requests
import json

API_BASE_URL = 'http://localhost:8000'

def debug_endpoint():
    """Depurar endpoint específico"""
    print("🔍 Depurando endpoint /api/v1/projects/evaluation-stats...")
    
    try:
        response = requests.get(f'{API_BASE_URL}/api/v1/projects/evaluation-stats')
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success!")
            data = response.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error {response.status_code}")
            print("Response:")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    debug_endpoint()
