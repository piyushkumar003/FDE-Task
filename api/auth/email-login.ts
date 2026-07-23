import { handleEmailLogin } from '../../server/auth';

export default async function handler(req: any, res: any) {
  try {
    const { email, password, sessionId = 'default' } = req.body || {};
    if (!email) {
      return res.json({ success: false, data: null, error: 'Email is required' });
    }
    const result = handleEmailLogin(email, password || '', sessionId);
    return res.json({ success: true, data: result, error: null });
  } catch (error: any) {
    return res.json({ success: false, data: null, error: error?.message || 'Email login failed' });
  }
}
