import { deleteTask } from '../../server/tools/taskTool';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const taskId = (req.body?.taskId || req.body?.id || req.query?.taskId) as string;
  const result = await deleteTask(taskId);
  return res.json(result);
}
