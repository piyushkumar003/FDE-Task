import { findContact, getAllContacts } from '../tools/contactsTool';

export async function getContactsService(query: string = '', sessionId: string = 'default') {
  try {
    if (!query) {
      const contacts = getAllContacts(sessionId);
      return {
        success: true,
        data: contacts,
        error: null,
      };
    }
    const res = await findContact(query, sessionId);
    return {
      success: res.success,
      data: res.data || [],
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Contacts service unavailable',
    };
  }
}
