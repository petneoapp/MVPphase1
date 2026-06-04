"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "emergency";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles incorporating new tokens: radius-button, transition-premium
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-[var(--radius-button)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-500)]/30 disabled:opacity-50 disabled:pointer-events-none transition-premium";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] shadow-[var(--shadow-premium-sm)]",
      secondary:
        "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)]",
      outline:
        "bg-transparent border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-hover)]",
      ghost:
        "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]",
      destructive:
        "bg-[var(--color-error-600)] text-white hover:bg-[var(--color-error-700)] shadow-[var(--shadow-premium-sm)]",
      success:
        "bg-[var(--color-success-600)] text-white hover:bg-[var(--color-success-700)] shadow-[var(--shadow-premium-sm)]",
      emergency:
        "bg-[var(--color-error-500)] text-white hover:bg-[var(--color-error-600)] font-bold shadow-[var(--shadow-premium-sm)] tracking-wide uppercase text-xs",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "h-8 px-4 text-xs",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10",
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <motion.button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
