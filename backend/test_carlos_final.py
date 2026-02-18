import requests

# Probar la solución
carlos_id = '697f0423ea766bc70c53a5d4'
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}')
print('Status:', response.status_code)
if response.ok:
    projects = response.json()
    print(f'✅ Carlos Martínez puede ver {len(projects)} proyectos asignados:')
    for project in projects:
        print(f'  - {project.get("title")} (por {[author.get("name") for author in project.get("authors", [])]})')
else:
    print('Error:', response.text)
