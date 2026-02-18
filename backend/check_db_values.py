import requests

# Obtener todos los proyectos y revisar los valores exactos de assigned_to
response = requests.get('http://localhost:8000/api/v1/projects')
if response.ok:
    all_projects = response.json()
    print('=== VALORES EXACTOS DE assigned_to EN LA BASE DE DATOS ===')
    for project in all_projects:
        evaluation = project.get('evaluation', {})
        assigned_to = evaluation.get('assigned_to')
        print(f'Proyecto: {project.get("title")}')
        print(f'  assigned_to: "{assigned_to}"')
        print(f'  tipo: {type(assigned_to)}')
        print(f'  longitud: {len(str(assigned_to)) if assigned_to else "None"}')
        print(f'  repr: {repr(assigned_to)}')
        print('---')
        
    # Buscar específicamente los proyectos que deberían ser de Carlos
    carlos_id = '697f0423ea766bc70c53a5d4'
    print(f'\n=== BUSCANDO COINCIDENCIAS EXACTAS CON "{carlos_id}" ===')
    for project in all_projects:
        evaluation = project.get('evaluation', {})
        assigned_to = evaluation.get('assigned_to')
        if assigned_to == carlos_id:
            print(f'✅ COINCIDENCIA: {project.get("title")}')
        else:
            print(f'❌ NO COINCIDE: {project.get("title")} - "{assigned_to}" != "{carlos_id}"')
else:
    print('Error:', response.text)
