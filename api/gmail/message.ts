import { getMessageService } from '../../server/services/gmailService';

export default async function handler(req: any, res: any) {
  const messageId = req.query?.id || req.body?.id || req.query?.messageId || req.body?.messageId;
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  if (!messageId) {
    return res.json({ success: false, data: null, error: 'Message ID is required' });
  }
  const result = await getMessageService(messageId as string, sessionId as string);
  return res.json(result);
}
