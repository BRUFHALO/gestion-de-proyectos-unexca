import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { PDFEvaluationViewer } from '../components/PDFEvaluationViewer';

interface TeacherFeedbackPanelProps {
  projectId: string;
  onBack: () => void;
}

export function TeacherFeedbackPanel({ projectId, onBack }: TeacherFeedbackPanelProps) {
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setTeacherData({
        id: userData._id || 'teacher_default',
        name: userData.name || 'Profesor'
      });
    } catch (error) {
      console.error('Error al cargar datos del profesor:', error);
      setTeacherData({
        id: 'teacher_default',
        name: 'Profesor'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnotations = (annotations: any[]) => {
    console.log('Anotaciones guardadas:', annotations);
  };

  if (loading || !teacherData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <PDFEvaluationViewer
      projectId={projectId}
      teacherId={teacherData.id}
      teacherName={teacherData.name}
      onSave={handleSaveAnnotations}
      onBack={onBack}
    />
  );
}
