import React from 'react';
import { Download, Eye, BookOpen, Users } from 'lucide-react';
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
    <Card hoverable className="flex flex-col h-full group" onClick={onView}>
      <div className="relative h-40 bg-slate-200 overflow-hidden">
        {thumbnail ?
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> :


        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white p-6 text-center">
            <BookOpen className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-medium opacity-75 uppercase tracking-wider">
              Biblioteca UNEXCA
            </span>
          </div>
        }
        <div className="absolute top-3 right-3">
          <Badge
            variant="default"
            className="bg-white/90 backdrop-blur-sm shadow-sm">

            {year}
          </Badge>
        </div>
      </div>

      <CardContent className="flex-grow flex flex-col p-5">
        <div className="mb-3">
          <Badge variant="info" className="mb-2">
            {career}
          </Badge>
          <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-start text-sm text-slate-600">
            <Users className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-slate-400" />
            <span className="line-clamp-1">{authors.join(', ')}</span>
          </div>
          <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
            <span className="font-medium mr-1">Metodología:</span> {methodology}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t-0 bg-transparent flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          leftIcon={<Eye className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}>

          Ver
        </Button>
        {onDownload &&
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
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