import { Download, Eye, BookOpen, Users, Calendar, Award, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
interface ProjectCardProps {
  title: string;
  authors: string[];
  career: string;
  year: string;
  methodology: string;
  thumbnail?: string;
  onView: () => void;
  onDownload?: () => void;
}
export function ProjectCard({
  title,
  authors,
  career,
  year,
  methodology,
  thumbnail,
  onView,
  onDownload
}: ProjectCardProps) {
  return (
    <Card hoverable className="flex flex-col h-full group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden bg-gradient-to-br from-white to-slate-50/80" onClick={onView}>
      {/* Imagen con efectos mejorados */}
      <div className="relative h-48 bg-slate-200 overflow-hidden">
        {thumbnail ?
        <div className="relative w-full h-full">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          {/* Overlay con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div> :
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12" />
            
            <BookOpen className="w-12 h-12 mb-3 opacity-80" />
            <span className="text-sm font-medium opacity-90 uppercase tracking-wider">
              Biblioteca UNEXCA
            </span>
          </div>
        }
        
        {/* Badge de año mejorado */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-full px-3 py-1.5 border border-white/20">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-semibold text-slate-800">
                {year}
              </span>
            </div>
          </div>
        </div>
        
        {/* Badge de metodología en hover */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Badge variant="info" className="bg-white/95 backdrop-blur-md shadow-lg border-0 text-xs font-medium">
            {methodology}
          </Badge>
        </div>
      </div>

      <CardContent className="flex-grow flex flex-col p-5 relative">
        {/* Badge de carrera mejorado */}
        <div className="mb-3">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full">
            <Award className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">
              {career}
            </span>
          </div>
        </div>
        
        {/* Título mejorado */}
        <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 mb-3 group-hover:text-blue-700 transition-colors duration-300">
          {title}
        </h3>

        <div className="mt-auto space-y-4">
          {/* Autores mejorados */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {authors.join(', ')}
              </p>
            </div>
          </div>
          
          {/* Metodología mejorada */}
          <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">
                Metodología: {methodology}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t-0 bg-transparent flex gap-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 shadow-sm hover:shadow-md transition-all duration-200"
          leftIcon={<Eye className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}>
          Ver Detalles
        </Button>
        {onDownload &&
        <Button
          variant="ghost"
          size="sm"
          className="px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          aria-label="Descargar PDF">
          <Download className="w-4 h-4" />
        </Button>
        }
      </CardFooter>
    </Card>);

}