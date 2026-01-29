import React from 'react';
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className = ''
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };
  return (
    <div
      className={`relative inline-block rounded-full overflow-hidden bg-primary-light text-white flex items-center justify-center font-semibold ${sizes[size]} ${className}`}>

      {src ?
      <img
        src={src}
        alt={alt || fallback}
        className="w-full h-full object-cover" /> :


      <span>{fallback.substring(0, 2).toUpperCase()}</span>
      }
    </div>);

}