import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, IntentType } from '../types';
import { VoiceController } from './VoiceController';
import {
  Send,
  Bot,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  CheckSquare,
  Mail,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  isAudioMuted: boolean;
  onUndo: (actionId: string, payload: any) => void;
}

const QUICK_PROMPTS = [
  'Schedule a meeting with John tomorrow at 3 PM',
  'Move my Friday meeting to Monday morning',
  'Delete my dentist appointment',
  'What does my calendar look like this week?',
  'Create a task to submit the report next Monday',
  'Mark grocery task completed',
  'Show tasks due this week',
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  isAudioMuted,
  onUndo,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const renderToolBadge = (intent?: IntentType) => {
    if (!intent || intent === 'conversation.general') return null;

    let icon = <Sparkles className="w-3 h-3 text-blue-400" />;
    let label = 'Tool Calling';
    let style = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

    if (intent.startsWith('calendar')) {
      icon = <Calendar className="w-3 h-3 text-blue-400" />;
      label = 'Google Calendar API';
      style = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    } else if (intent.startsWith('tasks')) {
      icon = <CheckSquare className="w-3 h-3 text-emerald-400" />;
      label = 'Google Tasks API';
      style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (intent.startsWith('gmail')) {
      icon = <Mail className="w-3 h-3 text-amber-400" />;
      label = 'Google Gmail API';
      style = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono border ${style} mb-2`}>
        {icon}
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div id="nexus-chat-container" className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* Messages Stream */}
      <div id="messages-scroll-area" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 sm:gap-4 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col min-w-0">
                {!isUser && renderToolBadge(msg.intent)}

                <div
                  className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-blue-600 text-white font-sans'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Tool Calls Execution Info */}
                {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 font-mono text-[11px] text-zinc-400"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {tc.toolName}: <strong className="text-zinc-200 font-medium">{tc.action}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clarification prompt badge */}
                {msg.isClarification && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Multi-turn clarification requested</span>
                  </div>
                )}

                {/* Timestamp */}
                <span className={`text-[10px] font-mono text-zinc-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 text-zinc-400 text-xs py-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <Bot className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-zinc-300">Nexus AI orchestrating Google Workspace tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-950 overflow-x-auto whitespace-nowrap flex gap-2 custom-scrollbar">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(prompt)}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>{prompt}</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Voice Mic Button */}
          <VoiceController
            onTranscriptComplete={(transcript) => onSendMessage(transcript)}
            isProcessing={isProcessing}
            isAudioMuted={isAudioMuted}
          />

          {/* Text Input Field */}
          <div className="flex-1 relative">
            <input
              id="input-chat-query"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Try "Schedule a meeting with John tomorrow at 3 PM" or "What does my calendar look like?"'
              disabled={isProcessing}
              className="w-full bg-zinc-950 text-zinc-100 placeholder-zinc-500 text-sm px-4 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500 font-sans transition-colors"
            />
          </div>

          {/* Send Button */}
          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className={`p-3 rounded-xl font-medium transition-all ${
              inputText.trim() && !isProcessing
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
