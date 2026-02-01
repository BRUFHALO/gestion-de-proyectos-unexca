"""
Modelos de la base de datos
"""
from .user import User, UniversityData, UserProfile, UserStats
from .project import (
    Project, ProjectVersion, ProjectFile, Annotation,
    Evaluation, EvaluationFeedback, AcademicInfo, ProjectMetadata,
    Publication, Author
)
from .subject import Subject, SubjectRequirements
from .career import Career, UniversitySync
from .report import Report, ReportFile, GeneratedFor
from .sync_log import SyncLog, SyncStats, SyncError
from .notification import Notification

__all__ = [
    "User",
    "UniversityData",
    "UserProfile",
    "UserStats",
    "Project",
    "ProjectVersion",
    "ProjectFile",
    "Annotation",
    "Evaluation",
    "EvaluationFeedback",
    "AcademicInfo",
    "ProjectMetadata",
    "Publication",
    "Author",
    "Subject",
    "SubjectRequirements",
    "Career",
    "UniversitySync",
    "Report",
    "ReportFile",
    "GeneratedFor",
    "SyncLog",
    "SyncStats",
    "SyncError",
    "Notification",
]
