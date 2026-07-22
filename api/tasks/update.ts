import { completeTask } from '../../server/tools/taskTool';

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const taskId = (req.body?.taskId || req.body?.id || req.query?.taskId) as string;
  const result = await completeTask(taskId);
  return res.json(result);
}
