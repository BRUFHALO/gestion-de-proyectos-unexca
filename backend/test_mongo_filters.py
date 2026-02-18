import requests

# Probar diferentes filtros para ver cuál funciona
carlos_id = '697f0423ea766bc70c53a5d4'

print(f'=== PROBANDO DIFERENTES FILTROS PARA CARLOS ({carlos_id}) ===')

# 1. Filtro actual (no funciona)
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}')
print(f'1. Filtro actual: {len(response.json())} proyectos')

# 2. Probar con diferentes parámetros
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}&limit=100')
print(f'2. Con limit=100: {len(response.json())} proyectos')

# 3. Probar sin otros filtros
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}&status=&career_code=&year=&created_by=')
print(f'3. Sin otros filtros: {len(response.json())} proyectos')

# 4. Probar endpoint específico
response = requests.get(f'http://localhost:8000/api/v1/projects/teacher/{carlos_id}/assigned')
print(f'4. Endpoint específico: {len(response.json())} proyectos')

# 5. Verificar si hay espacios o caracteres extraños
carlos_id_trimmed = carlos_id.strip()
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id_trimmed}')
print(f'5. ID con strip: {len(response.json())} proyectos')

# 6. Probar con encoding diferente
import urllib.parse
encoded_id = urllib.parse.quote(carlos_id)
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={encoded_id}')
print(f'6. ID encoded: {len(response.json())} proyectos')
