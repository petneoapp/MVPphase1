import React from 'react';

export interface OperationsShellProps {
  title: string;
  tabs?: { label: string; href: string; active?: boolean }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function OperationsShell({ title, tabs, actions, children }: OperationsShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Header for Clinic Operations */}
      <header className="bg-[var(--color-background)] border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-[var(--spacing-md)] lg:px-[var(--spacing-xl)] h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-heading font-bold text-xl">{title}</h1>
            <span className="hidden md:inline-block px-2 py-1 rounded bg-[var(--color-info)] text-white text-xs font-semibold uppercase tracking-wider">Ops Mode</span>
          </div>
          <div className="flex items-center gap-[var(--spacing-sm)]">
            {actions}
          </div>
        </div>

        {/* Operational Tabs (e.g. Grooming, Boarding, Queue) */}
        {tabs && tabs.length > 0 && (
          <div className="max-w-screen-2xl mx-auto px-[var(--spacing-md)] lg:px-[var(--spacing-xl)] flex gap-[var(--spacing-lg)] overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800">
            {tabs.map((tab, idx) => (
              <a 
                key={idx} 
                href={tab.href}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  tab.active 
                    ? 'border-[var(--color-info)] text-[var(--color-info)]' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area optimized for wide screens */}
      <main className="flex-1 overflow-auto p-[var(--spacing-md)] lg:p-[var(--spacing-xl)]">
        <div className="max-w-screen-2xl mx-auto space-y-[var(--spacing-lg)]">
          {children}
        </div>
      </main>
    </div>
  );
}
