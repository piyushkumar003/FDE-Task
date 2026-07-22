import { list_events } from '../../server/tools/calendarTool';

export default async function handler(req: any, res: any) {
  const { startDate, endDate } = req.query || {};
  const result = await list_events(startDate as string, endDate as string);
  return res.json(result);
}
