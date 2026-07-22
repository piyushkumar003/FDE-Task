import { delete_event } from '../../server/tools/calendarTool';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const eventId = (req.body?.eventId || req.body?.id || req.query?.eventId || req.query?.id) as string;
  const result = await delete_event(eventId);
  return res.json(result);
}
