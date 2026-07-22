import { list_events } from '../server/tools/calendarTool';
import { listTasks } from '../server/tools/taskTool';

export default async function handler(req: any, res: any) {
  try {
    const eventsRes = await list_events();
    const tasksRes = await listTasks('needsAction');

    return res.json({
      events: eventsRes.success ? eventsRes.data : [],
      tasks: tasksRes.success ? tasksRes.data : [],
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch agenda feed' });
  }
}
