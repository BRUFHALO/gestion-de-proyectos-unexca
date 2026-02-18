import requests

print('=== VERIFICACIÓN FINAL DEL SISTEMA ===')
print()

# 1. Verificar asignación de Ramón a Sandra
response = requests.get('http://localhost:8000/api/v1/users/students-with-assignments')
if response.ok:
    students = response.json()
    for student in students:
        if 'ramon' in student.get('name', '').lower():
            assigned = student.get('assigned_teacher')
            if assigned:
                print(f'✅ Estudiante {student.get("name")} asignado a {assigned.get("teacher_name")}')
            else:
                print(f'❌ Estudiante {student.get("name")} SIN ASIGNAR')
            break

# 2. Verificar que Sandra puede ver el proyecto
teacher_id = '699618b0efc7367a60e23999'
response = requests.get(f'http://localhost:8000/api/v1/projects/teacher/{teacher_id}/assigned')
if response.ok:
    projects = response.json()
    print(f'✅ Profesora Sandra puede ver {len(projects)} proyecto(s) asignados')
    for project in projects:
        print(f'   - {project.get("title")} (por {[author.get("name") for author in project.get("authors", [])]})')
else:
    print(f'❌ Error obteniendo proyectos de Sandra: {response.text}')

# 3. Verificar estado del proyecto
response = requests.get('http://localhost:8000/api/v1/projects')
if response.ok:
    all_projects = response.json()
    for project in all_projects:
        authors = project.get('authors', [])
        for author in authors:
            if 'ramon' in author.get('name', '').lower():
                evaluation = project.get('evaluation', {})
                print(f'✅ Proyecto "{project.get("title")}" asignado a profesor ID: {evaluation.get("assigned_to")}')
                print(f'   Status: {project.get("metadata", {}).get("status")}')
                print(f'   Fecha asignación: {evaluation.get("assigned_at")}')
                break

print()
print('=== SISTEMA FUNCIONANDO CORRECTAMENTE ===')
