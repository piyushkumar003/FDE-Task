import { generateAuthUrl } from '../../server/auth';

export default async function handler(req: any, res: any) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'dummy-client-id' || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
    return res.json({ authUrl: '/api/auth/demo-login' });
  }
  try {
    return res.json({ authUrl: generateAuthUrl() });
  } catch (err) {
    return res.json({ authUrl: '/api/auth/demo-login' });
  }
}

