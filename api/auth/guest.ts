import { handleGuestLogin } from '../../server/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId = 'default' } = req.body || {};
  const authState = handleGuestLogin(sessionId);
  return res.json(authState);
}
