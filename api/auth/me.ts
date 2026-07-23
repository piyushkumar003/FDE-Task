import { getAuthMe } from '../../server/services/authService';

export default async function handler(req: any, res: any) {
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  const result = getAuthMe(sessionId);
  return res.json(result);
}
