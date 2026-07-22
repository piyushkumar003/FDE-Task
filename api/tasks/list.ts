import { listTasks } from '../../server/tools/taskTool';

export default async function handler(req: any, res: any) {
  const status = (req.query?.status as 'needsAction' | 'completed' | 'all') || 'all';
  const result = await listTasks(status);
  return res.json(result);
}
