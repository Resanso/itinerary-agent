'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-background-card border border-gray-200 rounded-[var(--radius-input)]',
              'px-4 py-3 text-text-primary placeholder:text-text-secondary',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all duration-200',
              icon ? 'pl-12' : '',
              error ? 'border-danger focus:ring-danger' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-status-red-text">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

