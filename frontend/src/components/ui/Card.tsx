import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}
export function Card({
  children,
  className = '',
  onClick,
  hoverable = false
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden
        ${hoverable ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-300' : ''}
        ${className}
      `}
      onClick={onClick}>

      {children}
    </div>);

}
export function CardHeader({
  children,
  className = ''



}: {children: React.ReactNode;className?: string;}) {
  return (
    <div className={`p-6 border-b border-slate-100 ${className}`}>
      {children}
    </div>);

}
export function CardTitle({
  children,
  className = ''



}: {children: React.ReactNode;className?: string;}) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>);

}
export function CardContent({
  children,
  className = ''



}: {children: React.ReactNode;className?: string;}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
export function CardFooter({
  children,
  className = ''



}: {children: React.ReactNode;className?: string;}) {
  return (
    <div className={`p-6 bg-slate-50 border-t border-slate-100 ${className}`}>
      {children}
    </div>);

}