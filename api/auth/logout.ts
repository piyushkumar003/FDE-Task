import { logoutUser } from '../../server/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  logoutUser();
  return res.json({ success: true });
}
