import React from 'react';

export interface AssignmentCardProps {
  assigneeName: string;
  assigneeRole: string;
  assigneeAvatar?: string;
  assignmentTitle: string;
  timeSlot?: string;
  className?: string;
}

export function AssignmentCard({
  assigneeName,
  assigneeRole,
  assigneeAvatar,
  assignmentTitle,
  timeSlot,
  className = ''
}: AssignmentCardProps) {
  return (
    <div className={`p-[var(--spacing-md)] rounded-[var(--radius-lg)] bg-[var(--color-background)] shadow-[var(--shadow-card)] border border-gray-100 dark:border-gray-800 flex items-center gap-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {assigneeAvatar ? (
          <img src={assigneeAvatar} alt={assigneeName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500 font-medium">{assigneeName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold">{assigneeName}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{assigneeRole}</p>
        <div className="text-sm">
          <span className="font-medium">{assignmentTitle}</span>
          {timeSlot && <span className="ml-2 text-gray-500 text-xs">({timeSlot})</span>}
        </div>
      </div>
    </div>
  );
}
