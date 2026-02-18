import requests
import json

# URL del endpoint
url = "http://localhost:8000/api/v1/users"

# Datos de prueba
user_data = {
    "first_name": "Maria",
    "last_name": "Gonzalez",
    "username": "87654321",
    "email": "87654321@unexca.edu.ve",
    "password": "87654321",
    "role": "student",
    "cedula": "87654321",
    "university_data": {
        "career_name": "Informática"
    }
}

try:
    # Probar POST request
    response = requests.post(url, json=user_data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Usuario creado exitosamente")
    else:
        print("❌ Error al crear usuario")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Probar GET request para verificar
try:
    # Probar con parámetros
    response = requests.get(url + "?limit=5")
    print(f"\nGET con limit Status Code: {response.status_code}")
    if response.status_code == 200:
        users = response.json()
        print(f"✅ Usuarios encontrados: {len(users)}")
        for user in users[:2]:  # Mostrar primeros 2 usuarios
            print(f"  - {user.get('name', 'N/A')} ({user.get('role', 'N/A')})")
    else:
        print(f"❌ Error al obtener usuarios: {response.text}")
    
    # Probar sin parámetros
    response = requests.get(url)
    print(f"\nGET sin parámetros Status Code: {response.status_code}")
    if response.status_code == 200:
        users = response.json()
        print(f"✅ Usuarios encontrados: {len(users)}")
    else:
        print(f"❌ Error al obtener usuarios: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
