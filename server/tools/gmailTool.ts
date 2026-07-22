import { GmailMessage, ToolResult } from '../../src/types';

let mockEmails: GmailMessage[] = [
  {
    id: 'msg-1',
    subject: 'Q3 Product Strategy Sync & Agenda Preparation',
    from: 'sarah.j@company.org',
    date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    snippet: 'Hi Piyush, please review the attached slide deck before our meeting tomorrow. Let me know if you need to adjust the time.',
    body: `Hi Piyush,

Please review the attached slide deck before our Executive Sync tomorrow at 3 PM. We need to finalize our AI architecture roadmap and review budget allocations.

Let me know if you'd like me to invite Alex or adjust the slot.

Best regards,
Sarah`,
  },
  {
    id: 'msg-2',
    subject: 'Report Submission Deadline Extension Request',
    from: 'john.doe@example.com',
    date: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    snippet: 'Hi Nexus team, requesting a 2-day grace period for the engineering audit report.',
    body: `Hi Piyush,

We are putting the final touches on the security and performance audit report. Could we submit it on Monday morning instead of Friday afternoon?

Thanks,
John`,
  },
];

export async function searchEmails(query: string): Promise<ToolResult> {
  try {
    const q = query.toLowerCase().trim();
    const matches = mockEmails.filter(
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
      reason: error?.message || 'Failed to search emails',
      recoverable: true,
    };
  }
}

export async function summarizeEmail(emailId: string): Promise<ToolResult> {
  try {
    const email = mockEmails.find((m) => m.id === emailId || m.subject.toLowerCase().includes(emailId.toLowerCase()));
    if (!email) {
      return { success: false, reason: `Email matching "${emailId}" not found.`, recoverable: true };
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
      reason: error?.message || 'Failed to summarize email',
      recoverable: true,
    };
  }
}

export async function createDraft(params: { to?: string; subject?: string; body?: string }): Promise<ToolResult> {
  try {
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
      reason: error?.message || 'Failed to create email draft',
      recoverable: true,
    };
  }
}

export async function draftReply(params: { emailId: string; body: string }): Promise<ToolResult> {
  try {
    const email = mockEmails.find((m) => m.id === params.emailId || m.subject.toLowerCase().includes(params.emailId.toLowerCase()));
    if (!email) {
      return { success: false, reason: `Email "${params.emailId}" not found to draft reply.`, recoverable: true };
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
      reason: error?.message || 'Failed to create draft reply',
      recoverable: true,
    };
  }
}
