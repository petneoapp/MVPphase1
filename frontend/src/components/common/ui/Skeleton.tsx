import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "circular" | "rectangular" | "text";
}

export function Skeleton({ className = "", variant = "rectangular", ...props }: SkeletonProps) {
  const baseClass = "animate-pulse bg-[var(--color-surface-muted)]";
  
  let variantClass = "";
  switch (variant) {
    case "circular":
      variantClass = "rounded-full";
      break;
    case "text":
      variantClass = "rounded-md";
      break;
    case "rectangular":
    default:
      variantClass = "rounded-[var(--radius-button)]";
      break;
  }

  return <div className={`${baseClass} ${variantClass} ${className}`} {...props} />;
}
