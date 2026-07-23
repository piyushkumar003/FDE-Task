import { ContactItem, ToolResult } from '../../src/types';
import { getSession } from '../memory';

export async function findContact(query: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    const q = query.toLowerCase().trim();
    const matches = session.mockContacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      return {
        success: false,
        error: `No contact matching "${query}" found in Google Contacts.`,
        errorCode: 'NOT_FOUND',
        data: [],
        recoverable: true,
      };
    }

    return {
      success: true,
      data: matches,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Contacts unavailable. Please check your Google Contacts connection.',
      errorCode: 'CONTACTS_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export function getAllContacts(sessionId: string = 'default'): ContactItem[] {
  const session = getSession(sessionId);
  return session.mockContacts;
}

