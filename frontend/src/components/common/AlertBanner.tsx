import React from 'react';

export interface AlertBannerProps {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({ type, title, message, onDismiss, className = '' }: AlertBannerProps) {
  const getBannerStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800';
      case 'warning': return 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800';
      case 'danger': return 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800';
      case 'info': return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800';
      default: return 'bg-gray-50 text-gray-900 border-gray-200';
    }
  };

  return (
    <div className={`p-[var(--spacing-md)] rounded-[var(--radius-md)] border flex justify-between items-start ${getBannerStyles()} ${className}`}>
      <div>
        <h5 className="font-semibold">{title}</h5>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-70 hover:opacity-100 p-1 rounded-md" aria-label="Dismiss alert">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      )}
    </div>
  );
}
