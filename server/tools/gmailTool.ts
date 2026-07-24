import { google } from 'googleapis';
import { GmailMessage, ToolResult } from '../../src/types';
import { getOAuth2Client } from '../auth';
import { getSession } from '../memory';

function getGmailClient(sessionId: string = 'default') {
  const session = getSession(sessionId);
  if (session.isAuthenticated && session.tokens?.access_token) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(session.tokens);
    return google.gmail({ version: 'v1', auth: oauth2Client });
  }
  return null;
}


export async function searchEmails(query: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    if (session.isAuthenticated && !session.tokens?.access_token && !session.isGuest) {
      return {
        success: false,
        error: 'Unable to fetch details from mail, please try again.',
        errorCode: 'GMAIL_UNAUTHENTICATED',
        recoverable: true,
      };
    }
    const gmail = getGmailClient(sessionId);
    if (gmail) {
      try {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query || '',
          maxResults: 10,
        });
        const messages = response.data.messages || [];
        const detailedMessages: GmailMessage[] = [];
        for (const msg of messages) {
          if (!msg.id) continue;
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });
          const headers = details.data.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();
          detailedMessages.push({
            id: msg.id,
            from,
            subject,
            snippet: details.data.snippet || '',
            date,
          });
        }
        return {
          success: true,
          data: detailedMessages,
        };
      } catch (apiError: any) {
        console.error('Gmail API search error:', apiError?.response?.data || apiError);
        return {
          success: false,
          error: 'Unable to fetch details from mail, please try again.',
          errorCode: 'GMAIL_FETCH_FAILED',
          recoverable: true,
        };
      }
    }

    const q = query.toLowerCase().trim();
    const matches = session.mockEmails.filter(
      (m) =>
        !q ||
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
      error: 'Unable to fetch details from mail, please try again.',
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

export async function sendEmail(params: { to: string; subject: string; body: string }, sessionId: string = 'default'): Promise<ToolResult> {
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

    const gmail = getGmailClient(sessionId);
    if (!gmail) {
      if (session.isGuest) {
        return {
          success: false,
          error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
          errorCode: 'GUEST_RESTRICTION',
          recoverable: true,
        };
      }
      return {
        success: false,
        error: 'Unable to send email: Gmail is not connected or Google account tokens are missing. Please log in with Google to send real emails.',
        errorCode: 'GMAIL_UNAUTHENTICATED',
        recoverable: true,
      };
    }

    const utf8Subject = `=?utf-8?B?${Buffer.from(params.subject || 'No Subject').toString('base64')}?=`;
    const messageParts = [
      `To: ${params.to}`,
      `Subject: ${utf8Subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      params.body || '',
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      data: {
        id: res.data.id,
        threadId: res.data.threadId,
        to: params.to,
        subject: params.subject,
        body: params.body,
        sentAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Error sending email via Gmail API:', error?.response?.data || error);
    return {
      success: false,
      error: error?.response?.data?.error?.message || error?.message || 'Failed to send email via Gmail API.',
      errorCode: 'GMAIL_SEND_FAILED',
      recoverable: true,
    };
  }
}

