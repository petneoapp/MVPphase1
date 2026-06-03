import React, { useEffect } from 'react';
import { ActionFooter } from './ActionFooter';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div 
        className="relative bg-[var(--color-background)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] max-w-md w-full overflow-hidden flex flex-col transform transition-all"
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <div className="px-[var(--spacing-lg)] pt-[var(--spacing-lg)] pb-[var(--spacing-md)] flex items-start gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {isDanger ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </div>
          <div className="mt-1">
            <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 px-[var(--spacing-lg)] py-[var(--spacing-md)] border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <ActionFooter 
            primaryLabel={confirmLabel}
            onPrimaryClick={onConfirm}
            secondaryLabel={cancelLabel}
            onSecondaryClick={onCancel}
            danger={isDanger}
          />
        </div>
      </div>
    </div>
  );
}
