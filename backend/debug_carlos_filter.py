import requests

# Probar con el ID de Carlos
carlos_id = '697f0423ea766bc70c53a5d4'
print(f'Probando con ID de Carlos: {carlos_id}')

# 1. Probar el endpoint principal
response = requests.get(f'http://localhost:8000/api/v1/projects?assigned_to={carlos_id}')
print(f'Endpoint principal - Status: {response.status_code}')
if response.ok:
    projects = response.json()
    print(f'Proyectos encontrados: {len(projects)}')
else:
    print('Error:', response.text)

# 2. Probar el endpoint específico de profesor
response = requests.get(f'http://localhost:8000/api/v1/projects/teacher/{carlos_id}/assigned')
print(f'Endpoint específico - Status: {response.status_code}')
if response.ok:
    projects = response.json()
    print(f'Proyectos encontrados: {len(projects)}')
    for project in projects:
        print(f'  - {project.get("title")}')
else:
    print('Error:', response.text)

# 3. Verificar manualmente
response = requests.get('http://localhost:8000/api/v1/projects')
if response.ok:
    all_projects = response.json()
    carlos_projects = []
    for project in all_projects:
        evaluation = project.get('evaluation', {})
        if evaluation.get('assigned_to') == carlos_id:
            carlos_projects.append(project)
    
    print(f'Búsqueda manual - Proyectos de Carlos: {len(carlos_projects)}')
    for project in carlos_projects:
        print(f'  - {project.get("title")}')
