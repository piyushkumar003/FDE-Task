import { deleteTaskService } from '../../server/services/tasksService';

export default async function handler(req: any, res: any) {
  const taskId = req.query?.id || req.body?.id || req.query?.taskId || req.body?.taskId;
  const sessionId = req.body?.sessionId || req.query?.sessionId || 'default';
  const result = await deleteTaskService(taskId as string, sessionId as string);
  return res.json(result);
}
