import { handleAuthCallback } from '../../server/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const authState = await handleAuthCallback(code);
  return res.json(authState);
}
