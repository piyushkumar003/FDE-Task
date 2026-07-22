import { getSession } from '../server/memory';

export default async function handler(req: any, res: any) {
  const sessionId = (req.query?.sessionId as string) || 'default';
  const session = getSession(sessionId);
  return res.json(session.memory);
}
