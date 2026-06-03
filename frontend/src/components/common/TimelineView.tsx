import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: {
    name: string;
    avatarUrl?: string;
  };
  status?: 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'in-progress' | 'completed';
  attachments?: { name: string; url: string }[];
}

export interface TimelineViewProps {
  events: TimelineEvent[];
  className?: string;
}

export function TimelineView({ events, className = '' }: TimelineViewProps) {
  if (!events || events.length === 0) {
    return <div className="text-gray-500 text-sm text-center py-4">No events found.</div>;
  }

  return (
    <div className={`flow-root ${className}`}>
      <ul role="list" className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-8 ring-white dark:ring-gray-950">
                    {event.status ? (
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        event.status === 'success' || event.status === 'completed' ? 'bg-[var(--color-success)]' :
                        event.status === 'danger' ? 'bg-[var(--color-danger)]' :
                        event.status === 'warning' || event.status === 'pending' ? 'bg-[var(--color-warning)]' :
                        'bg-[var(--color-info)]'
                      }`} />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {event.description}
                      </p>
                    )}
                    
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.attachments.map((doc, idx) => (
                          <a key={idx} href={doc.url} className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {doc.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 text-right text-xs whitespace-nowrap">
                    <span className="text-gray-500">{event.timestamp}</span>
                    {event.status && <StatusBadge status={event.status} />}
                    {event.actor && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {event.actor.avatarUrl ? (
                          <img src={event.actor.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                        )}
                        <span className="font-medium text-gray-600 dark:text-gray-300">{event.actor.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
