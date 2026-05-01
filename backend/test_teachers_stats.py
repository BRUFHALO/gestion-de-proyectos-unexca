"""
Script para probar el endpoint de estadísticas de profesores
"""
import requests
import json

API_BASE_URL = 'http://localhost:8000'

def test_teachers_stats():
    """Probar el endpoint de estadísticas de profesores"""
    print("🧪 Probando endpoint de estadísticas de profesores...")
    
    try:
        response = requests.get(f'{API_BASE_URL}/api/v1/users/teachers-stats')
        
        if response.ok:
            teachers_stats = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Total de profesores: {len(teachers_stats)}")
            print()
            
            for i, teacher in enumerate(teachers_stats, 1):
                print(f"👨‍🏫 Profesor {i}: {teacher['name']}")
                print(f"   📧 Email: {teacher['email']}")
                print(f"   🎓 Carrera: {teacher['career']}")
                print(f"   📈 Carga: {teacher['load']}/{teacher['capacity']} ({teacher['load_percentage']}%)")
                print(f"   ⏳ Evaluaciones pendientes: {teacher['pending_evaluations']}")
                print(f"   ✅ Evaluaciones completadas: {teacher['completed_evaluations']}")
                print(f"   📊 Total de proyectos: {teacher['total_projects']}")
                print(f"   🏢 Departamento: {teacher['department']}")
                print(f"   📅 Última actividad: {teacher['last_active']}")
                print(f"   📋 Categoría: {teacher['category']}")
                print()
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    test_teachers_stats()
