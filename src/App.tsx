import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AgendaSidebar } from './components/AgendaSidebar';
import { MemoryInspector } from './components/MemoryInspector';
import { LoginScreen } from './components/LoginScreen';
import { ChatMessage, MemoryContext, CalendarEvent, TaskItem } from './types';
import {
  sendMessage,
  fetchAgenda,
  fetchMemory,
  undoLastAction,
  fetchAuthStatus,
  loginGuest,
  loginEmail,
  getGoogleAuthUrl,
  logoutApi,
} from './services/api';

export default function App() {
  const sessionId = 'default';
  const [authState, setAuthState] = useState<{
    checked: boolean;
    authenticated: boolean;
    isGuest: boolean;
    user?: { name: string; email: string; picture?: string };
  }>({
    checked: false,
    authenticated: false,
    isGuest: false,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content:
        'Hello! I am Nexus, your Google Workspace AI Personal Assistant.\n\nI can manage your Google Calendar, Google Tasks, Gmail, Contacts, and Google Drive.\n\nTry asking me to schedule a meeting, move an event, create a task, or show your agenda.',
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

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const status = await fetchAuthStatus(sessionId);
        setAuthState({
          checked: true,
          authenticated: status.authenticated,
          isGuest: status.isGuest,
          user: status.user,
        });
      } catch (err) {
        console.error('Failed to fetch auth status:', err);
        setAuthState({ checked: true, authenticated: false, isGuest: false });
      }
    }
    checkAuth();
  }, []);

  // Load Agenda Feed and Memory on load or when authenticated/guest mode is active
  const loadWorkspaceData = async () => {
    try {
      const feed = await fetchAgenda();
      setAgendaEvents(feed.events);
      setAgendaTasks(feed.tasks);

      const mem = await fetchMemory(sessionId);
      setMemory(mem);
    } catch (err) {
      console.warn('Error loading workspace feed:', err);
    }
  };

  useEffect(() => {
    if (authState.authenticated || authState.isGuest) {
      loadWorkspaceData();
    }
  }, [authState.authenticated, authState.isGuest]);

  const handleGoogleLogin = async () => {
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await loginGuest(sessionId);
      setAuthState({
        checked: true,
        authenticated: res.authenticated,
        isGuest: res.isGuest,
        user: res.user,
      });
      await loadWorkspaceData();
    } catch (err) {
      console.error('Failed to login as guest:', err);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    const res = await loginEmail(email, pass, sessionId);
    setAuthState({
      checked: true,
      authenticated: res.data.authenticated,
      isGuest: res.data.isGuest,
      user: res.data.user,
    });
    await loadWorkspaceData();
  };

  const handleLogout = async () => {
    try {
      await logoutApi(sessionId);
      setAuthState({
        checked: true,
        authenticated: false,
        isGuest: false,
        user: undefined,
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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
      const response = await sendMessage(userText, sessionId);
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

  if (!authState.checked) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Nexus AI Workspace...</span>
        </div>
      </div>
    );
  }

  if (!authState.authenticated && !authState.isGuest) {
    return <LoginScreen onGoogleLogin={handleGoogleLogin} onGuestLogin={handleGuestLogin} onEmailLogin={handleEmailLogin} />;
  }

  return (
    <div id="nexus-app-root" className="flex flex-col h-screen w-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      {/* Executive Header */}
      <Header
        userName={authState.user?.name || (authState.isGuest ? 'Guest User' : 'Workspace User')}
        userEmail={authState.user?.email || (authState.isGuest ? 'guest@nexus.demo' : '')}
        userPicture={authState.user?.picture}
        isGuest={authState.isGuest}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
        onOpenAgenda={() => setIsAgendaOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onLogout={handleLogout}
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
