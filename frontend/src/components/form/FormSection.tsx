import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`py-[var(--spacing-lg)] ${className}`}>
      <div className="md:grid md:grid-cols-3 md:gap-[var(--spacing-xl)]">
        <div className="md:col-span-1 mb-[var(--spacing-md)] md:mb-0">
          <h3 className="text-lg font-heading font-medium leading-6 text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <div className="space-y-[var(--spacing-md)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
