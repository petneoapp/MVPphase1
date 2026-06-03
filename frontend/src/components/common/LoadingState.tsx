import React from 'react';

export interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-[var(--color-background)]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center p-[var(--spacing-xl)] w-full h-full min-h-[200px]";

  return (
    <div className={containerClasses}>
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--color-info)] rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-sm font-medium text-gray-500">{message}</p>}
    </div>
  );
}
