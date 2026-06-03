import React from 'react';

export interface ActionFooterProps {
  primaryLabel: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
  
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
  
  danger?: boolean;
  className?: string;
}

export function ActionFooter({
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled,
  danger,
  className = ''
}: ActionFooterProps) {
  const primaryColor = danger ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-info)]';

  return (
    <div className={`flex flex-row-reverse items-center justify-start gap-3 w-full ${className}`}>
      <button
        type={onPrimaryClick ? 'button' : 'submit'}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        className={`px-4 py-2 rounded-[var(--radius-md)] text-white font-medium transition-opacity ${primaryColor} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {primaryLabel}
      </button>

      {secondaryLabel && (
        <button
          type="button"
          onClick={onSecondaryClick}
          disabled={secondaryDisabled}
          className="px-4 py-2 rounded-[var(--radius-md)] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
