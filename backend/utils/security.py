"""
Utilidades de seguridad para autenticación
"""
import hashlib


def hash_password(password: str) -> str:
    """
    Hashear contraseña usando SHA-256
    En producción se debería usar bcrypt o argon2
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verificar contraseña contra hash
    """
    return hash_password(plain_password) == hashed_password


def validate_password_strength(password: str, role: str) -> tuple[bool, str]:
    """
    Validar fortaleza de contraseña según el rol
    
    - Estudiante: cédula (sin validación adicional)
    - Docente: mínimo 8 caracteres
    - Coordinador: mínimo 9 caracteres
    """
    if role == "student":
        # Para estudiantes, la contraseña es su cédula
        return True, "OK"
    
    if role == "teacher":
        if len(password) < 8:
            return False, "La contraseña debe tener al menos 8 caracteres"
        return True, "OK"
    
    if role == "coordinator":
        if len(password) < 9:
            return False, "La contraseña debe tener al menos 9 caracteres"
        return True, "OK"
    
    return False, "Rol inválido"
