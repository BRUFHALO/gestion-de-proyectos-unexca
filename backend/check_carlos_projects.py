import requests

# Verificar proyectos de Carlos Martínez
carlos_id = '697f0423ea766bc70c53a5d4'
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}')
print('Status:', response.status_code)
if response.ok:
    projects = response.json()
    print(f'Proyectos asignados a Carlos Martínez: {len(projects)}')
    for project in projects:
        print(f'  - {project.get("title")} (por {[author.get("name") for author in project.get("authors", [])]})')
        print(f'    Status: {project.get("metadata", {}).get("status")}')
        print(f'    ID: {project.get("_id")}')
        print()
else:
    print('Error:', response.text)

# Verificar todos los proyectos para ver cuáles deberían ser de Carlos
response = requests.get('http://localhost:8000/api/v1/projects')
if response.ok:
    all_projects = response.json()
    print(f'Total proyectos en sistema: {len(all_projects)}')
    print('\n=== TODOS LOS PROYECTOS ===')
    for project in all_projects:
        evaluation = project.get('evaluation', {})
        assigned_to = evaluation.get('assigned_to')
        print(f'Proyecto: {project.get("title")}')
        print(f'  Autores: {[author.get("name") for author in project.get("authors", [])]}')
        print(f'  Asignado a: {assigned_to}')
        print(f'  Status: {project.get("metadata", {}).get("status")}')
        print('---')
else:
    print('Error:', response.text)
