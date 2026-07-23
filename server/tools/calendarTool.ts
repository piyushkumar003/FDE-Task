import { google } from 'googleapis';
import { CalendarEvent, ToolResult } from '../../src/types';
import { getOAuth2Client } from '../auth';
import { getSession } from '../memory';

export interface CreateEventInput {
  summary: string;
  start: string;
  end?: string;
  description?: string;
  location?: string;
  attendees?: string[] | { email: string; name?: string }[];
  recurrence?: string[] | string;
}

export interface UpdateEventInput {
  eventId?: string;
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  attendees?: string[] | { email: string; name?: string }[];
  recurrence?: string[] | string;
}

export interface DeleteEventInput {
  eventId?: string;
  id?: string;
}

// Helper to get Google Calendar API client if user OAuth tokens exist in session
function getCalendarClient(sessionId: string = 'default') {
  const session = getSession(sessionId);
  if (session.isAuthenticated && session.tokens?.access_token) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(session.tokens);
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }
  return null;
}

// Helper to format Google API error
function handleGoogleApiError(error: any): { error: string; recoverable: boolean; errorCode: string } {
  const status = error?.status || error?.code || error?.response?.status;
  const message = error?.message || error?.response?.data?.error?.message || 'Google Calendar API request failed';

  if (status === 403 || message.includes('insufficientPermissions') || message.includes('scope')) {
    return {
      error: 'Permission denied. Please re-authenticate with required Google scopes.',
      recoverable: false,
      errorCode: 'PERMISSION_DENIED',
    };
  }

  if (status === 401 || message.includes('invalid_grant') || message.includes('Unauthorized')) {
    return {
      error: 'Authentication expired. Please log in with Google again.',
      recoverable: true,
      errorCode: 'AUTHENTICATION_EXPIRED',
    };
  }

  if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota exceeded')) {
    return {
      error: 'API quota exceeded. Please try again later.',
      recoverable: true,
      errorCode: 'API_QUOTA_EXCEEDED',
    };
  }

  if (status === 404) {
    return {
      error: 'The specified calendar event was not found on Google Calendar.',
      recoverable: true,
      errorCode: 'NOT_FOUND',
    };
  }

  return {
    error: `Calendar unavailable: ${message}`,
    recoverable: true,
    errorCode: 'CALENDAR_UNAVAILABLE',
  };
}

// Map Google API event item to standard internal CalendarEvent interface
function mapGoogleEvent(item: any): CalendarEvent {
  return {
    id: item.id || `evt-${Date.now()}`,
    summary: item.summary || 'Untitled Event',
    description: item.description || '',
    location: item.location || '',
    start: item.start?.dateTime || item.start?.date || new Date().toISOString(),
    end: item.end?.dateTime || item.end?.date || new Date().toISOString(),
    attendees: item.attendees?.map((a: any) => ({
      name: a.displayName || a.email || 'Attendee',
      email: a.email || '',
      responseStatus: a.responseStatus || 'needsAction',
    })),
    htmlLink: item.htmlLink || `https://calendar.google.com/calendar/event?eid=${item.id}`,
    status: item.status || 'confirmed',
    recurrence: item.recurrence || undefined,
  };
}

/**
 * list_events: Retrieves events from Google Calendar or session mock store
 */
export async function list_events(startDate?: string, endDate?: string, sessionId: string = 'default'): Promise<ToolResult> {
  const session = getSession(sessionId);

  // Input Validation
  let startMs: number | null = null;
  let endMs: number | null = null;

  if (startDate) {
    startMs = new Date(startDate).getTime();
    if (isNaN(startMs)) {
      return {
        success: false,
        error: `Validation Error: Invalid startDate format "${startDate}". Expected ISO 8601 or parseable date.`,
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }
  }

  if (endDate) {
    endMs = new Date(endDate).getTime();
    if (isNaN(endMs)) {
      return {
        success: false,
        error: `Validation Error: Invalid endDate format "${endDate}". Expected ISO 8601 or parseable date.`,
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }
  }

  if (startMs !== null && endMs !== null && startMs > endMs) {
    return {
      success: false,
      error: `Validation Error: startDate (${startDate}) cannot be after endDate (${endDate}).`,
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  // Live Google Calendar API Call if authenticated
  if (session.isAuthenticated) {
    if (!session.tokens?.access_token) {
      return {
        success: false,
        error: 'Authentication expired. Please log in with Google again.',
        errorCode: 'AUTHENTICATION_EXPIRED',
        recoverable: true,
      };
    }

    const calendar = getCalendarClient(sessionId);
    if (calendar) {
      try {
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: startDate ? new Date(startDate).toISOString() : undefined,
          timeMax: endDate ? new Date(endDate).toISOString() : undefined,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = (response.data.items || []).map(mapGoogleEvent);
        return {
          success: true,
          data: events,
        };
      } catch (error: any) {
        const errRes = handleGoogleApiError(error);
        return {
          success: false,
          error: errRes.error,
          recoverable: errRes.recoverable,
          errorCode: errRes.errorCode,
        };
      }
    }
  }

  // Fallback to session mock store (Guest Mode or Demo)
  try {
    let filtered = [...session.mockEvents];
    if (startMs !== null) {
      filtered = filtered.filter((e) => new Date(e.start).getTime() >= startMs! - 24 * 3600 * 1000);
    }
    if (endMs !== null) {
      filtered = filtered.filter((e) => new Date(e.start).getTime() <= endMs! + 24 * 3600 * 1000);
    }

    filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return {
      success: true,
      data: filtered,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Calendar unavailable. Please check your Google Calendar connection.',
      errorCode: 'CALENDAR_UNAVAILABLE',
      recoverable: true,
    };
  }
}


/**
 * Helper to check if a proposed time slot overlaps with any existing booked event.
 * Returns whether there is an overlap, if the task is the same, and the overlapping event object.
 */
export function checkEventOverlap(
  newStart: Date,
  newEnd: Date,
  newSummary: string,
  existingEvents: CalendarEvent[],
  excludeEventId?: string
): { hasOverlap: boolean; isSameTask: boolean; overlappingEvent?: CalendarEvent } {
  const reqStart = newStart.getTime();
  const reqEnd = newEnd.getTime();
  const normNew = newSummary.trim().toLowerCase();

  for (const existing of existingEvents) {
    if (existing.status === 'cancelled') continue;
    if (
      excludeEventId &&
      (existing.id === excludeEventId || existing.summary.toLowerCase().includes(excludeEventId.toLowerCase()))
    ) {
      continue;
    }

    const eStart = new Date(existing.start).getTime();
    const eEnd = new Date(existing.end).getTime();

    // Overlap condition: proposed start < existing end AND proposed end > existing start
    if (reqStart < eEnd && reqEnd > eStart) {
      const normExist = existing.summary.trim().toLowerCase();

      // Check if task is same (exact or substring match)
      const isSameTask =
        normNew === normExist ||
        (normNew.length > 2 && normExist.includes(normNew)) ||
        (normExist.length > 2 && normNew.includes(normExist));

      return {
        hasOverlap: true,
        isSameTask,
        overlappingEvent: existing,
      };
    }
  }

  return { hasOverlap: false, isSameTask: false };
}

/**
 * create_event: Creates an event on Google Calendar or managed store with robust input validation
 */
export async function create_event(params: CreateEventInput, sessionId: string = 'default'): Promise<ToolResult> {
  const session = getSession(sessionId);
  if (session.isGuest) {
    return {
      success: false,
      error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
      errorCode: 'GUEST_RESTRICTION',
      recoverable: true,
    };
  }

  // Input Validation
  if (!params || typeof params !== 'object') {
    return {
      success: false,
      error: 'Validation Error: Event parameter payload must be an object.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  if (!params.summary || typeof params.summary !== 'string' || !params.summary.trim()) {
    return {
      success: false,
      error: 'Validation Error: Event summary (title) is required and cannot be empty.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  if (!params.start || typeof params.start !== 'string') {
    return {
      success: false,
      error: 'Validation Error: Event start time string is required.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  const startDate = new Date(params.start);
  if (isNaN(startDate.getTime())) {
    return {
      success: false,
      error: `Validation Error: Invalid start date format "${params.start}".`,
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  let endDate: Date;
  if (params.end) {
    endDate = new Date(params.end);
    if (isNaN(endDate.getTime())) {
      return {
        success: false,
        error: `Validation Error: Invalid end date format "${params.end}".`,
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }
    if (endDate.getTime() < startDate.getTime()) {
      return {
        success: false,
        error: 'Validation Error: Event end time cannot be before start time.',
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }
  } else {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default
  }

  // Check overlap with existing events
  const overlapCheck = checkEventOverlap(startDate, endDate, params.summary, session.mockEvents);
  if (overlapCheck.hasOverlap) {
    const existingEvt = overlapCheck.overlappingEvent!;
    if (overlapCheck.isSameTask) {
      return {
        success: false,
        error: 'already added',
        recoverable: true,
        errorCode: 'ALREADY_ADDED',
        data: existingEvt,
      };
    } else {
      return {
        success: false,
        error: `overlapping with ${existingEvt.summary}`,
        recoverable: true,
        errorCode: 'SLOT_OVERLAP',
        data: existingEvt,
      };
    }
  }

  // Normalize attendees
  const attendeeEmails: string[] = [];
  if (Array.isArray(params.attendees)) {
    for (const att of params.attendees) {
      if (typeof att === 'string' && att.includes('@')) {
        attendeeEmails.push(att.trim());
      } else if (typeof att === 'object' && att && att.email) {
        attendeeEmails.push(att.email.trim());
      }
    }
  }

  // Normalize recurrence rules (e.g. RRULE:FREQ=WEEKLY)
  let recurrenceArray: string[] | undefined = undefined;
  if (params.recurrence) {
    if (Array.isArray(params.recurrence)) {
      recurrenceArray = params.recurrence.map((r) => (r.startsWith('RRULE:') ? r : `RRULE:${r}`));
    } else if (typeof params.recurrence === 'string') {
      const recStr = params.recurrence.trim();
      recurrenceArray = [recStr.startsWith('RRULE:') ? recStr : `RRULE:${recStr}`];
    }
  }

  // Live Google Calendar API Call if authenticated
  if (session.isAuthenticated) {
    if (!session.tokens?.access_token) {
      return {
        success: false,
        error: 'Authentication expired. Please log in with Google again.',
        errorCode: 'AUTHENTICATION_EXPIRED',
        recoverable: true,
      };
    }

    const calendar = getCalendarClient(sessionId);
    if (calendar) {
      try {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: params.summary.trim(),
            description: params.description || '',
            location: params.location || '',
            start: { dateTime: startDate.toISOString() },
            end: { dateTime: endDate.toISOString() },
            attendees: attendeeEmails.map((email) => ({ email })),
            recurrence: recurrenceArray,
          },
        });

        return {
          success: true,
          data: mapGoogleEvent(response.data),
        };
      } catch (error: any) {
        const errRes = handleGoogleApiError(error);
        return {
          success: false,
          error: errRes.error,
          recoverable: errRes.recoverable,
          errorCode: errRes.errorCode,
        };
      }
    }
  }

  // Mock Store Fallback
  try {
    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      summary: params.summary.trim(),
      description: params.description || '',
      location: params.location || 'Google Meet',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      attendees: attendeeEmails.map((email) => ({
        name: email.split('@')[0],
        email,
        responseStatus: 'needsAction',
      })),
      htmlLink: `https://calendar.google.com/calendar/event?eid=${Date.now()}`,
      status: 'confirmed',
      recurrence: recurrenceArray,
    };

    session.mockEvents.push(newEvent);

    return {
      success: true,
      data: newEvent,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Calendar unavailable. Please check your Google Calendar connection.',
      errorCode: 'CALENDAR_UNAVAILABLE',
      recoverable: true,
    };
  }
}


/**
 * update_event: Updates an event on Google Calendar or managed store with parameter validation
 */
export async function update_event(params: UpdateEventInput, sessionId: string = 'default'): Promise<ToolResult> {
  const session = getSession(sessionId);
  if (session.isGuest) {
    return {
      success: false,
      error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
      errorCode: 'GUEST_RESTRICTION',
      recoverable: true,
    };
  }

  if (!params || typeof params !== 'object') {
    return {
      success: false,
      error: 'Validation Error: Event update payload must be an object.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  const eventId = params.eventId || params.id;
  if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
    return {
      success: false,
      error: 'Validation Error: "eventId" string is required to perform an event update.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  if (
    !params.summary &&
    !params.description &&
    !params.location &&
    !params.start &&
    !params.end &&
    !params.attendees
  ) {
    return {
      success: false,
      error: 'Validation Error: At least one field (summary, start, end, location, description, attendees) must be provided for update.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  let startDate: Date | undefined;
  if (params.start) {
    startDate = new Date(params.start);
    if (isNaN(startDate.getTime())) {
      return {
        success: false,
        error: `Validation Error: Invalid start date format "${params.start}".`,
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }
  }

  let endDate: Date | undefined;
  if (params.end) {
    endDate = new Date(params.end);
    if (isNaN(endDate.getTime())) {
      return {
        success: false,
        error: `Validation Error: Invalid end date format "${params.end}".`,
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }
  }

  if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
    return {
      success: false,
      error: 'Validation Error: Event end time cannot be before start time.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  // Live Google Calendar API Patch Call if authenticated
  if (session.isAuthenticated) {
    if (!session.tokens?.access_token) {
      return {
        success: false,
        error: 'Authentication expired. Please log in with Google again.',
        errorCode: 'AUTHENTICATION_EXPIRED',
        recoverable: true,
      };
    }

    const calendar = getCalendarClient(sessionId);
    if (calendar) {
      try {
        const patchBody: any = {};
        if (params.summary) patchBody.summary = params.summary.trim();
        if (params.description !== undefined) patchBody.description = params.description;
        if (params.location !== undefined) patchBody.location = params.location;
        if (startDate) patchBody.start = { dateTime: startDate.toISOString() };
        if (endDate) patchBody.end = { dateTime: endDate.toISOString() };

        if (Array.isArray(params.attendees)) {
          patchBody.attendees = params.attendees.map((att) =>
            typeof att === 'string' ? { email: att } : { email: att.email }
          );
        }

        const response = await calendar.events.patch({
          calendarId: 'primary',
          eventId: eventId.trim(),
          requestBody: patchBody,
        });

        return {
          success: true,
          data: mapGoogleEvent(response.data),
        };
      } catch (error: any) {
        const errRes = handleGoogleApiError(error);
        return {
          success: false,
          error: errRes.error,
          recoverable: errRes.recoverable,
          errorCode: errRes.errorCode,
        };
      }
    }
  }

  // Mock Store Fallback
  try {
    let index = session.mockEvents.findIndex(
      (e) => e.id === eventId || e.summary.toLowerCase().includes(eventId.toLowerCase())
    );

    if (index === -1 && session.mockEvents.length > 0) {
      index = 0; // Fallback to first event for natural language queries in demo mode
    }

    if (index === -1) {
      return {
        success: false,
        error: `Calendar event "${eventId}" was not found.`,
        recoverable: true,
        errorCode: 'NOT_FOUND',
      };
    }

    const existing = session.mockEvents[index];
    const updatedStart = startDate ? startDate.toISOString() : existing.start;
    const updatedEnd = endDate
      ? endDate.toISOString()
      : startDate
      ? new Date(startDate.getTime() + 60 * 60 * 1000).toISOString()
      : existing.end;
    const updatedSummary = params.summary ? params.summary.trim() : existing.summary;

    if (startDate || endDate) {
      const overlapCheck = checkEventOverlap(
        new Date(updatedStart),
        new Date(updatedEnd),
        updatedSummary,
        session.mockEvents,
        existing.id
      );
      if (overlapCheck.hasOverlap) {
        const ovEvt = overlapCheck.overlappingEvent!;
        if (overlapCheck.isSameTask) {
          return {
            success: false,
            error: 'already added',
            recoverable: true,
            errorCode: 'ALREADY_ADDED',
            data: ovEvt,
          };
        } else {
          return {
            success: false,
            error: `overlapping with ${ovEvt.summary}`,
            recoverable: true,
            errorCode: 'SLOT_OVERLAP',
            data: ovEvt,
          };
        }
      }
    }

    const updated: CalendarEvent = {
      ...existing,
      summary: params.summary ? params.summary.trim() : existing.summary,
      description: params.description !== undefined ? params.description : existing.description,
      location: params.location !== undefined ? params.location : existing.location,
      start: updatedStart,
      end: updatedEnd,
      attendees: params.attendees
        ? params.attendees.map((att) => {
            const email = typeof att === 'string' ? att : att.email;
            return { name: email.split('@')[0], email, responseStatus: 'needsAction' };
          })
        : existing.attendees,
    };

    session.mockEvents[index] = updated;

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Calendar unavailable. Please check your Google Calendar connection.',
      errorCode: 'CALENDAR_UNAVAILABLE',
      recoverable: true,
    };
  }
}

/**
 * delete_event: Deletes an event on Google Calendar or managed store with validation
 */
export async function delete_event(input: DeleteEventInput | string, sessionId: string = 'default'): Promise<ToolResult> {
  const session = getSession(sessionId);
  if (session.isGuest) {
    return {
      success: false,
      error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
      errorCode: 'GUEST_RESTRICTION',
      recoverable: true,
    };
  }

  const eventId = typeof input === 'string' ? input : input?.eventId || input?.id;

  if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
    return {
      success: false,
      error: 'Validation Error: Event ID string is required for deletion.',
      recoverable: true,
      errorCode: 'INVALID_INPUT',
    };
  }

  const cleanId = eventId.trim();

  // Live Google Calendar API Delete Call if authenticated
  if (session.isAuthenticated) {
    if (!session.tokens?.access_token) {
      return {
        success: false,
        error: 'Authentication expired. Please log in with Google again.',
        errorCode: 'AUTHENTICATION_EXPIRED',
        recoverable: true,
      };
    }

    const calendar = getCalendarClient(sessionId);
    if (calendar) {
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: cleanId,
        });

        return {
          success: true,
          data: { id: cleanId, status: 'deleted' },
        };
      } catch (error: any) {
        const errRes = handleGoogleApiError(error);
        return {
          success: false,
          error: errRes.error,
          recoverable: errRes.recoverable,
          errorCode: errRes.errorCode,
        };
      }
    }
  }

  // Mock Store Fallback
  try {
    const index = session.mockEvents.findIndex(
      (e) => e.id === cleanId || e.summary.toLowerCase().includes(cleanId.toLowerCase())
    );

    if (index === -1) {
      return {
        success: false,
        error: `Event "${cleanId}" not found to delete.`,
        recoverable: true,
        errorCode: 'NOT_FOUND',
      };
    }

    const [deleted] = session.mockEvents.splice(index, 1);

    return {
      success: true,
      data: deleted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Calendar unavailable. Please check your Google Calendar connection.',
      errorCode: 'CALENDAR_UNAVAILABLE',
      recoverable: true,
    };
  }
}


/**
 * findFreeSlots: Utility for checking calendar availability
 */
export async function findFreeSlots(date: string, durationMinutes: number = 60, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return {
        success: false,
        error: `Validation Error: Invalid date format "${date}".`,
        recoverable: true,
        errorCode: 'INVALID_INPUT',
      };
    }

    const slots = [];
    for (let h = 9; h <= 16; h++) {
      const slotStart = new Date(targetDate);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      const hasConflict = session.mockEvents.some((e) => {
        const eStart = new Date(e.start).getTime();
        const eEnd = new Date(e.end).getTime();
        return slotStart.getTime() < eEnd && slotEnd.getTime() > eStart;
      });

      if (!hasConflict) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          formattedTime: `${slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });
      }
    }

    return {
      success: true,
      data: slots,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Calendar unavailable. Please check your Google Calendar connection.',
      errorCode: 'CALENDAR_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export function restoreDeletedEvent(event: CalendarEvent, sessionId: string = 'default'): void {
  const session = getSession(sessionId);
  if (event && !session.mockEvents.some((e) => e.id === event.id)) {
    session.mockEvents.push(event);
  }
}


// Aliases for camelCase method calls
export const listEvents = list_events;
export const createEvent = create_event;
export const updateEvent = update_event;
export const deleteEvent = delete_event;
