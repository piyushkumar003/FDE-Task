import { getAuthStatus } from '../../server/auth';

export default async function handler(req: any, res: any) {
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  return res.json(getAuthStatus(sessionId));
}

