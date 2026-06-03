import React from 'react';

export interface FormCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function FormCard({ title, description, children, footer, onSubmit, className = '' }: FormCardProps) {
  return (
    <form 
      onSubmit={onSubmit ? (e) => { e.preventDefault(); onSubmit(e); } : undefined}
      className={`bg-[var(--color-background)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
    >
      {(title || description) && (
        <div className="px-[var(--spacing-lg)] py-[var(--spacing-md)] border-b border-gray-200 dark:border-gray-800">
          {title && <h3 className="text-lg font-heading font-semibold">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      
      <div className="p-[var(--spacing-lg)] space-y-[var(--spacing-lg)]">
        {children}
      </div>

      {footer && (
        <div className="bg-gray-50 dark:bg-gray-900/50 px-[var(--spacing-lg)] py-[var(--spacing-md)] border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          {footer}
        </div>
      )}
    </form>
  );
}
