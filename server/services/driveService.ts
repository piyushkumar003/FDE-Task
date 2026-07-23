import { searchDocuments } from '../tools/driveTool';
import { getSession } from '../memory';

export async function getFilesService(query: string = '', sessionId: string = 'default') {
  try {
    const res = await searchDocuments(query, sessionId);
    return {
      success: res.success,
      data: res.data || [],
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Drive service unavailable',
    };
  }
}

export async function getFileService(fileId: string, sessionId: string = 'default') {
  try {
    const session = getSession(sessionId);
    const doc = session.mockDocs.find((d) => d.id === fileId || d.name.toLowerCase().includes(fileId.toLowerCase()));
    if (!doc) {
      return {
        success: false,
        data: null,
        error: `Document matching "${fileId}" not found.`,
      };
    }
    return {
      success: true,
      data: doc,
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to retrieve document',
    };
  }
}
