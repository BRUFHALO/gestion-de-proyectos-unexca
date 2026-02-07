"""
Script de inicialización de la base de datos
Crea las colecciones e índices necesarios
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from config.database import Database, init_database


async def main():
    """Inicializar la base de datos"""
    print("=" * 60)
    print("🚀 INICIALIZANDO BASE DE DATOS UNEXCA")
    print("=" * 60)
    print()
    
    try:
        await init_database()
        print()
        print("=" * 60)
        print("✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE")
        print("=" * 60)
        print()
        print("📊 Colecciones creadas:")
        print("   - users (Estudiantes, Profesores, Coordinadores)")
        print("   - projects (Proyectos con versionamiento)")
        print("   - evaluations (Evaluaciones detalladas)")
        print("   - careers (Carreras universitarias)")
        print("   - subjects (Materias de proyecto)")
        print("   - reports (Reportes generados)")
        print("   - sync_logs (Logs de sincronización)")
        print("   - notifications (Notificaciones)")
        print("   - archived_files (Archivos archivados)")
        print()
        print("🔍 Índices creados para búsquedas optimizadas")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR AL INICIALIZAR BASE DE DATOS")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        sys.exit(1)
    
    finally:
        await Database.close_db()


if __name__ == "__main__":
    asyncio.run(main())
