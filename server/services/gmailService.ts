import { searchEmails, summarizeEmail, createDraft } from '../tools/gmailTool';

export async function getRecentEmailsService(sessionId: string = 'default') {
  try {
    const res = await searchEmails('', sessionId);
    return {
      success: res.success,
      data: res.data || [],
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Gmail service unavailable',
    };
  }
}

export async function getMessageService(messageId: string, sessionId: string = 'default') {
  try {
    const res = await summarizeEmail(messageId, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to retrieve email message',
    };
  }
}

export async function sendEmailService(params: { to: string; subject: string; body: string }, sessionId: string = 'default') {
  try {
    const res = await createDraft(params, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to send email',
    };
  }
}
