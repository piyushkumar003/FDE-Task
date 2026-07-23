import { getRecentEmailsService } from '../../server/services/gmailService';

export default async function handler(req: any, res: any) {
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  const result = await getRecentEmailsService(sessionId as string);
  return res.json(result);
}
