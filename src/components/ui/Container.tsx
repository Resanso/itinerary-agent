import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Container({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  ...props
}: ContainerProps) {
  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddings = {
    none: '',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidths[maxWidth],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

