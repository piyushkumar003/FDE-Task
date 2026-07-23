import { handleAuthCallback } from '../../server/auth';

export default async function handler(req: any, res: any) {
  const code = req.method === 'GET' ? req.query?.code : req.body?.code;
  const sessionId = req.method === 'GET' ? (req.query?.state || 'default') : (req.body?.sessionId || 'default');

  if (!code) {
    if (req.method === 'GET') {
      return res.redirect('/?error=Missing+authorization+code');
    }
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    await handleAuthCallback(code as string, sessionId as string);
    if (req.method === 'GET') {
      return res.redirect('/');
    }
    return res.json({ success: true });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    if (req.method === 'GET') {
      return res.redirect(`/?error=${encodeURIComponent(error?.message || 'Authentication failed')}`);
    }
    return res.status(500).json({ error: error?.message || 'Authentication failed' });
  }
}


