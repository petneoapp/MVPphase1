import React from 'react';

export interface AdminShellProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, breadcrumbs, actions, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-[var(--color-background)] border-r border-gray-200 dark:border-gray-800 hidden md:block flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="font-heading font-bold text-xl text-[var(--color-info)]">PetNeo Admin</h1>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          {/* Nav items injected by layout wrapper */}
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Platform</div>
          <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[var(--color-background)] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-[var(--spacing-lg)] shrink-0">
          <div className="flex flex-col">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex text-xs text-gray-500 mb-1" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center">
                    {idx > 0 && <span className="mx-2">/</span>}
                    {crumb.href ? <a href={crumb.href} className="hover:text-gray-900 dark:hover:text-white transition-colors">{crumb.label}</a> : <span>{crumb.label}</span>}
                  </span>
                ))}
              </nav>
            )}
            <h2 className="font-heading font-semibold text-lg">{title}</h2>
          </div>
          <div className="flex items-center gap-[var(--spacing-md)]">
            {actions}
          </div>
        </header>

        {/* Content Zone */}
        <div className="flex-1 overflow-auto p-[var(--spacing-lg)]">
          <div className="max-w-7xl mx-auto space-y-[var(--spacing-lg)]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
