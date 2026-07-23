import { listEventsService } from '../../server/services/calendarService';

export default async function handler(req: any, res: any) {
  const { startDate, endDate, sessionId = 'default' } = req.query || {};
  const result = await listEventsService(startDate as string, endDate as string, sessionId as string);
  return res.json(result);
}
