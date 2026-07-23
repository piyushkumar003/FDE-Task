import { deleteEventService } from '../../server/services/calendarService';

export default async function handler(req: any, res: any) {
  const eventId = req.query?.eventId || req.body?.eventId || req.query?.id || req.body?.id;
  const sessionId = req.body?.sessionId || req.query?.sessionId || 'default';
  const result = await deleteEventService(eventId as string, sessionId as string);
  return res.json(result);
}
