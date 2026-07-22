import React from 'react';
import { MemoryContext } from '../types';
import { Brain, X, User, Calendar, CheckSquare, Layers } from 'lucide-react';

interface MemoryInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemoryContext;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ isOpen, onClose, memory }) => {
  if (!isOpen) return null;

  return (
    <div id="memory-inspector-overlay" className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div id="memory-inspector-modal" className="w-full max-w-lg bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 font-sans">Agent Memory State</h2>
              <p className="text-[11px] font-mono text-zinc-400">Multi-turn context & slot memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Active Pending Slots */}
          {memory.pendingSlot ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 font-mono">
              <div className="flex items-center gap-2 font-semibold mb-1 text-amber-400">
                <Layers className="w-4 h-4" />
                <span>Pending Slot Clarification</span>
              </div>
              <p>Intent: <code className="bg-amber-950/80 px-1.5 py-0.5 rounded text-amber-300">{memory.pendingSlot.intent}</code></p>
              <p className="mt-1">Missing parameter: <strong className="text-amber-100 uppercase">{memory.pendingSlot.missingFields.join(', ')}</strong></p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-400 font-mono text-[11px] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>No pending slot clarifications — Context nominal</span>
            </div>
          )}

          {/* Recently Referenced Objects */}
          <div>
            <h3 className="font-mono text-zinc-400 uppercase tracking-wider text-[11px] mb-2.5">
              Recently Referenced Workspace Entities
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-400">Last Event:</span>
                </div>
                <span className="font-mono text-zinc-200">{memory.lastReferencedEventTitle || 'None'}</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-400">Last Task:</span>
                </div>
                <span className="font-mono text-zinc-200">{memory.lastReferencedTaskTitle || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Cached Contacts in Memory */}
          <div>
            <h3 className="font-mono text-zinc-400 uppercase tracking-wider text-[11px] mb-2.5">
              Resolved Google Contacts in Session
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {memory.recentContacts.map((contact) => (
                <div key={contact.id} className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-200 truncate">{contact.name}</p>
                    <p className="text-[10px] font-mono text-zinc-500 truncate">{contact.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
