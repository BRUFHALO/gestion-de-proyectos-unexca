import requests

# Verificar qué profesores existen y sus asignaciones
response = requests.get('http://localhost:8000/api/v1/users/teachers-available')
if response.ok:
    teachers = response.json()
    print('=== PROFESORES DISPONIBLES ===')
    for teacher in teachers:
        print(f'Profesor: {teacher.get("name")}')
        print(f'ID: {teacher.get("_id")}')
        print(f'Email: {teacher.get("email")}')
        print('---')
else:
    print('Error:', response.text)

# Verificar asignaciones de estudiantes
response = requests.get('http://localhost:8000/api/v1/users/students-with-assignments')
if response.ok:
    students = response.json()
    print('\n=== ASIGNACIONES DE ESTUDIANTES ===')
    for student in students:
        assigned = student.get('assigned_teacher')
        if assigned:
            print(f'Estudiante: {student.get("name")} -> Profesor: {assigned.get("teacher_name")} (ID: {assigned.get("teacher_id")})')
        else:
            print(f'Estudiante: {student.get("name")} -> SIN ASIGNAR')
else:
    print('Error:', response.text)
