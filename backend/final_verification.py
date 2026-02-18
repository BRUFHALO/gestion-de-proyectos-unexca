import requests

# Verificación final del sistema
teacher_id = '699618b0efc7367a60e23999'
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={teacher_id}')
print('Status:', response.status_code)
if response.ok:
    projects = response.json()
    print(f'✅ Profesora Sandra puede ver {len(projects)} proyectos asignados:')
    for i, project in enumerate(projects, 1):
        print(f'  {i}. {project.get("title")}')
        print(f'     Autores: {[author.get("name") for author in project.get("authors", [])]}')
        print(f'     Status: {project.get("metadata", {}).get("status")}')
        print()
else:
    print('❌ Error:', response.text)
