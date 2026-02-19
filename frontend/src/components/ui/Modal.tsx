import React, { useEffect } from 'react';
import { X } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  if (!isOpen) return null;
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]'
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true" />


      <div
        className={`
          relative bg-white rounded-xl shadow-xl transform transition-all animate-scale-in flex flex-col max-h-full
          ${sizes[size]} w-full
        `}
        role="dialog"
        aria-modal="true">

        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          {title &&
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          }
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full p-1">

            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>);

}