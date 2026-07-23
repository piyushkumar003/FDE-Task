import { GmailMessage, ToolResult } from '../../src/types';
import { getSession } from '../memory';

export async function searchEmails(query: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    const q = query.toLowerCase().trim();
    const matches = session.mockEmails.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q) ||
        (m.body && m.body.toLowerCase().includes(q))
    );

    return {
      success: true,
      data: matches,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Gmail unavailable. Please check your Gmail connection.',
      errorCode: 'GMAIL_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export async function summarizeEmail(emailId: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    const email = session.mockEmails.find((m) => m.id === emailId || m.subject.toLowerCase().includes(emailId.toLowerCase()));
    if (!email) {
      return { success: false, error: `Email matching "${emailId}" not found.`, errorCode: 'NOT_FOUND', recoverable: true };
    }

    const summary = `**Subject:** ${email.subject}\n**From:** ${email.from}\n**Key Takeaways:**\n- Requesting review or timeline update.\n- Sender: ${email.from.split('@')[0]}\n- Full content snippet: "${email.snippet}"`;

    return {
      success: true,
      data: {
        emailId: email.id,
        summary,
        rawEmail: email,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Gmail unavailable. Please check your Gmail connection.',
      errorCode: 'GMAIL_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export async function createDraft(params: { to?: string; subject?: string; body?: string }, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    if (session.isGuest) {
      return {
        success: false,
        error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
        errorCode: 'GUEST_RESTRICTION',
        recoverable: true,
      };
    }

    const draft = {
      id: `draft-${Date.now()}`,
      to: params.to || 'recipient@example.com',
      subject: params.subject || 'No Subject',
      body: params.body || '',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: draft,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Gmail unavailable. Please check your Gmail connection.',
      errorCode: 'GMAIL_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export async function draftReply(params: { emailId: string; body: string }, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    if (session.isGuest) {
      return {
        success: false,
        error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
        errorCode: 'GUEST_RESTRICTION',
        recoverable: true,
      };
    }

    const email = session.mockEmails.find((m) => m.id === params.emailId || m.subject.toLowerCase().includes(params.emailId.toLowerCase()));
    if (!email) {
      return { success: false, error: `Email "${params.emailId}" not found to draft reply.`, errorCode: 'NOT_FOUND', recoverable: true };
    }

    const draft = {
      id: `draft-${Date.now()}`,
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: params.body,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: draft,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Gmail unavailable. Please check your Gmail connection.',
      errorCode: 'GMAIL_UNAVAILABLE',
      recoverable: true,
    };
  }
}

