import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/Button';

interface SimplePDFViewerProps {
  fileUrl: string;
  fileName?: string;
}

export function SimplePDFViewer({ fileUrl, fileName }: SimplePDFViewerProps) {
  const [scale, setScale] = useState(100);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 10, 50));
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {fileName || 'Documento.pdf'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 50}
            leftIcon={<ZoomOut className="w-4 h-4" />}
          >
            -
          </Button>
          
          <span className="text-sm text-slate-600 min-w-[60px] text-center">
            {scale}%
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 200}
            leftIcon={<ZoomIn className="w-4 h-4" />}
          >
            +
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Descargar
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 bg-slate-200">
        <div 
          className="mx-auto bg-white shadow-lg"
          style={{
            width: `${scale}%`,
            minHeight: '100%'
          }}
        >
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full min-h-[800px]"
            title="PDF Viewer"
            style={{
              border: 'none',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}
