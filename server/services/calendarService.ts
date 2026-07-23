import { list_events, create_event, update_event, delete_event } from '../tools/calendarTool';

export async function getTodayEventsService(sessionId: string = 'default') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await list_events(today, today, sessionId);
    return {
      success: res.success,
      data: res.data || [],
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Calendar service unavailable',
    };
  }
}

export async function listEventsService(startDate?: string, endDate?: string, sessionId: string = 'default') {
  try {
    const res = await list_events(startDate, endDate, sessionId);
    return {
      success: res.success,
      data: res.data || [],
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Calendar service unavailable',
    };
  }
}

export async function createEventService(params: any, sessionId: string = 'default') {
  try {
    const res = await create_event(params, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to create calendar event',
    };
  }
}

export async function updateEventService(params: any, sessionId: string = 'default') {
  try {
    const res = await update_event(params, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to update calendar event',
    };
  }
}

export async function deleteEventService(eventId: string, sessionId: string = 'default') {
  try {
    const res = await delete_event(eventId, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to delete calendar event',
    };
  }
}
