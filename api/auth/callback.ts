import { handleAuthCallback } from '../../server/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, sessionId = 'default' } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const authState = await handleAuthCallback(code, sessionId);
    return res.json(authState);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Authentication failed' });
  }
}

