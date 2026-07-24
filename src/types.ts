/**
 * Nexus AI Personal Assistant - Shared Types & Interfaces
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isAuthenticated: boolean;
}

export type IntentType =
  | 'calendar.create'
  | 'calendar.read'
  | 'calendar.update'
  | 'calendar.delete'
  | 'calendar.free_slots'
  | 'tasks.create'
  | 'tasks.read'
  | 'tasks.update'
  | 'tasks.complete'
  | 'tasks.delete'
  | 'contacts.search'
  | 'gmail.search'
  | 'gmail.summarize'
  | 'gmail.draft'
  | 'gmail.send'
  | 'gmail.read'
  | 'drive.search'
  | 'conversation.clarification'
  | 'conversation.general';

export interface ExtractedEntities {
  date?: string;
  time?: string;
  duration?: string; // e.g. "30 mins", "1 hour"
  title?: string;
  description?: string;
  participants?: string[];
  location?: string;
  eventId?: string;
  taskId?: string;
  emailSearchQuery?: string;
  driveQuery?: string;
  recipient?: string;
  to?: string;
  subject?: string;
  body?: string;
}

export interface ToolCall {
  toolName: string;
  action: string;
  params: Record<string, any>;
  result?: ToolResult;
  status: 'pending' | 'running' | 'success' | 'failed';
}

export interface ToolResult {
  success: boolean;
  data?: any;
  reason?: string;
  error?: string;
  recoverable?: boolean;
  errorCode?: string;
  hiddenEvents?: any[];
  hiddenCounts?: any;
}


export interface MessageAction {
  type: 'undo' | 'confirm' | 'link' | 'view_event' | 'view_task';
  label: string;
  payload: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: IntentType;
  toolCalls?: ToolCall[];
  actions?: MessageAction[];
  isClarification?: boolean;
  pendingFields?: string[];
  audioUrl?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO String or Date
  end: string;
  attendees?: { name?: string; email: string; responseStatus?: string }[];
  htmlLink?: string;
  status?: string;
  recurrence?: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string; // ISO date string
  status: 'needsAction' | 'completed';
  completedDate?: string;
}

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body?: string;
}

export interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface MemoryContext {
  lastReferencedEventId?: string;
  lastReferencedEventTitle?: string;
  lastReferencedTaskId?: string;
  lastReferencedTaskTitle?: string;
  lastReferencedContactEmail?: string;
  recentContacts: ContactItem[];
  pendingSlot?: {
    intent: IntentType;
    entities: ExtractedEntities;
    missingFields: string[];
  };
}

export interface ChatResponse {
  message: ChatMessage;
  memory: MemoryContext;
  agendaUpdateNeeded?: boolean;
}
