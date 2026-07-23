import { DriveDocument, ToolResult } from '../../src/types';
import { getSession } from '../memory';

export async function searchDocuments(query: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    const q = query.toLowerCase().trim();
    const matches = session.mockDocs.filter((d) => d.name.toLowerCase().includes(q));

    return {
      success: true,
      data: matches,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Drive unavailable. Please check your Google Drive connection.',
      errorCode: 'DRIVE_UNAVAILABLE',
      recoverable: true,
    };
  }
}

