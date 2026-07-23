import { updateEventService } from '../../server/services/calendarService';

export default async function handler(req: any, res: any) {
  const sessionId = req.body?.sessionId || req.query?.sessionId || 'default';
  const result = await updateEventService(req.body, sessionId as string);
  return res.json(result);
}
