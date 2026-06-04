import React from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, leftIcon, rightIcon, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-foreground)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[var(--color-surface)] border shadow-[var(--shadow-premium-sm)] rounded-[var(--radius-button)] px-4 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-slate-400 focus:outline-none focus-visible:ring-4 transition-premium disabled:opacity-50 disabled:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed ${
              error 
                ? "border-[var(--color-error-500)] focus-visible:ring-[var(--color-error-500)]/20" 
                : "border-[var(--color-border)] focus-visible:border-[var(--color-primary-500)] focus-visible:ring-[var(--color-primary-500)]/20 hover:border-[var(--color-border-hover)]"
            } ${leftIcon ? "pl-10" : ""} ${rightIcon || error ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {(rightIcon || error) && (
            <div className="absolute right-3 text-slate-400 flex items-center justify-center">
              {error ? <AlertCircle className="w-5 h-5 text-[var(--color-error-500)]" /> : rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={`text-xs font-medium ${error ? "text-[var(--color-error-500)]" : "text-[var(--color-surface-muted)]"}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
