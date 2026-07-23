import { logoutUser } from '../../server/services/authService';

export default async function handler(req: any, res: any) {
  const sessionId = req.body?.sessionId || req.query?.sessionId || 'default';
  const result = logoutUser(sessionId as string);
  return res.json(result);
}
