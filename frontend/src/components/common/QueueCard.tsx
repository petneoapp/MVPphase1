import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface QueueItem {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  waitTimeMinutes?: number;
}

export interface QueueCardProps {
  title: string;
  items: QueueItem[];
  className?: string;
}

export function QueueCard({ title, items, className = '' }: QueueCardProps) {
  return (
    <div className={`p-[var(--spacing-md)] rounded-[var(--radius-lg)] bg-[var(--color-background)] shadow-[var(--shadow-card)] border border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">{title}</h4>
        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{items.length} in queue</span>
      </div>
      
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">Queue is empty</div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-xs font-mono text-gray-400 w-4">{index + 1}</div>
                <div className="font-medium">{item.name}</div>
              </div>
              <div className="flex items-center gap-3">
                {item.waitTimeMinutes !== undefined && (
                  <div className="text-xs text-gray-500">{item.waitTimeMinutes} min wait</div>
                )}
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
