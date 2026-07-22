import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AgendaSidebar } from './components/AgendaSidebar';
import { MemoryInspector } from './components/MemoryInspector';
import { ChatMessage, MemoryContext, CalendarEvent, TaskItem } from './types';
import { sendMessage, fetchAgenda, fetchMemory, undoLastAction } from './services/api';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content:
        'Hello Piyush! I am Nexus, your Google Workspace AI Personal Assistant.\n\nI can manage your Google Calendar, Google Tasks, Gmail, Contacts, and Google Drive.\n\nTry asking me to schedule a meeting, move an event, create a task, or show your agenda.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const [agendaEvents, setAgendaEvents] = useState<CalendarEvent[]>([]);
  const [agendaTasks, setAgendaTasks] = useState<TaskItem[]>([]);
  const [memory, setMemory] = useState<MemoryContext>({
    recentContacts: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Load Agenda Feed and Memory on load
  const loadWorkspaceData = async () => {
    try {
      const feed = await fetchAgenda();
      setAgendaEvents(feed.events);
      setAgendaTasks(feed.tasks);

      const mem = await fetchMemory('default');
      setMemory(mem);
    } catch (err) {
      console.warn('Error loading workspace feed:', err);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Text-To-Speech audio output
  const speakResponse = (text: string) => {
    if (isAudioMuted || typeof window === 'undefined') return;
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    // Add Optimistic User Message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await sendMessage(userText);
      setMessages((prev) => [...prev, response.message]);
      setMemory(response.memory);

      if (response.agendaUpdateNeeded) {
        await loadWorkspaceData();
      }

      // Voice output response
      speakResponse(response.message.content);
    } catch (error: any) {
      console.error('Error handling message:', error);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: `Sorry, I encountered an issue while communicating with your Google Workspace services: ${error?.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async (actionId: string, payload: any) => {
    try {
      const res = await undoLastAction(actionId, payload);
      await loadWorkspaceData();
      const sysMsg: ChatMessage = {
        id: `msg-sys-${Date.now()}`,
        sender: 'assistant',
        content: `↩️ ${res.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch (err: any) {
      console.error('Undo failed:', err);
    }
  };

  return (
    <div id="nexus-app-root" className="flex flex-col h-screen w-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      {/* Executive Header */}
      <Header
        userName="Piyush Sharma"
        userEmail="piyushwc@gmail.com"
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
        onOpenAgenda={() => setIsAgendaOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
      />

      {/* Main Conversation Stream */}
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        isAudioMuted={isAudioMuted}
        onUndo={handleUndo}
      />

      {/* Workspace Feed Drawer */}
      <AgendaSidebar
        isOpen={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
        events={agendaEvents}
        tasks={agendaTasks}
        onRefresh={loadWorkspaceData}
        onQuickPrompt={handleSendMessage}
      />

      {/* Memory & Context Inspector Modal */}
      <MemoryInspector
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memory={memory}
      />
    </div>
  );
}
