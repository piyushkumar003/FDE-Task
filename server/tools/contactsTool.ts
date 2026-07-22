import { ContactItem, ToolResult } from '../../src/types';

let mockContacts: ContactItem[] = [
  {
    id: 'c-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 555-0192',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'c-2',
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.org',
    phone: '+1 555-0148',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'c-3',
    name: 'Alex Rivera',
    email: 'arivera@techcorp.io',
    phone: '+1 555-0831',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'c-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@design.co',
    phone: '+1 555-0922',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
  },
];

export async function findContact(query: string): Promise<ToolResult> {
  try {
    const q = query.toLowerCase().trim();
    const matches = mockContacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      return {
        success: false,
        reason: `No contact matching "${query}" found in Google Contacts.`,
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
      reason: error?.message || 'Failed to search contacts',
      recoverable: true,
    };
  }
}

export function getAllContacts(): ContactItem[] {
  return mockContacts;
}
