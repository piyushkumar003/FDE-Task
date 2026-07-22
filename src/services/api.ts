import { ChatResponse, MemoryContext, CalendarEvent, TaskItem } from '../types';

export async function sendMessage(
  content: string,
  sessionId?: string,
  audioBlob?: Blob
): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('content', content);
  if (sessionId) formData.append('sessionId', sessionId);
  if (audioBlob) formData.append('audio', audioBlob, 'speech.wav');

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: audioBlob ? {} : { 'Content-Type': 'application/json' },
    body: audioBlob
      ? formData
      : JSON.stringify({ content, sessionId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Failed to communicate with assistant');
  }

  return res.json();
}

export async function fetchAgenda(): Promise<{ events: CalendarEvent[]; tasks: TaskItem[] }> {
  const res = await fetch('/api/agenda');
  if (!res.ok) {
    throw new Error('Failed to fetch agenda');
  }
  return res.json();
}

export async function fetchMemory(sessionId: string): Promise<MemoryContext> {
  const res = await fetch(`/api/memory?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch memory');
  }
  return res.json();
}

export async function fetchAuthStatus(): Promise<{ authenticated: boolean; user?: any; authUrl?: string }> {
  const res = await fetch('/api/auth/status');
  if (!res.ok) {
    return { authenticated: false };
  }
  return res.json();
}

export async function undoLastAction(actionId: string, payload: any): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/action/undo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId, payload }),
  });
  if (!res.ok) {
    throw new Error('Failed to perform undo operation');
  }
  return res.json();
}
