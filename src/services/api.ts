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

export async function fetchAuthStatus(sessionId: string = 'default') {
  const res = await fetch(`/api/auth/status?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) return { authenticated: false, isGuest: false };
  return res.json();
}

export async function loginGuest(sessionId: string = 'default') {
  const res = await fetch('/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Failed to start guest mode');
  return res.json();
}

export async function loginEmail(email: string, password: string, sessionId: string = 'default') {
  const res = await fetch('/api/auth/email-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Failed to login with email');
  }
  return res.json();
}

export async function getGoogleAuthUrl() {
  const res = await fetch('/api/auth/url');
  if (!res.ok) throw new Error('Failed to get auth URL');
  const data = await res.json();
  return data.authUrl || data.url;
}

export async function logoutApi(sessionId: string = 'default') {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Failed to logout');
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

export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch(`/api/calendar/event/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete event' }));
    throw new Error(err.error || 'Failed to delete event');
  }
  return res.json();
}

export async function updateCalendarEvent(eventId: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch(`/api/calendar/event/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update event' }));
    throw new Error(err.error || 'Failed to update event');
  }
  return res.json();
}

export async function updateTask(taskId: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update task' }));
    throw new Error(err.error || 'Failed to update task');
  }
  return res.json();
}

export async function deleteTask(taskId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete task' }));
    throw new Error(err.error || 'Failed to delete task');
  }
  return res.json();
}
