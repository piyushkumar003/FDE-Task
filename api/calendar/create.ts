import { create_event } from '../../server/tools/calendarTool';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await create_event(req.body);
  return res.json(result);
}
