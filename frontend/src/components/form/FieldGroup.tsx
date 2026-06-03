import React from 'react';

export interface FieldGroupProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldGroup({ id, label, error, hint, required, children, className = '' }: FieldGroupProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
      </label>
      
      <div className="mt-1">
        {children}
      </div>

      {error ? (
        <p className="mt-1 text-sm text-[var(--color-danger)]" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
