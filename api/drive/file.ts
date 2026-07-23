import { getFileService } from '../../server/services/driveService';

export default async function handler(req: any, res: any) {
  const fileId = req.query?.id || req.body?.id || req.query?.fileId || req.body?.fileId;
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  if (!fileId) {
    return res.json({ success: false, data: null, error: 'File ID is required' });
  }
  const result = await getFileService(fileId as string, sessionId as string);
  return res.json(result);
}
