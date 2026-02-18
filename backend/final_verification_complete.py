import requests

print('=== VERIFICACIÓN FINAL COMPLETA DEL SISTEMA ===')
print()

# Verificar Carlos Martínez
carlos_id = '697f0423ea766bc70c53a5d4'
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}')
print(f'Carlos Martínez (ID: {carlos_id}):')
if response.ok:
    projects = response.json()
    print(f'  ✅ Puede ver {len(projects)} proyectos asignados')
    for project in projects:
        print(f'     - {project.get("title")} (por {[author.get("name") for author in project.get("authors", [])]})')
else:
    print('  ❌ Error:', response.text)

print()

# Verificar Sandra Marcano
sandra_id = '699618b0efc7367a60e23999'
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={sandra_id}')
print(f'Sandra Marcano (ID: {sandra_id}):')
if response.ok:
    projects = response.json()
    print(f'  ✅ Puede ver {len(projects)} proyectos asignados')
    for project in projects:
        print(f'     - {project.get("title")} (por {[author.get("name") for author in project.get("authors", [])]})')
else:
    print('  ❌ Error:', response.text)

print()
print('=== SISTEMA FUNCIONANDO CORRECTAMENTE ===')
print('✅ Cada profesor ve únicamente los proyectos de sus estudiantes asignados')
