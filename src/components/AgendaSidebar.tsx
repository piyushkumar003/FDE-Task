import React from 'react';
import { CalendarEvent, TaskItem } from '../types';
import { Calendar, CheckSquare, Clock, MapPin, Users, X, RefreshCw, CheckCircle2, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

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

  const [scheduleViewMode, setScheduleViewMode] = React.useState<'week' | 'all'>('week');
  const [selectedYear, setSelectedYear] = React.useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');

  // Current week bounds (Monday to Sunday)
  const currentWeekEvents = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return events.filter(evt => {
      const d = new Date(evt.start);
      return d >= monday && d <= sunday;
    });
  }, [events]);

  const currentWeekTasks = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return tasks.filter(t => {
      if (!t.due) return true;
      const d = new Date(t.due);
      return d >= monday && d <= sunday;
    });
  }, [tasks]);

  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(String(new Date().getFullYear()));
    events.forEach(evt => {
      if (evt.start) {
        yearsSet.add(String(new Date(evt.start).getFullYear()));
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (scheduleViewMode === 'week') {
      return currentWeekEvents;
    }
    return events.filter(evt => {
      const d = new Date(evt.start);
      if (selectedYear !== 'all' && d.getFullYear().toString() !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'all' && d.getMonth().toString() !== selectedMonth) {
        return false;
      }
      return true;
    });
  }, [events, scheduleViewMode, selectedYear, selectedMonth, currentWeekEvents]);

  const filteredTasks = React.useMemo(() => {
    if (scheduleViewMode === 'week') {
      return currentWeekTasks;
    }
    return tasks.filter(t => {
      if (!t.due) return true;
      const d = new Date(t.due);
      if (selectedYear !== 'all' && d.getFullYear().toString() !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'all' && d.getMonth().toString() !== selectedMonth) {
        return false;
      }
      return true;
    });
  }, [tasks, scheduleViewMode, selectedYear, selectedMonth, currentWeekTasks]);

  const chartData = React.useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: { [key: string]: { day: string; meetings: number; tasks: number } } = {
      'Mon': { day: 'Mon', meetings: 0, tasks: 0 },
      'Tue': { day: 'Tue', meetings: 0, tasks: 0 },
      'Wed': { day: 'Wed', meetings: 0, tasks: 0 },
      'Thu': { day: 'Thu', meetings: 0, tasks: 0 },
      'Fri': { day: 'Fri', meetings: 0, tasks: 0 },
      'Sat': { day: 'Sat', meetings: 0, tasks: 0 },
      'Sun': { day: 'Sun', meetings: 0, tasks: 0 },
    };

    currentWeekEvents.forEach(evt => {
      if (evt.start) {
        const d = new Date(evt.start);
        const dayStr = dayNames[d.getDay()];
        if (counts[dayStr]) {
          counts[dayStr].meetings += 1;
        }
      }
    });

    currentWeekTasks.forEach(t => {
      if (t.due) {
        const d = new Date(t.due);
        const dayStr = dayNames[d.getDay()];
        if (counts[dayStr]) {
          counts[dayStr].tasks += 1;
        }
      } else {
        counts['Mon'].tasks += 1;
      }
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => counts[d]);
  }, [currentWeekEvents, currentWeekTasks]);

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
          {/* Weekly Distribution Chart */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                Weekly Distribution
              </h3>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20">
                Tasks vs Meetings
              </span>
            </div>
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="day" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                  <Bar dataKey="meetings" name="Meetings" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tasks" name="Tasks" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calendar Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Calendar Schedule
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setScheduleViewMode('week')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    scheduleViewMode === 'week' ? 'bg-blue-500 text-white font-medium' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setScheduleViewMode('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    scheduleViewMode === 'all' ? 'bg-blue-500 text-white font-medium' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All-Time / Calendar UI
                </button>
              </div>
            </div>

            {scheduleViewMode === 'all' && (
              <div className="p-3 mb-3 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 font-mono">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 font-mono">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500">
                Showing {filteredEvents.length} events {scheduleViewMode === 'week' ? '(This Week)' : '(All-Time Filtered)'}
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-xs font-mono text-zinc-500">
                No scheduled events found for this selection.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((evt) => {
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
