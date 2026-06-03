import React from 'react';

export interface OccupancyCardProps {
  title: string;
  current: number;
  capacity: number;
  unit?: string;
  className?: string;
}

export function OccupancyCard({ title, current, capacity, unit = 'kennels', className = '' }: OccupancyCardProps) {
  const percentage = Math.min(100, Math.max(0, (current / capacity) * 100));
  
  let progressColor = 'bg-[var(--color-success)]';
  if (percentage >= 90) progressColor = 'bg-[var(--color-danger)]';
  else if (percentage >= 75) progressColor = 'bg-[var(--color-warning)]';

  return (
    <div className={`p-[var(--spacing-md)] rounded-[var(--radius-lg)] bg-[var(--color-background)] shadow-[var(--shadow-card)] border border-gray-100 dark:border-gray-800 ${className}`}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-400">Occupancy</span>
        <span className="font-medium">{current} / {capacity} {unit}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${progressColor} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
