import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, trend, trendValue, icon, className = '' }: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-[var(--color-success)]';
    if (trend === 'down') return 'text-[var(--color-danger)]';
    return 'text-gray-500';
  };

  return (
    <div className={`p-[var(--spacing-md)] rounded-[var(--radius-lg)] bg-[var(--color-background)] shadow-[var(--shadow-card)] border border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h4>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-heading font-bold">{value}</div>
        {trendValue && (
          <div className={`text-sm font-medium ${getTrendColor()}`}>
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
