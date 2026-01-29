import React, { useId } from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || useId();
  return (
    <div className="w-full">
      {label &&
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700 mb-1.5">

          {label}
        </label>
      }
      <div className="relative">
        {icon &&
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        }
        <input
          id={inputId}
          className={`
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all
            disabled:bg-slate-50 disabled:text-slate-500
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
            ${className}
          `}
          {...props} />

      </div>
      {error &&
      <p className="mt-1 text-sm text-red-600 animate-fade-in">{error}</p>
      }
    </div>);

}