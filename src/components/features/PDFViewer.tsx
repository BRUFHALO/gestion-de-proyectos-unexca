import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize } from
'lucide-react';
interface PDFViewerProps {
  url?: string; // In a real app, this would be the PDF source
  className?: string;
}
export function PDFViewer({ url, className = '' }: PDFViewerProps) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const totalPages = 42; // Mock total pages
  return (
    <div
      className={`flex flex-col h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 ${className}`}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30">

            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30">

            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-1.5 rounded hover:bg-slate-100">

            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-600 w-12 text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="p-1.5 rounded hover:bg-slate-100">

            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content Area (Mock) */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-100/50">
        <div
          className="bg-white shadow-lg transition-transform duration-200 origin-top"
          style={{
            width: `${8.5 * (zoom / 100)}in`,
            minHeight: `${11 * (zoom / 100)}in`,
            transform: 'scale(1)' // Handled by width/height for better layout in this mock
          }}>

          {/* Mock Content */}
          <div
            className="p-12 h-full flex flex-col"
            style={{
              fontSize: `${zoom / 100}rem`
            }}>

            <div className="w-full h-16 border-b-2 border-primary mb-8 flex items-end pb-2 justify-between">
              <span className="text-xs text-slate-400">
                UNEXCA Digital Library
              </span>
              <span className="text-xs text-slate-400">Page {page}</span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-6">
              Academic Project Title
            </h1>

            <div className="space-y-4 text-slate-700 text-justify leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum.
              </p>
              <div className="my-8 p-6 bg-slate-50 border-l-4 border-accent rounded-r-lg italic">
                "The integration of digital tools in academic environments has
                shown a significant increase in student engagement and research
                output quality."
              </div>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                quae ab illo inventore veritatis et quasi architecto beatae
                vitae dicta sunt explicabo.
              </p>
              <p>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit
                aut fugit, sed quia consequuntur magni dolores eos qui ratione
                voluptatem sequi nesciunt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}