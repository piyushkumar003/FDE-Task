import React from 'react';
import { CalendarEvent, TaskItem } from '../types';
import { Calendar, CheckSquare, Clock, MapPin, Users, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AgendaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  tasks: TaskItem[];
  onRefresh: () => void;
  onQuickPrompt: (prompt: string) => void;
}

export const AgendaSidebar: React.FC<AgendaSidebarProps> = ({
  isOpen,
  onClose,
  events,
  tasks,
  onRefresh,
  onQuickPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div id="agenda-sidebar-overlay" className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-xs flex justify-end">
      <div id="agenda-sidebar-drawer" className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 text-zinc-100 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 font-sans">Active Context Feed</h2>
              <p className="text-[11px] font-mono text-zinc-400">Google Workspace Sync Stream</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-agenda"
              onClick={onRefresh}
              title="Refresh Feed"
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="btn-close-agenda"
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feed Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Calendar Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Calendar Schedule
              </h3>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20">
                {events.length} Events
              </span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-xs font-mono text-zinc-500">
                No scheduled events found.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((evt) => {
                  const dateFormatted = new Date(evt.start).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                          {evt.summary}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400">{dateFormatted}</span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}

                      {evt.attendees && evt.attendees.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="truncate">{evt.attendees.map((a) => a.email).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                Google Tasks Due
              </h3>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {tasks.filter((t) => t.status === 'needsAction').length} Pending
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-xs font-mono text-zinc-500">
                All tasks completed!
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      task.status === 'completed'
                        ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-600 line-through'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => onQuickPrompt(`Mark ${task.title} task completed`)}
                        title="Mark Completed"
                        className="p-1 rounded text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${task.status === 'completed' ? 'text-emerald-400' : ''}`} />
                      </button>
                      <span className="text-xs font-medium truncate">{task.title}</span>
                    </div>

                    {task.due && (
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer with Quick Triggers */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-xs">
          <p className="text-zinc-400 mb-2 font-mono text-[11px]">Quick Actions:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                onClose();
                onQuickPrompt('Schedule a meeting with John tomorrow at 3 PM');
              }}
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 text-[11px] font-mono transition-colors"
            >
              + Meeting with John
            </button>
            <button
              onClick={() => {
                onClose();
                onQuickPrompt('Move my Friday meeting to Monday morning');
              }}
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-purple-400 border border-zinc-800 text-[11px] font-mono transition-colors"
            >
              Reschedule Friday
            </button>
            <button
              onClick={() => {
                onClose();
                onQuickPrompt('Create a task to submit the report next Monday');
              }}
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 text-[11px] font-mono transition-colors"
            >
              + Task Submit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
