import { MemoryContext, ChatMessage, ExtractedEntities, IntentType, CalendarEvent, TaskItem, GmailMessage, DriveDocument, ContactItem } from '../src/types';

export interface UndoItem {
  id: string;
  actionType: 'calendar.create' | 'calendar.delete' | 'tasks.create' | 'tasks.delete';
  itemData: any;
  timestamp: string;
}

export interface SessionData {
  sessionId: string;
  isGuest: boolean;
  isAuthenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  tokens?: any;
  messages: ChatMessage[];
  memory: MemoryContext;
  undoStack: UndoItem[];
  mockEvents: CalendarEvent[];
  mockTasks: TaskItem[];
  mockEmails: GmailMessage[];
  mockDocs: DriveDocument[];
  mockContacts: ContactItem[];
}

const sessions: Map<string, SessionData> = new Map();

const DEFAULT_CONTACTS: ContactItem[] = [
  { id: 'c-1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 555-0192', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 'c-2', name: 'Sarah Jenkins', email: 'sarah.j@company.org', phone: '+1 555-0148', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'c-3', name: 'Alex Rivera', email: 'arivera@techcorp.io', phone: '+1 555-0831', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { id: 'c-4', name: 'Elena Rostova', email: 'elena.rostova@design.co', phone: '+1 555-0922', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
];

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-101',
    summary: 'Executive Team Sync',
    description: 'Weekly alignment on Q3 deliverables and AI roadmap',
    location: 'Conference Room Alpha / Google Meet',
    start: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    end: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    attendees: [
      { name: 'Sarah Jenkins', email: 'sarah.j@company.org', responseStatus: 'accepted' },
      { name: 'Alex Rivera', email: 'arivera@techcorp.io', responseStatus: 'accepted' },
    ],
    htmlLink: 'https://calendar.google.com/calendar/event?eid=evt101',
    status: 'confirmed',
  },
  {
    id: 'evt-102',
    summary: 'Product Architecture Review',
    description: 'Reviewing agentic workflow design and FastAPI microservice layer',
    location: 'Virtual / Meet',
    start: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    end: new Date(Date.now() + 27 * 3600 * 1000).toISOString(),
    attendees: [
      { name: 'John Doe', email: 'john.doe@example.com', responseStatus: 'needsAction' },
      { name: 'Elena Rostova', email: 'elena.rostova@design.co', responseStatus: 'accepted' },
    ],
    htmlLink: 'https://calendar.google.com/calendar/event?eid=evt102',
    status: 'confirmed',
  },
  {
    id: 'evt-103',
    summary: 'Dentist Appointment',
    description: 'Routine checkup and cleaning with Dr. Smith',
    location: 'Downtown Dental Clinic, 450 Market St',
    start: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    end: new Date(Date.now() + 73 * 3600 * 1000).toISOString(),
    htmlLink: 'https://calendar.google.com/calendar/event?eid=evt103',
    status: 'confirmed',
  },
];

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task-101',
    title: 'Submit quarterly engineering report',
    notes: 'Include architecture diagrams for Gemini agentic workflow and FastAPI routes',
    due: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task-102',
    title: 'Buy groceries for weekly meal prep',
    notes: 'Organic spinach, almond milk, coffee beans, salmon fillets',
    due: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task-103',
    title: 'Review pull request #402 for Google OAuth refactor',
    notes: 'Check scope handling and token auto-refresh strategy',
    due: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'completed',
    completedDate: new Date().toISOString(),
  },
];

const DEFAULT_EMAILS: GmailMessage[] = [
  {
    id: 'msg-1',
    subject: 'Q3 Product Strategy Sync & Agenda Preparation',
    from: 'sarah.j@company.org',
    date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    snippet: 'Hi, please review the attached slide deck before our meeting tomorrow. Let me know if you need to adjust the time.',
    body: `Hi,\n\nPlease review the attached slide deck before our Executive Sync tomorrow at 3 PM. We need to finalize our AI architecture roadmap and review budget allocations.\n\nLet me know if you'd like me to invite Alex or adjust the slot.\n\nBest regards,\nSarah`,
  },
  {
    id: 'msg-2',
    subject: 'Report Submission Deadline Extension Request',
    from: 'john.doe@example.com',
    date: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    snippet: 'Hi team, requesting a 2-day grace period for the engineering audit report.',
    body: `Hi,\n\nWe are putting the final touches on the security and performance audit report. Could we submit it on Monday morning instead of Friday afternoon?\n\nThanks,\nJohn`,
  },
];

const DEFAULT_DOCS: DriveDocument[] = [
  {
    id: 'doc-1',
    name: 'Q3 Product Strategy Roadmap.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    modifiedTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    webViewLink: 'https://docs.google.com/document/d/doc-1/edit',
  },
  {
    id: 'doc-2',
    name: 'AI Personal Assistant Architecture Specification.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    modifiedTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    webViewLink: 'https://docs.google.com/document/d/doc-2/edit',
  },
  {
    id: 'doc-3',
    name: 'Q3 Financial Budget Allocations.gsheet',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    modifiedTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    webViewLink: 'https://docs.google.com/spreadsheets/d/doc-3/edit',
  },
];

export function getSession(sessionId: string = 'default'): SessionData {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      isGuest: false,
      isAuthenticated: false,
      messages: [
        {
          id: 'welcome-1',
          sender: 'assistant',
          content: 'Hello! I am Nexus, your Google Workspace AI Assistant. How can I help you today?',
          timestamp: new Date().toISOString(),
        },
      ],
      memory: {
        recentContacts: DEFAULT_CONTACTS,
      },
      undoStack: [],
      mockEvents: [...DEFAULT_EVENTS],
      mockTasks: [...DEFAULT_TASKS],
      mockEmails: [...DEFAULT_EMAILS],
      mockDocs: [...DEFAULT_DOCS],
      mockContacts: [...DEFAULT_CONTACTS],
    });
  }
  return sessions.get(sessionId)!;
}

export function setSessionGuestMode(sessionId: string, isGuest: boolean): SessionData {
  const session = getSession(sessionId);
  session.isGuest = isGuest;
  session.isAuthenticated = false;
  session.user = {
    id: 'guest-user',
    name: 'Guest User',
    email: 'guest@demo.local',
    picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
  };
  session.messages = [
    {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      content: 'Welcome to **Nexus AI Workspace Console (Demo Mode)**! You are exploring in Guest Mode with sample demo data. Modifications to Google Workspace are simulated locally.',
      timestamp: new Date().toISOString(),
    },
  ];
  return session;
}

export function setSessionAuthenticated(sessionId: string, user: { id: string; name: string; email: string; picture?: string }, tokens: any): SessionData {
  const session = getSession(sessionId);
  session.isGuest = false;
  session.isAuthenticated = true;
  session.user = user;
  session.tokens = tokens;
  session.messages = [
    {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      content: `Hello ${user.name}! I am Nexus, your Google Workspace AI Assistant connected to your live Google account (${user.email}). How can I assist you today?`,
      timestamp: new Date().toISOString(),
    },
  ];
  return session;
}

export function logoutSession(sessionId: string): SessionData {
  const session = getSession(sessionId);
  session.isAuthenticated = false;
  session.isGuest = false;
  session.user = undefined;
  session.tokens = undefined;
  return session;
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
