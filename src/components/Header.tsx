import React from 'react';
import { Bot, Calendar, Brain, ShieldCheck, Volume2, VolumeX, Cpu } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userEmail: string;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenAgenda: () => void;
  onOpenMemory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  userEmail,
  isAudioMuted,
  onToggleAudio,
  onOpenAgenda,
  onOpenMemory,
}) => {
  return (
    <header id="nexus-app-header" className="sticky top-0 z-30 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-200 px-4 lg:px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20 shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-semibold text-zinc-100 tracking-tight text-base">Nexus AI Console</h1>
          <div className="px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] text-zinc-400 border border-zinc-700 uppercase tracking-widest font-mono">
            v2.5 Pro Agent
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Workspace Connection Pill */}
        <div id="google-workspace-status-pill" className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-300 font-medium">Workspace Active</span>
        </div>

        {/* Latency / Performance Indicator */}
        <div className="hidden lg:flex flex-col text-right px-2">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Planner Latency</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold">142ms</span>
        </div>

        <div className="w-px h-6 bg-zinc-800 hidden lg:block" />

        {/* Text-to-Speech Audio Toggle */}
        <button
          id="btn-toggle-tts"
          onClick={onToggleAudio}
          title={isAudioMuted ? 'Unmute Voice Responses' : 'Mute Voice Responses'}
          className={`p-2 rounded-lg transition-all border ${
            isAudioMuted
              ? 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-200'
              : 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Memory Inspector Button */}
        <button
          id="btn-open-memory"
          onClick={onOpenMemory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-800 transition-colors"
        >
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Memory State</span>
        </button>

        {/* Agenda Sidebar Toggle */}
        <button
          id="btn-open-agenda"
          onClick={onOpenAgenda}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-900/30 transition-all"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Context</span>
        </button>

        {/* User Badge */}
        <div id="user-profile-badge" className="pl-1 border-l border-zinc-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-200">
            {userName ? userName.charAt(0) : 'P'}
          </div>
        </div>
      </div>
    </header>
  );
};
