import { createTaskService } from '../../server/services/tasksService';

export default async function handler(req: any, res: any) {
  const sessionId = req.body?.sessionId || req.query?.sessionId || 'default';
  const result = await createTaskService(req.body, sessionId as string);
  return res.json(result);
}
