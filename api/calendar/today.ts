import { getTodayEventsService } from '../../server/services/calendarService';

export default async function handler(req: any, res: any) {
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  const result = await getTodayEventsService(sessionId as string);
  return res.json(result);
}
