import requests

# Verificar los proyectos de Sandra en la base de datos
response = requests.get('http://localhost:8000/api/v1/projects')
if response.ok:
    all_projects = response.json()
    print('=== PROYECTOS DE SANDRA EN LA BASE DE DATOS ===')
    sandra_id = '699618b0efc7367a60e23999'
    
    for project in all_projects:
        evaluation = project.get('evaluation', {})
        assigned_to = evaluation.get('assigned_to')
        
        # Verificar si es de Sandra (comparando como string)
        if str(assigned_to) == sandra_id:
            print(f'Proyecto: {project.get("title")}')
            print(f'  assigned_to: "{assigned_to}"')
            print(f'  tipo: {type(assigned_to)}')
            print(f'  str(assigned_to): "{str(assigned_to)}"')
            print(f'  coincide con sandra_id: {str(assigned_to) == sandra_id}')
            print('---')
else:
    print('Error:', response.text)
