"""
Script para probar el endpoint de estadísticas de evaluaciones
"""
import requests
import json

API_BASE_URL = 'http://localhost:8000'

def test_evaluation_stats():
    """Probar el endpoint de estadísticas de evaluaciones"""
    print("📊 Probando endpoint de estadísticas de evaluaciones...")
    
    try:
        response = requests.get(f'{API_BASE_URL}/api/v1/projects/evaluation-stats')
        
        if response.ok:
            stats = response.json()
            print(f"✅ Status: {response.status_code}")
            print()
            print("📈 Estadísticas de Evaluaciones:")
            print(f"   ✅ Completadas: {stats['completed']} (approved, published)")
            print(f"   ⏳ En Proceso: {stats['in_process']} (submitted, in_review, en_revision)")
            print(f"   ⚠️  Atrasadas: {stats['overdue']} (fecha pasada, no completados ni en revisión)")
            print(f"   📊 Total de Proyectos: {stats['total_projects']}")
            print(f"   ❌ Rechazados: {stats['rejected']}")
            print(f"   📊 Calificación Promedio: {stats['avg_grade']}/20")
            print(f"   📈 Tasa de Completación: {stats['completion_rate']}%")
            print()
            
            # Estadísticas por carrera
            if stats.get('career_stats'):
                print("🎓 Estadísticas por Carrera:")
                for career in stats['career_stats'][:5]:  # Mostrar top 5
                    print(f"   📚 {career['_id']}: {career['count']} proyectos ({career['completed']} completados)")
                print()
            
            print(f"🕐 Última Actualización: {stats['last_updated']}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    test_evaluation_stats()
