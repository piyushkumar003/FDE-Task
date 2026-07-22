import { generateAuthUrl } from '../../server/auth';

export default async function handler(req: any, res: any) {
  return res.json({ authUrl: generateAuthUrl() });
}
