import React from 'react';

export interface MarketplaceShellProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function MarketplaceShell({ children, headerContent }: MarketplaceShellProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col font-body">
      {/* Consumer-friendly Nav */}
      <header className="bg-[var(--color-background)] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-[var(--spacing-md)] lg:px-[var(--spacing-xl)] h-16 flex items-center justify-between">
          <div className="flex items-center gap-[var(--spacing-lg)]">
            <h1 className="font-heading font-bold text-2xl text-[var(--color-info)]">PetNeo</h1>
            <nav className="hidden md:flex gap-[var(--spacing-md)] text-sm font-medium">
              <a href="/marketplace" className="text-gray-900 dark:text-gray-100">Marketplace</a>
              <a href="/shop" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">Shop</a>
              <a href="/community" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">Community</a>
            </nav>
          </div>
          <div>
            {headerContent || (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area optimized for reading width */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-[var(--spacing-md)] lg:p-[var(--spacing-xl)]">
        {children}
      </main>

      {/* Footer Placeholder */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-[var(--spacing-xl)] mt-auto">
        <div className="max-w-5xl mx-auto px-[var(--spacing-md)] lg:px-[var(--spacing-xl)] text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} PetNeo Platform
        </div>
      </footer>
    </div>
  );
}
