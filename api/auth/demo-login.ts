import { handleDemoGoogleLogin } from '../../server/auth';

export default async function handler(req: any, res: any) {
  const sessionId = req.query?.state || 'default';
  try {
    handleDemoGoogleLogin(sessionId as string);
    return res.redirect('/');
  } catch (error: any) {
    return res.redirect(`/?error=${encodeURIComponent(error?.message || 'Demo login failed')}`);
  }
}
