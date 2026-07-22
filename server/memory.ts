import { MemoryContext, ChatMessage, ExtractedEntities, IntentType } from '../src/types';

export interface UndoItem {
  id: string;
  actionType: 'calendar.create' | 'calendar.delete' | 'tasks.create' | 'tasks.delete';
  itemData: any;
  timestamp: string;
}

export interface SessionData {
  messages: ChatMessage[];
  memory: MemoryContext;
  undoStack: UndoItem[];
}

const sessions: Map<string, SessionData> = new Map();

const DEFAULT_CONTACTS = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 555-0192' },
  { id: '2', name: 'Sarah Jenkins', email: 'sarah.j@company.org', phone: '+1 555-0148' },
  { id: '3', name: 'Alex Rivera', email: 'arivera@techcorp.io', phone: '+1 555-0831' },
  { id: '4', name: 'Elena Rostova', email: 'elena.rostova@design.co', phone: '+1 555-0922' },
];

export function getSession(sessionId: string = 'default'): SessionData {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [
        {
          id: 'welcome-1',
          sender: 'assistant',
          content: 'Hello! I am Nexus, your Google Workspace AI Assistant. How can I help you today? You can ask me to schedule meetings, manage tasks, check emails, or look up contacts.',
          timestamp: new Date().toISOString(),
        },
      ],
      memory: {
        recentContacts: DEFAULT_CONTACTS,
      },
      undoStack: [],
    });
  }
  return sessions.get(sessionId)!;
}

export function addMessage(sessionId: string, message: ChatMessage): void {
  const session = getSession(sessionId);
  session.messages.push(message);
}

export function updateMemory(sessionId: string, partialMemory: Partial<MemoryContext>): MemoryContext {
  const session = getSession(sessionId);
  session.memory = { ...session.memory, ...partialMemory };
  return session.memory;
}

export function setPendingSlot(
  sessionId: string,
  intent: IntentType,
  entities: ExtractedEntities,
  missingFields: string[]
): void {
  const session = getSession(sessionId);
  session.memory.pendingSlot = { intent, entities, missingFields };
}

export function clearPendingSlot(sessionId: string): void {
  const session = getSession(sessionId);
  session.memory.pendingSlot = undefined;
}

export function pushUndoItem(sessionId: string, undoItem: UndoItem): void {
  const session = getSession(sessionId);
  session.undoStack.push(undoItem);
}

export function popUndoItem(sessionId: string, actionId?: string): UndoItem | undefined {
  const session = getSession(sessionId);
  if (actionId) {
    const index = session.undoStack.findIndex((u) => u.id === actionId);
    if (index !== -1) {
      const [item] = session.undoStack.splice(index, 1);
      return item;
    }
  }
  return session.undoStack.pop();
}
