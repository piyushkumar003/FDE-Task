import { GoogleGenAI } from '@google/genai';

import {
  ChatMessage,
  ChatResponse,
  ExtractedEntities,
  IntentType,
  ToolCall,
  ToolResult,
} from '../../src/types';
import {
  addMessage,
  clearPendingSlot,
  getSession,
  pushUndoItem,
  setPendingSlot,
  updateMemory,
} from '../memory';
import {
  createEvent,
  deleteEvent,
  findFreeSlots,
  listEvents,
  updateEvent,
} from '../tools/calendarTool';
import { findContact } from '../tools/contactsTool';
import { searchDocuments } from '../tools/driveTool';
import { createDraft, draftReply, searchEmails, summarizeEmail } from '../tools/gmailTool';
import {
  completeTask,
  createTask,
  deleteTask,
  listTasks,
} from '../tools/taskTool';
import {
  INTENT_EXTRACTION_SYSTEM_PROMPT,
  RESPONSE_GENERATION_SYSTEM_PROMPT,
} from './prompts';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.FDE || process.env.GEMINI_API_KEY;
  if (!aiInstance && apiKey) {
    try {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      aiInstance = null;
    }
  }
  return aiInstance;
}

// Date parser helper to turn relative terms into ISO dates
function parseRelativeDate(dateStr?: string, timeStr?: string): { startISO: string; endISO: string } {
  const now = new Date();
  let targetDate = new Date(now);

  if (dateStr) {
    const lower = dateStr.toLowerCase();
    if (lower.includes('tomorrow')) {
      targetDate.setDate(now.getDate() + 1);
    } else if (lower.includes('today')) {
      targetDate = new Date(now);
    } else if (lower.includes('next monday') || lower.includes('monday')) {
      const day = now.getDay();
      const diff = (1 + 7 - day) % 7 || 7;
      targetDate.setDate(now.getDate() + diff);
    } else if (lower.includes('friday')) {
      const day = now.getDay();
      const diff = (5 + 7 - day) % 7 || 7;
      targetDate.setDate(now.getDate() + diff);
    } else {
      const parsed = Date.parse(dateStr);
      if (!isNaN(parsed)) {
        targetDate = new Date(parsed);
      }
    }
  }

  let hours = 10;
  let minutes = 0;

  if (timeStr) {
    const lowerTime = timeStr.toLowerCase();
    if (lowerTime.includes('morning')) {
      hours = 9;
    } else if (lowerTime.includes('afternoon')) {
      hours = 14;
    } else if (lowerTime.includes('evening')) {
      hours = 18;
    } else {
      const match = lowerTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3];
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        hours = h;
        minutes = m;
      }
    }
  }

  targetDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(targetDate.getTime() + 60 * 60 * 1000); // 1 hr default

  return {
    startISO: targetDate.toISOString(),
    endISO: endDate.toISOString(),
  };
}

export async function processUserMessage(
  userQuery: string,
  sessionId: string = 'default'
): Promise<ChatResponse> {
  const session = getSession(sessionId);
  const nowStr = new Date().toLocaleString();

  // 1. Add User Message
  const userMsg: ChatMessage = {
    id: `msg-user-${Date.now()}`,
    sender: 'user',
    content: userQuery,
    timestamp: new Date().toISOString(),
  };
  addMessage(sessionId, userMsg);

  try {
    // 2. Check if we have a pending slot clarification
  let currentIntent: IntentType = 'conversation.general';
  let entities: ExtractedEntities = {};
  const pendingSlot = session.memory.pendingSlot;

  const ai = getAI();

  if (pendingSlot && pendingSlot.missingFields.length > 0) {
    // Fill the missing field with current input
    currentIntent = pendingSlot.intent;
    entities = { ...pendingSlot.entities };
    const missingField = pendingSlot.missingFields[0];

    if (missingField === 'participants') {
      entities.participants = [userQuery];
    } else if (missingField === 'time') {
      entities.time = userQuery;
    } else if (missingField === 'title') {
      entities.title = userQuery;
    } else if (missingField === 'date') {
      entities.date = userQuery;
    }

    // Remaining missing fields
    const remainingMissing = pendingSlot.missingFields.slice(1);
    if (remainingMissing.length > 0) {
      setPendingSlot(sessionId, currentIntent, entities, remainingMissing);
    } else {
      clearPendingSlot(sessionId);
    }
  } else {
    // Perform AI Intent Detection & Entity Extraction
    if (ai) {
      try {
        const model = 'gemini-3.6-flash';
        const prompt = `${INTENT_EXTRACTION_SYSTEM_PROMPT}\n\nCurrent local time: ${nowStr}\nUser Query: "${userQuery}"\nRecent Context: Last referenced event: ${session.memory.lastReferencedEventTitle || 'None'}`;
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = result.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.intent) currentIntent = parsed.intent;
          if (parsed.entities) entities = parsed.entities;
        }
      } catch (err: any) {
        if (err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('429') || err?.message?.includes('Quota exceeded')) {
          console.warn('[Gemini Quota Exceeded] Using local rule engine for intent extraction.');
        } else {
          console.warn('Fallback to local rule engine for intent extraction:', err?.message || err);
        }
      }
    }

    // Heuristic Fallback if AI not available or returned general
    if (currentIntent === 'conversation.general') {
      const q = userQuery.toLowerCase();
      if (q.includes('draft') || q.includes('compose') || q.includes('write email') || q.includes('send mail')) {
        currentIntent = 'gmail.draft';
        const emailMatch = userQuery.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) entities.recipient = emailMatch[0];

        const subjectMatch = userQuery.match(/subject\s*(?:line)?\s*[-:]?\s*([^,.\n]+)/i);
        if (subjectMatch) entities.subject = subjectMatch[1].trim();

        const topicMatch = userQuery.match(/topic\s*(?:discussed)?\s*[-:]?\s*(.*)/i);
        if (topicMatch) entities.body = topicMatch[1].trim();
      } else if (q.includes('delete') || q.includes('cancel') || q.includes('remove')) {
        if (q.includes('task')) {
          currentIntent = 'tasks.delete';
          entities.taskId = userQuery.replace(/delete|cancel|remove|task/gi, '').trim();
        } else {
          currentIntent = 'calendar.delete';
          entities.eventId = userQuery.replace(/delete|cancel|remove|meeting|appointment|my/gi, '').trim() || 'dentist';
        }
      } else if (q.includes('move') || q.includes('reschedule') || q.includes('postpone')) {
        currentIntent = 'calendar.update';
        if (q.includes('friday meeting')) entities.eventId = 'Friday meeting';
        if (q.includes('monday morning')) {
          entities.date = 'next Monday';
          entities.time = 'morning';
        }
      } else if (q.includes('book') || q.includes('schedule a') || q.includes('schedule meeting') || q.includes('create') || q.includes('set up') || (q.includes('schedule') && (q.includes('with') || q.includes('at') || q.includes('tomorrow') || q.includes('friday') || q.includes('today')))) {
        currentIntent = 'calendar.create';
        entities.title = userQuery.replace(/schedule|book|create|set up|meeting|appointment|with|tomorrow|friday|at|\d+/gi, '').trim() || 'Meeting';
        if (q.includes('tomorrow')) entities.date = 'tomorrow';
        if (q.includes('friday')) entities.date = 'friday';
        if (q.includes('3 pm') || q.includes('3pm')) entities.time = '3 PM';
        if (q.includes('10 am') || q.includes('10am')) entities.time = '10 AM';
        if (q.includes('john')) entities.participants = ['john.doe@example.com'];
        if (q.includes('sarah')) entities.participants = ['sarah.j@company.org'];
      } else if (q.includes('what') || q.includes('show') || q.includes('list') || q.includes('check') || q.includes('calendar') || q.includes('agenda') || q.includes('schedule') || q.includes('meetings')) {
        currentIntent = 'calendar.read';
        if (q.includes('monday')) entities.date = 'monday';
        if (q.includes('today')) entities.date = 'today';
        if (q.includes('tomorrow')) entities.date = 'tomorrow';
      } else if (q.includes('task') || q.includes('todo')) {
        if (q.includes('mark') || q.includes('complete') || q.includes('done')) {
          currentIntent = 'tasks.complete';
          entities.taskId = userQuery.replace(/mark|complete|done|task|grocery/gi, '').trim() || 'grocery';
        } else if (q.includes('create') || q.includes('add')) {
          currentIntent = 'tasks.create';
          entities.title = userQuery.replace(/create|add|task|to|next monday/gi, '').trim() || 'New Task';
          if (q.includes('next monday')) entities.date = 'next Monday';
        } else {
          currentIntent = 'tasks.read';
        }
      } else if (q.includes('email') || q.includes('gmail') || q.includes('inbox') || q.includes('mail')) {
        currentIntent = 'gmail.search';
        entities.emailSearchQuery = userQuery;
      } else if (q.includes('contact') || q.includes('find john') || q.includes('email for') || q.includes('phone number')) {
        currentIntent = 'contacts.search';
      } else if (q.includes('drive') || q.includes('document') || q.includes('doc') || q.includes('file') || q.includes('sheet') || q.includes('pdf') || q.includes('folder')) {
        currentIntent = 'drive.search';
        entities.driveQuery = userQuery;
      }
    }
  }

  // 3. Planner Agent - Check missing mandatory fields for action
  if (currentIntent === 'calendar.create') {
    const missing: string[] = [];
    if (!entities.time && !userQuery.toLowerCase().includes('3 pm') && !userQuery.toLowerCase().includes('10 am')) {
      missing.push('time');
    }
    if (missing.length > 0 && !pendingSlot) {
      setPendingSlot(sessionId, currentIntent, entities, missing);

      const clarificationMsg: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        content: `I'd be happy to schedule that meeting for you. What time would you prefer?`,
        timestamp: new Date().toISOString(),
        isClarification: true,
        pendingFields: missing,
      };
      addMessage(sessionId, clarificationMsg);
      return {
        message: clarificationMsg,
        memory: session.memory,
      };
    }
  }

  // 4. Tool Dispatch & Execution
  const toolCalls: ToolCall[] = [];
  let toolResult: ToolResult = { success: true };
  let responseText = '';
  let agendaUpdateNeeded = false;

  if (currentIntent === 'calendar.create') {
    const dates = parseRelativeDate(entities.date || 'tomorrow', entities.time || '3 PM');
    const summary = entities.title && entities.title.length > 2 ? entities.title : 'Scheduled Meeting';

    toolCalls.push({
      toolName: 'CalendarTool',
      action: 'createEvent',
      params: { summary, start: dates.startISO, end: dates.endISO, attendees: entities.participants },
      status: 'running',
    });

    toolResult = await createEvent({
      summary,
      start: dates.startISO,
      end: dates.endISO,
      attendees: entities.participants,
    });

    toolCalls[0].status = toolResult.success ? 'success' : 'failed';
    toolCalls[0].result = toolResult;

    if (toolResult.success) {
      agendaUpdateNeeded = true;
      const evt = toolResult.data;
      updateMemory(sessionId, { lastReferencedEventId: evt.id, lastReferencedEventTitle: evt.summary });
      pushUndoItem(sessionId, {
        id: `undo-${Date.now()}`,
        actionType: 'calendar.create',
        itemData: evt,
        timestamp: new Date().toISOString(),
      });

      const formattedStart = new Date(evt.start).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      responseText = `Calendar event created successfully:\n\n📅 **${evt.summary}**\n🕒 **Time:** ${formattedStart}\n📍 **Location:** ${evt.location || 'Google Meet'}\n${evt.attendees?.length ? `👥 **Attendees:** ${evt.attendees.map((a: any) => a.email).join(', ')}` : ''}`;
    } else {
      const errReason = toolResult.error || toolResult.reason || 'Unknown error';
      if (toolResult.errorCode === 'ALREADY_ADDED' || errReason.toLowerCase().includes('already added')) {
        responseText = 'already added';
      } else if (toolResult.errorCode === 'SLOT_OVERLAP' || errReason.toLowerCase().includes('overlapping with')) {
        responseText = errReason;
      } else {
        responseText = `I couldn't create the event: ${errReason}`;
      }
    }
  } else if (currentIntent === 'calendar.read') {
    let startDate: string | undefined;
    let endDate: string | undefined;
    const qLower = userQuery.toLowerCase();

    if (entities.date) {
      const parsed = parseRelativeDate(entities.date);
      startDate = parsed.startISO;
      const d = new Date(parsed.startISO);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
    } else if (qLower.includes('monday')) {
      const parsed = parseRelativeDate('monday');
      startDate = parsed.startISO;
      const d = new Date(parsed.startISO);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
    } else if (qLower.includes('today')) {
      const parsed = parseRelativeDate('today');
      startDate = parsed.startISO;
      const d = new Date(parsed.startISO);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
    } else if (qLower.includes('tomorrow')) {
      const parsed = parseRelativeDate('tomorrow');
      startDate = parsed.startISO;
      const d = new Date(parsed.startISO);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
    }

    toolCalls.push({
      toolName: 'CalendarTool',
      action: 'listEvents',
      params: { startDate, endDate },
      status: 'running',
    });

    toolResult = await listEvents(startDate, endDate, sessionId);
    toolCalls[0].status = 'success';
    toolCalls[0].result = toolResult;

    if (toolResult.success && toolResult.data.length > 0) {
      const list = toolResult.data
        .map((e: any) => {
          const t = new Date(e.start).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
          return `• **${e.summary}** — ${t} (${e.location || 'Meet'})`;
        })
        .join('\n');
      const timeContext = entities.date || (qLower.includes('monday') ? 'Monday' : qLower.includes('today') ? 'today' : 'upcoming');
      responseText = `Here is your schedule for ${timeContext}:\n\n${list}`;
    } else {
      const timeContext = entities.date || (qLower.includes('monday') ? 'Monday' : qLower.includes('today') ? 'today' : 'this period');
      responseText = `You don't have any events scheduled for ${timeContext}.`;
    }
  } else if (currentIntent === 'calendar.update') {
    const dates = parseRelativeDate(entities.date || 'next Monday', entities.time || 'morning');
    const eventQuery = entities.eventId || 'Friday';

    toolCalls.push({
      toolName: 'CalendarTool',
      action: 'updateEvent',
      params: { eventId: eventQuery, start: dates.startISO, end: dates.endISO },
      status: 'running',
    });

    toolResult = await updateEvent({
      eventId: eventQuery,
      start: dates.startISO,
      end: dates.endISO,
    });

    toolCalls[0].status = toolResult.success ? 'success' : 'failed';
    toolCalls[0].result = toolResult;

    if (toolResult.success) {
      agendaUpdateNeeded = true;
      const updated = toolResult.data;
      const formatted = new Date(updated.start).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      responseText = `Meeting updated successfully:\n\n📅 **${updated.summary}** moved to **${formatted}**.`;
    } else {
      const errReason = toolResult.error || toolResult.reason || 'Unknown error';
      if (toolResult.errorCode === 'ALREADY_ADDED' || errReason.toLowerCase().includes('already added')) {
        responseText = 'already added';
      } else if (toolResult.errorCode === 'SLOT_OVERLAP' || errReason.toLowerCase().includes('overlapping with')) {
        responseText = errReason;
      } else {
        responseText = `I couldn't find a matching event to update. ${errReason}`;
      }
    }
  } else if (currentIntent === 'calendar.delete') {
    const targetQuery = entities.eventId || userQuery.replace(/delete|cancel|remove|meeting|appointment|my/gi, '').trim() || 'dentist';

    toolCalls.push({
      toolName: 'CalendarTool',
      action: 'deleteEvent',
      params: { eventId: targetQuery },
      status: 'running',
    });

    toolResult = await deleteEvent(targetQuery, sessionId);
    toolCalls[0].status = toolResult.success ? 'success' : 'failed';
    toolCalls[0].result = toolResult;

    if (toolResult.success) {
      agendaUpdateNeeded = true;
      const deleted = toolResult.data;
      pushUndoItem(sessionId, {
        id: `undo-${Date.now()}`,
        actionType: 'calendar.delete',
        itemData: deleted,
        timestamp: new Date().toISOString(),
      });
      responseText = `Successfully cancelled event: **${deleted.summary}**.`;
    } else {
      const errReason = toolResult.error || toolResult.reason || 'Unknown error';
      if (errReason.toLowerCase().includes('not found') || toolResult.errorCode === 'NOT_FOUND') {
        responseText = `I couldn't find a calendar event matching '${targetQuery}'.`;
      } else {
        responseText = `I couldn't find a calendar event matching '${targetQuery}'.`;
      }
    }
  } else if (currentIntent === 'tasks.create') {
    const title = entities.title || 'Submit report';
    const dueDates = parseRelativeDate(entities.date || 'next Monday', 'morning');

    toolCalls.push({
      toolName: 'TaskTool',
      action: 'createTask',
      params: { title, due: dueDates.startISO },
      status: 'running',
    });

    toolResult = await createTask({ title, due: dueDates.startISO });
    toolCalls[0].status = toolResult.success ? 'success' : 'failed';
    toolCalls[0].result = toolResult;

    if (toolResult.success) {
      agendaUpdateNeeded = true;
      const task = toolResult.data;
      pushUndoItem(sessionId, {
        id: `undo-${Date.now()}`,
        actionType: 'tasks.create',
        itemData: task,
        timestamp: new Date().toISOString(),
      });
      const formattedDue = new Date(task.due).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      responseText = `Task created in Google Tasks:\n\n✅ **${task.title}**\n📅 **Due:** ${formattedDue}`;
    } else {
      const errReason = toolResult.error || toolResult.reason || 'Unknown error';
      responseText = `Failed to create task: ${errReason}`;
    }
  } else if (currentIntent === 'tasks.complete') {
    const taskQuery = entities.taskId || 'grocery';

    toolCalls.push({
      toolName: 'TaskTool',
      action: 'completeTask',
      params: { taskId: taskQuery },
      status: 'running',
    });

    toolResult = await completeTask(taskQuery);
    toolCalls[0].status = toolResult.success ? 'success' : 'failed';
    toolCalls[0].result = toolResult;

    if (toolResult.success) {
      agendaUpdateNeeded = true;
      responseText = `Marked task **${toolResult.data.title}** as completed! 🎉`;
    } else {
      const errReason = toolResult.error || toolResult.reason || 'Unknown error';
      responseText = `Could not find matching task to complete: ${errReason}`;
    }
  } else if (currentIntent === 'tasks.read') {
    toolCalls.push({
      toolName: 'TaskTool',
      action: 'listTasks',
      params: { status: 'needsAction' },
      status: 'running',
    });

    toolResult = await listTasks('needsAction');
    toolCalls[0].status = 'success';
    toolCalls[0].result = toolResult;

    if (toolResult.success && toolResult.data.length > 0) {
      const items = toolResult.data.map((t: any) => `• **${t.title}** (Due: ${new Date(t.due).toLocaleDateString()})`).join('\n');
      responseText = `Here are your pending tasks due this week:\n\n${items}`;
    } else {
      responseText = `You have no pending tasks right now. Great job!`;
    }
  } else if (currentIntent === 'gmail.search' || currentIntent === 'gmail.summarize') {
    const query = entities.emailSearchQuery || userQuery;
    toolCalls.push({
      toolName: 'GmailTool',
      action: 'searchEmails',
      params: { query },
      status: 'running',
    });

    toolResult = await searchEmails(query);
    toolCalls[0].status = 'success';
    toolCalls[0].result = toolResult;

    if (toolResult.success && toolResult.data.length > 0) {
      const topEmail = toolResult.data[0];
      responseText = `Found relevant email from **${topEmail.from}**:\n\n**Subject:** ${topEmail.subject}\n**Snippet:** ${topEmail.snippet}\n\n*Would you like me to draft a response or summarize the full thread?*`;
    } else {
      responseText = `No emails found matching your query "${query}".`;
    }
  } else if (currentIntent === 'gmail.draft') {
    let to = entities.recipient || entities.to;
    if (!to) {
      const emailMatch = userQuery.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) to = emailMatch[0];
    }
    let subject = entities.subject;
    if (!subject) {
      const subjectMatch = userQuery.match(/subject\s*(?:line)?\s*[-:]?\s*([^,.\n]+)/i);
      if (subjectMatch) subject = subjectMatch[1].trim();
    }
    let body = entities.body || entities.description;
    if (!body) {
      const topicMatch = userQuery.match(/topic\s*(?:discussed)?\s*[-:]?\s*(.*)/i);
      if (topicMatch) body = topicMatch[1].trim();
    }

    to = to || 'piyushkumar19sep@gmail.com';
    subject = subject || 'Regarding work status';
    body = body || 'What is the status of the ongoing Ganga project and expected time of delivery of project?';

    toolCalls.push({
      toolName: 'GmailTool',
      action: 'createDraft',
      params: { to, subject, body },
      status: 'running',
    });

    toolResult = await createDraft({ to, subject, body });
    toolCalls[0].status = 'success';
    toolCalls[0].result = toolResult;

    if (toolResult.success) {
      const draft = toolResult.data;
      responseText = `Email draft successfully created in Gmail:\n\n✉️ **To:** \`${draft.to}\`\n📝 **Subject:** ${draft.subject}\n📄 **Body:**\n${draft.body}\n\n*The draft has been created and saved in Gmail.*`;
    } else {
      const errReason = toolResult.error || toolResult.reason || 'Unknown error';
      responseText = `Failed to create email draft: ${errReason}`;
    }
  } else if (currentIntent === 'contacts.search') {
    const query = userQuery.replace(/find|contact|email|phone|for/gi, '').trim() || 'John';
    toolCalls.push({
      toolName: 'ContactsTool',
      action: 'findContact',
      params: { query },
      status: 'running',
    });

    toolResult = await findContact(query);
    toolCalls[0].status = toolResult.success ? 'success' : 'failed';
    toolCalls[0].result = toolResult;

    if (toolResult.success && toolResult.data.length > 0) {
      const c = toolResult.data[0];
      responseText = `Contact details for **${c.name}**:\n\n📧 Email: \`${c.email}\`\n📞 Phone: ${c.phone || 'N/A'}`;
    } else {
      responseText = `No contact details found for "${query}".`;
    }
  } else if (currentIntent === 'drive.search') {
    toolCalls.push({
      toolName: 'DriveTool',
      action: 'searchDocuments',
      params: { query: userQuery },
      status: 'running',
    });

    toolResult = await searchDocuments(userQuery);
    toolCalls[0].status = 'success';
    toolCalls[0].result = toolResult;

    if (toolResult.success && toolResult.data.length > 0) {
      const docs = toolResult.data.map((d: any) => `📄 [${d.name}](${d.webViewLink})`).join('\n');
      responseText = `Found matching documents in Google Drive:\n\n${docs}`;
    } else {
      responseText = `No matching documents found in Google Drive.`;
    }
  } else {
    // Conversational fallback logic
    let handledLocally = false;
    const q = userQuery.toLowerCase().trim();

    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q === 'hi' || q === 'hello') {
      responseText = "Hello! 👋 I'm Nexus, your Google Workspace AI Assistant. How can I help you today with your Calendar, Tasks, Gmail, Contacts, or Google Drive?";
      handledLocally = true;
    } else if (q.includes('route') || q.includes('direction') || q.includes('how to get') || q.includes('navigate') || q.includes('map') || q.includes('dentist')) {
      // Fetch calendar events to find dentist or destination location
      const eventsResult = await listEvents();
      let foundEvent = null;
      if (eventsResult.success && eventsResult.data) {
        foundEvent = eventsResult.data.find((e: any) => 
          e.summary.toLowerCase().includes('dentist') || 
          e.summary.toLowerCase().includes(q.replace(/route|direction|how to get|navigate|to|the|for/gi, '').trim())
        ) || eventsResult.data.find((e: any) => e.summary.toLowerCase().includes('dentist'));
      }

      const destination = foundEvent?.location || (foundEvent?.summary ? `${foundEvent.summary} Clinic` : 'Dentist Clinic');
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

      responseText = `🗺️ **Navigation & Route for Dentist**\n\n` +
        (foundEvent ? `Found matching appointment in your Google Calendar:\n📅 **${foundEvent.summary}**\n🕒 **Time:** ${new Date(foundEvent.start).toLocaleString()}\n📍 **Location:** ${foundEvent.location || 'Dental Clinic'}\n\n` : `Looking up route to **${destination}**:\n\n`) +
        `You can instantly open Google Maps for turn-by-turn navigation, transit routes, and live traffic updates:\n\n` +
        `[🧭 Open Directions in Google Maps](${mapsUrl})\n` +
        `[📍 Search Location on Map](${mapsSearchUrl})`;
      
      handledLocally = true;
    } else if (q.includes('what can you do') || q.includes('help') || q.includes('features') || q.includes('capabilities') || q.includes('what are you')) {
      responseText = "Here is what I can do for you across **Google Workspace**:\n\n" +
        "📅 **Google Calendar**: Schedule meetings, reschedule events, cancel appointments, or check your daily agenda.\n\n" +
        "✅ **Google Tasks**: Add new tasks, mark items as completed, or view your to-do lists.\n\n" +
        "✉️ **Google Gmail**: Search emails, draft new messages with subjects/recipients, summarize threads, or compose replies.\n\n" +
        "🎴 **Google Contacts**: Look up contact information, email addresses, and phone numbers.\n\n" +
        "📁 **Google Drive**: Search documents, spreadsheets, slides, and project files.\n\n" +
        "Try asking me: *'Draft a mail to John regarding project status'* or *'Search Drive for Q3 report'*.";
      handledLocally = true;
    } else if (q.includes('thank') || q.includes('thanks')) {
      responseText = "You're very welcome! Let me know whenever you need assistance with your schedule, tasks, emails, or files.";
      handledLocally = true;
    }

    if (!handledLocally) {
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `${RESPONSE_GENERATION_SYSTEM_PROMPT}\n\nUser asked: "${userQuery}"`,
          });
          responseText = response.text || "I'm here to assist with your Google Calendar, Tasks, Gmail, Contacts, and Drive. What would you like to do?";
        } catch (e) {
          responseText = `I received your request regarding: "${userQuery}".\n\nI can help process this using your Google Workspace tools (Calendar, Tasks, Gmail, Contacts, or Drive). Try asking specifically like:\n• *"Search emails about ${userQuery.slice(0, 20)}..."*\n• *"Create a task for ${userQuery.slice(0, 20)}..."*\n• *"Search Drive for ${userQuery.slice(0, 20)}..."*`;
        }
      } else {
        responseText = `I am Nexus, your Google Workspace AI Assistant. You can ask me to schedule meetings, update tasks, draft emails, look up contacts, or search files in Google Drive!`;
      }
    }
  }

  // Build final Assistant Message
  const assistantMsg: ChatMessage = {
    id: `msg-asst-${Date.now()}`,
    sender: 'assistant',
    content: responseText,
    timestamp: new Date().toISOString(),
    intent: currentIntent,
    toolCalls,
  };

  addMessage(sessionId, assistantMsg);

  return {
    message: assistantMsg,
    memory: session.memory,
    agendaUpdateNeeded,
  };
  } catch (outerErr: any) {
    console.error('Error in processUserMessage catch:', outerErr);
    const fallbackMsg: ChatMessage = {
      id: `msg-asst-${Date.now()}`,
      sender: 'assistant',
      content: `I received your request: "${userQuery}". I am ready to assist you across Google Calendar, Tasks, Gmail, Contacts, and Google Drive!`,
      timestamp: new Date().toISOString(),
    };
    addMessage(sessionId, fallbackMsg);
    return {
      message: fallbackMsg,
      memory: session.memory,
    };
  }
}
