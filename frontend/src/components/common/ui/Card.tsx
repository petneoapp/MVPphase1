import React from "react";

export type CardVariant = "default" | "elevated" | "interactive" | "product" | "stat" | "outline";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** @deprecated Padding should now be handled explicitly via <CardContent> to ensure compositional flexibility */
  noPadding?: boolean;
}

export function Card({ className = "", variant = "default", noPadding, children, ...props }: CardProps) {
  // Base styles incorporating new tokens: radius-card, transition-premium
  const baseStyles = "bg-[var(--color-surface)] rounded-[var(--radius-card)] transition-premium overflow-hidden";

  const variants: Record<CardVariant, string> = {
    default: "border border-[var(--color-border)] shadow-[var(--shadow-premium-sm)]",
    elevated: "border border-transparent shadow-[var(--shadow-premium-md)]",
    outline: "border border-[var(--color-border)] shadow-none",
    interactive: "border border-[var(--color-border)] shadow-[var(--shadow-premium-sm)] hover:shadow-[var(--shadow-premium-md)] hover:border-[var(--color-border-hover)] hover:-translate-y-0.5 cursor-pointer",
    product: "border border-[var(--color-border)] shadow-sm hover:shadow-[var(--shadow-premium-md)] hover:border-[var(--color-border-hover)] transition-all duration-300",
    stat: "bg-[var(--color-surface-muted)] border border-transparent shadow-none"
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  // If noPadding is explicitly false (legacy fallback), we inject p-6. Otherwise, we act as a pure wrapper.
  // We prefer users use <CardContent> instead.
  const legacyPadding = noPadding === false ? "p-6" : "";

  return (
    <div className={combinedClassName} {...props}>
      {legacyPadding ? <div className={legacyPadding}>{children}</div> : children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-[var(--color-border)] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-semibold text-[var(--color-foreground)] tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 bg-[var(--color-surface-muted)] border-t border-[var(--color-border)] ${className}`} {...props}>
      {children}
    </div>
  );
}
