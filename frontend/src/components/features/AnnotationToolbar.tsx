import React, { useState } from 'react';
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  ArrowRight,
  Sticker,
  Undo,
  Redo,
  Palette } from
'lucide-react';
interface Tool {
  id: string;
  icon: React.ReactNode;
  label: string;
}
export function AnnotationToolbar() {
  const [activeTool, setActiveTool] = useState('cursor');
  const [activeColor, setActiveColor] = useState('#ef4444'); // Red default for corrections
  const tools: Tool[] = [
  {
    id: 'cursor',
    icon: <MousePointer2 className="w-5 h-5" />,
    label: 'Select'
  },
  {
    id: 'text',
    icon: <Type className="w-5 h-5" />,
    label: 'Text'
  },
  {
    id: 'rect',
    icon: <Square className="w-5 h-5" />,
    label: 'Rectangle'
  },
  {
    id: 'circle',
    icon: <Circle className="w-5 h-5" />,
    label: 'Circle'
  },
  {
    id: 'arrow',
    icon: <ArrowRight className="w-5 h-5" />,
    label: 'Arrow'
  },
  {
    id: 'sticker',
    icon: <Sticker className="w-5 h-5" />,
    label: 'Sticker'
  }];

  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#000000'];
  return (
    <div className="bg-white rounded-full shadow-xl border border-slate-200 p-2 flex items-center gap-2 animate-slide-in">
      {tools.map((tool) =>
      <button
        key={tool.id}
        onClick={() => setActiveTool(tool.id)}
        className={`
            p-2.5 rounded-full transition-all duration-200 relative group
            ${activeTool === tool.id ? 'bg-primary text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}
          `}
        title={tool.label}>

          {tool.icon}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {tool.label}
          </span>
        </button>
      )}

      <div className="w-px h-8 bg-slate-200 mx-1" />

      <div className="flex items-center gap-1 px-1">
        {colors.map((color) =>
        <button
          key={color}
          onClick={() => setActiveColor(color)}
          className={`
              w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
              ${activeColor === color ? 'border-slate-400 scale-110' : 'border-transparent'}
            `}
          style={{
            backgroundColor: color
          }}
          title="Change Color" />

        )}
      </div>

      <div className="w-px h-8 bg-slate-200 mx-1" />

      <button
        className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full"
        title="Undo">

        <Undo className="w-5 h-5" />
      </button>
      <button
        className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full"
        title="Redo">

        <Redo className="w-5 h-5" />
      </button>
    </div>);

}