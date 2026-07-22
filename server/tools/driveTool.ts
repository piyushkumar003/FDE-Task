import { DriveDocument, ToolResult } from '../../src/types';

let mockDocs: DriveDocument[] = [
  {
    id: 'doc-1',
    name: 'Q3 Product Strategy Roadmap.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    modifiedTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    webViewLink: 'https://docs.google.com/document/d/doc-1/edit',
  },
  {
    id: 'doc-2',
    name: 'AI Personal Assistant Architecture Specification.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    modifiedTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    webViewLink: 'https://docs.google.com/document/d/doc-2/edit',
  },
  {
    id: 'doc-3',
    name: 'Q3 Financial Budget Allocations.gsheet',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    modifiedTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    webViewLink: 'https://docs.google.com/spreadsheets/d/doc-3/edit',
  },
];

export async function searchDocuments(query: string): Promise<ToolResult> {
  try {
    const q = query.toLowerCase().trim();
    const matches = mockDocs.filter((d) => d.name.toLowerCase().includes(q));

    return {
      success: true,
      data: matches,
    };
  } catch (error: any) {
    return {
      success: false,
      reason: error?.message || 'Failed to search Google Drive documents',
      recoverable: true,
    };
  }
}
